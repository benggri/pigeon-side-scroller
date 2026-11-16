// 게임 상태와 한 프레임 진행. DOM 없이 돌아가므로 테스트할 수 있다.
import * as K from "./constants";
import { FIRST_SPAWN_X, ensureLevel, mulberry32 } from "./level";
import { FX, createFx } from "./pixelfx";
import type { Box, Input, Monster, Obstacle, World } from "./types";

export function createWorld(seed = Date.now() % 100000, withFx = true): World {
  const w: World = {
    seed,
    rng: mulberry32(seed),
    time: 0,
    player: {
      x: 60, y: K.GROUND_Y, vx: 0, vy: 0, onGround: true, facing: 1,
      coyote: 0, jumpBuffer: 0, jumpHeld: false, invuln: 0, walk: 0, blinkT: 2,
    },
    hearts: K.MAX_HEARTS,
    coins: 0,
    stomps: 0,
    maxX: 60,
    camX: 0,
    obstacles: [],
    monsters: [],
    pickups: [],
    effects: [],
    nextSpawnX: FIRST_SPAWN_X,
    nextMilestone: 100,
    state: "playing",
    dyingT: 0,
    events: [],
    withFx,
  };
  ensureLevel(w);
  return w;
}

export const meters = (w: World) => Math.floor((w.maxX - 60) / K.PX_PER_METER);
export const score = (w: World) => meters(w) + w.coins * 10 + w.stomps * 20;

export const playerBox = (w: World): Box => {
  const p = w.player;
  return { x: p.x - K.PIGEON_BOX.w / 2, y: p.y - K.PIGEON_BOX.h, w: K.PIGEON_BOX.w, h: K.PIGEON_BOX.h };
};
export const obstacleBox = (o: Obstacle): Box => ({ x: o.x + 1, y: K.GROUND_Y - o.h, w: o.w - 2, h: o.h });
export function monsterBox(m: Monster): Box {
  if (m.type === "slime") return { x: m.x - 11, y: m.y - 15, w: 22, h: 15 };
  return { x: m.x - 8, y: m.y - 5, w: 16, h: 10 };
}
export const overlap = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function spawnFx(w: World, mod: keyof typeof FX, x: number, y: number, screen = false) {
  if (!w.withFx) return;
  w.effects.push({ fx: createFx(FX[mod], { x, y, seed: Math.floor(w.rng() * 1000) }), x, y, screen });
}

function hurt(w: World, fromX: number) {
  const p = w.player;
  if (p.invuln > 0 || w.state !== "playing") return;
  w.hearts -= 1;
  w.events.push("hurt");
  spawnFx(w, "hitSpark", p.x, p.y - 8);
  const away = p.x < fromX ? -1 : 1;
  p.vx = away * K.KNOCKBACK_X;
  p.vy = -K.KNOCKBACK_Y;
  p.onGround = false;
  p.invuln = K.INVULN_TIME;
  if (w.hearts <= 0) {
    w.state = "dying";
    w.dyingT = 0;
    w.events.push("gameover");
  }
}

function movePlayer(w: World, input: Input, dt: number) {
  const p = w.player;
  const control = w.state === "playing";
  const dirIn = control ? (input.right ? 1 : 0) - (input.left ? 1 : 0) : 0;
  const wasHeld = p.jumpHeld;
  const jumpPressed = control && input.jump && !wasHeld;
  p.jumpHeld = input.jump;

  // 좌우 이동 (넉백 중에는 조작이 덜 먹힌다)
  const target = dirIn * K.RUN_SPEED;
  const accel = dirIn !== 0 ? K.RUN_ACCEL : K.RUN_DECEL;
  const k = p.invuln > K.INVULN_TIME - 0.25 ? 0.2 : 1;
  if (p.vx < target) p.vx = Math.min(target, p.vx + accel * k * dt);
  else if (p.vx > target) p.vx = Math.max(target, p.vx - accel * k * dt);
  if (dirIn !== 0) p.facing = dirIn > 0 ? 1 : -1;

  // 점프: 코요테 타임 + 입력 버퍼
  p.coyote = p.onGround ? K.COYOTE : Math.max(0, p.coyote - dt);
  p.jumpBuffer = jumpPressed ? K.JUMP_BUFFER : Math.max(0, p.jumpBuffer - dt);
  if (p.jumpBuffer > 0 && p.coyote > 0) {
    p.vy = -K.JUMP_V;
    p.onGround = false;
    p.coyote = 0;
    p.jumpBuffer = 0;
    w.events.push("jump");
  }
  // 점프 키를 일찍 떼면 낮게 뛴다
  if (!input.jump && wasHeld && p.vy < 0 && !p.onGround) p.vy *= K.JUMP_CUT;

  // 중력, 그리고 파닥파닥 (공중에서 점프 키 유지 시 천천히 내려온다)
  p.vy = Math.min(K.MAX_FALL, p.vy + K.GRAVITY * dt);
  const flutter = control && input.jump && p.vy > K.FLUTTER_FALL && !p.onGround;
  if (flutter) p.vy = K.FLUTTER_FALL;

  const prevBottom = p.y;
  // 가로 이동 후 장애물 옆면 검사
  p.x += p.vx * dt;
  const minX = w.camX + 8;
  if (p.x < minX) { p.x = minX; if (p.vx < 0) p.vx = 0; }
  for (const o of w.obstacles) {
    const b = playerBox(w), ob = obstacleBox(o);
    if (!overlap(b, ob)) continue;
    if (prevBottom <= ob.y + 2) continue; // 위에서 내려오는 중이면 세로 처리에 맡긴다
    p.x = p.x < o.x + o.w / 2 ? ob.x - K.PIGEON_BOX.w / 2 : ob.x + ob.w + K.PIGEON_BOX.w / 2;
    hurt(w, o.x + o.w / 2);
  }

  // 세로 이동: 땅, 장애물 윗면
  p.y += p.vy * dt;
  let floor = K.GROUND_Y;
  const b = playerBox(w);
  for (const o of w.obstacles) {
    const ob = obstacleBox(o);
    if (b.x < ob.x + ob.w && b.x + b.w > ob.x && prevBottom <= ob.y + 0.5) floor = Math.min(floor, ob.y);
  }
  if (p.vy >= 0 && p.y >= floor) {
    p.y = floor;
    p.vy = 0;
    p.onGround = true;
  } else {
    p.onGround = false;
  }

  p.walk = Math.abs(p.vx) > 10 && p.onGround ? p.walk + dt : 0;
  if (flutter && Math.floor(w.time * 8) !== Math.floor((w.time - dt) * 8)) w.events.push("flutter");
}

const SLIME_PERIOD = 1.8, SLIME_AIR = [0.9, 1.44], SLIME_SPEED = 42, BAT_SPEED = 22;

function updateMonsters(w: World, dt: number) {
  const p = w.player;
  for (const m of w.monsters) {
    if (!m.alive) continue;
    const active = m.x < w.camX + K.VIEW_W + 40;
    if (!active) continue;
    m.phase += dt;
    if (m.type === "slime") {
      // 슬라임은 공중에 떠 있을 때만 앞으로 나아간다 (pixelfx 점프 애니메이션에 맞춤)
      const t = m.phase % SLIME_PERIOD;
      if (t > SLIME_AIR[0] && t < SLIME_AIR[1]) m.x += m.dir * SLIME_SPEED * dt;
      if (m.x < m.minX) { m.x = m.minX; m.dir = 1; }
      if (m.x > m.maxX) { m.x = m.maxX; m.dir = -1; }
      if (m.fx) { m.fx.options.flip = m.dir < 0; m.fx.update(dt); }
    } else {
      m.x -= BAT_SPEED * dt;
      m.y = m.baseY + Math.sin(m.phase * 2.2) * 6;
      m.fx?.update(dt);
    }
    if (w.state !== "playing") continue;
    const pb = playerBox(w), mb = monsterBox(m);
    if (!overlap(pb, mb)) continue;
    // 위에서 밟으면 처치, 아니면 다친다
    if (p.vy > 0 && p.y - p.vy * dt <= mb.y + 6) {
      m.alive = false;
      w.stomps += 1;
      p.vy = -(p.jumpHeld ? K.STOMP_BOUNCE * 1.25 : K.STOMP_BOUNCE);
      p.onGround = false;
      w.events.push("stomp");
      spawnFx(w, "poof", m.x, m.type === "slime" ? m.y : m.y + 8);
    } else {
      hurt(w, m.x);
    }
  }
}

function updatePickups(w: World, dt: number) {
  const pb = playerBox(w);
  for (const c of w.pickups) {
    if (c.taken) continue;
    c.fx?.update(dt);
    if (overlap(pb, { x: c.x - 5, y: c.y - 12, w: 10, h: 12 })) {
      c.taken = true;
      w.coins += 1;
      w.events.push("coin");
      spawnFx(w, "collect", c.x, c.y);
    }
  }
}

function updateEffects(w: World, dt: number) {
  for (const e of w.effects) e.fx.update(dt);
  w.effects = w.effects.filter((e) => !e.fx.done());
}

/** 한 프레임 진행. dt 는 초. 큰 dt 는 잘게 나눈다. */
export function step(w: World, input: Input, dt: number) {
  dt = Math.min(dt, 0.1);
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  for (let i = 0; i < n; i++) substep(w, input, dt / n);
}

function substep(w: World, input: Input, dt: number) {
  if (w.state === "over") return;
  w.time += dt;
  const p = w.player;
  p.invuln = Math.max(0, p.invuln - dt);
  p.blinkT -= dt;
  if (p.blinkT < -0.12) p.blinkT = 2 + w.rng() * 2.5;

  movePlayer(w, input, dt);
  updateMonsters(w, dt);
  updatePickups(w, dt);
  updateEffects(w, dt);

  if (w.state === "dying") {
    w.dyingT += dt;
    if (w.dyingT > 1.6) w.state = "over";
    return;
  }

  w.maxX = Math.max(w.maxX, p.x);
  // 카메라는 앞으로만 간다
  w.camX = Math.max(w.camX, Math.round(p.x - K.VIEW_W * 0.38));
  if (meters(w) >= w.nextMilestone) {
    w.events.push("milestone");
    spawnFx(w, "confetti", K.VIEW_W / 2, K.GROUND_Y - 10, true);
    w.nextMilestone += 100;
  }
  ensureLevel(w);
}
