// 한 프레임 그리기: 배경(시차 스크롤) → 장애물/동전/몬스터 → 비둘기 → 효과.
import { GROUND_Y, VIEW_H, VIEW_W } from "./constants";
import { clearFrame, composite, hex, painterFor, type Frame, type Fx, type Painter } from "./pixelfx";
import { drawObstacle, drawPigeon } from "./sprites";
import type { World } from "./types";

const C = {
  skyTop: hex("#7ec8f5"), skyBot: hex("#e8f6ff"), sun: hex("#fff3b0"), sunCore: hex("#fffbe6"),
  cloud: hex("#ffffff"), cloudShade: hex("#dceefc"),
  far: hex("#b9c4e6"), farWin: hex("#d9e0f5"), mid: hex("#9fb0dc"), midWin: hex("#ffe9a8"),
  bush: hex("#6cc47a"), bushDark: hex("#4fa463"), trunk: hex("#8a6a5a"), lamp: hex("#5b5f7d"),
  grass: hex("#7fd36e"), grassDark: hex("#5bb45a"), walk: hex("#f1dfc6"), walkLine: hex("#d9c3a5"),
  curb: hex("#c9ad8c"), dirt: hex("#b48d6c"), shadow: hex("#2b2540"), outline: hex("#2b2540"),
};

const hash = (i: number, s = 0) => {
  let h = (i * 374761393 + s * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const lerpC = (a: number, b: number, t: number) => {
  const ch = (sh: number) => Math.round(((a >>> sh) & 255) * (1 - t) + ((b >>> sh) & 255) * t);
  return (255 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0);
};
const SKY = Array.from({ length: VIEW_H }, (_, y) => lerpC(C.skyTop, C.skyBot, Math.min(1, y / GROUND_Y)));

function drawSky(p: Painter) {
  for (let y = 0; y < GROUND_Y; y++) p.rect(0, y, VIEW_W, 1, SKY[y]);
  p.circle(268, 34, 14, C.sun);
  p.circle(268, 34, 10, C.sunCore);
}

function drawClouds(p: Painter, cam: number) {
  const off = cam * 0.15, T = 140;
  for (let i = Math.floor(off / T) - 1; i <= Math.floor((off + VIEW_W) / T) + 1; i++) {
    if (hash(i, 1) < 0.3) continue;
    const x = i * T - off + hash(i, 2) * 60, y = 18 + hash(i, 3) * 40, s = 0.7 + hash(i, 4) * 0.6;
    p.ellipse(x, y + 3, 22 * s, 6 * s, C.cloudShade);
    p.ellipse(x - 10 * s, y, 11 * s, 8 * s, C.cloud);
    p.ellipse(x + 6 * s, y - 3 * s, 13 * s, 10 * s, C.cloud);
    p.ellipse(x + 18 * s, y + 1, 9 * s, 6 * s, C.cloud);
  }
}

function drawBuildings(p: Painter, cam: number, k: number, T: number, base: number, body: number, win: number, salt: number) {
  const off = cam * k;
  for (let i = Math.floor(off / T) - 1; i <= Math.floor((off + VIEW_W) / T) + 1; i++) {
    const x = Math.round(i * T - off), w = Math.round(T * (0.6 + hash(i, salt) * 0.35));
    const h = Math.round(base + hash(i, salt + 1) * base * 0.9);
    p.rect(x, GROUND_Y - h, w, h, body);
    if (hash(i, salt + 2) < 0.4) p.rect(x + Math.round(w / 2) - 1, GROUND_Y - h - 6, 2, 6, body); // 안테나
    for (let wy = GROUND_Y - h + 5; wy < GROUND_Y - 6; wy += 8)
      for (let wx = x + 4; wx < x + w - 4; wx += 7)
        if (hash(i * 97 + wx * 7 + wy, salt + 3) < 0.7) p.rect(wx, wy, 3, 4, win);
  }
}

function drawPark(p: Painter, cam: number) {
  const off = cam * 0.6, T = 70;
  for (let i = Math.floor(off / T) - 1; i <= Math.floor((off + VIEW_W) / T) + 1; i++) {
    const x = Math.round(i * T - off + hash(i, 20) * 30);
    const r = hash(i, 21);
    if (r < 0.45) {
      const s = 8 + hash(i, 22) * 6;
      p.ellipse(x, GROUND_Y - s * 0.5, s * 1.6, s, C.bushDark);
      p.ellipse(x - 2, GROUND_Y - s * 0.7, s * 1.3, s * 0.8, C.bush);
    } else if (r < 0.8) {
      const h = 22 + hash(i, 23) * 14;
      p.rect(x - 1, GROUND_Y - h, 3, h, C.trunk);
      p.circle(x, GROUND_Y - h - 6, 12, C.bushDark);
      p.circle(x - 3, GROUND_Y - h - 9, 9, C.bush);
    } else {
      p.rect(x, GROUND_Y - 38, 2, 38, C.lamp);
      p.rect(x - 3, GROUND_Y - 41, 8, 3, C.lamp);
      p.glow(x + 1, GROUND_Y - 37, 4, C.midWin, 0.25);
    }
  }
}

function drawGround(p: Painter, cam: number) {
  p.rect(0, GROUND_Y, VIEW_W, 3, C.grass);
  for (let x = -((cam) % 6); x < VIEW_W; x += 6) p.rect(Math.round(x), GROUND_Y, 2, 1, C.grassDark);
  p.rect(0, GROUND_Y + 3, VIEW_W, 16, C.walk);
  for (let x = -(cam % 24); x < VIEW_W; x += 24) p.rect(Math.round(x), GROUND_Y + 3, 1, 16, C.walkLine);
  p.rect(0, GROUND_Y + 10, VIEW_W, 1, C.walkLine);
  p.rect(0, GROUND_Y + 19, VIEW_W, 3, C.curb);
  p.rect(0, GROUND_Y + 22, VIEW_W, VIEW_H - GROUND_Y - 22, C.dirt);
}

const shadow = (p: Painter, x: number, w: number) => p.ellipse(x, GROUND_Y + 1, w, 1.5, C.shadow, 0.25);

/** 세계를 frame 에 그리고 out(RGBA) 에 합성한다. */
export function render(w: World, frame: Frame, out: Uint8ClampedArray) {
  clearFrame(frame);
  const cam = w.camX;
  let p = painterFor(frame);
  drawSky(p);
  drawClouds(p, cam);
  drawBuildings(p, cam, 0.25, 52, 34, C.far, C.farWin, 10);
  drawBuildings(p, cam, 0.4, 64, 24, C.mid, C.midWin, 30);
  drawPark(p, cam);
  drawGround(p, cam);

  p.place(-cam, 0);
  for (const o of w.obstacles) { shadow(p, o.x + o.w / 2, o.w / 2 + 1); drawObstacle(p, o.kind, o.x, GROUND_Y); }
  for (const m of w.monsters) if (m.alive && m.type === "slime") shadow(p, m.x, 10);
  const pl = w.player;
  shadow(p, pl.x, Math.max(3, 8 - (GROUND_Y - pl.y) / 8));

  // pixelfx 효과는 화면 좌표로 옮겨서 그린다
  const drawFx = (fx: Fx | null, x: number, y: number, layer?: "front") => {
    if (!fx) return;
    fx.options.x = Math.round(x - cam);
    fx.options.y = Math.round(y);
    fx.draw(frame, layer);
  };
  // coin-spin 은 원점 17px 위에 떠 있다. 바닥 그림자(back)는 빼고 동전만 그린다.
  for (const c of w.pickups) if (!c.taken) drawFx(c.fx, c.x, c.y + 17, "front");
  for (const m of w.monsters) if (m.alive) drawFx(m.fx, m.x, m.y);

  p = painterFor(frame);
  p.place(-cam, 0);
  const blinkOut = pl.invuln > 0 && w.state === "playing" && Math.floor(pl.invuln * 12) % 2 === 0;
  if (!blinkOut && !(w.state === "over")) {
    drawPigeon(p, Math.round(pl.x), Math.round(pl.y), {
      facing: pl.facing, walk: pl.walk, moving: Math.abs(pl.vx) > 10, airborne: !pl.onGround,
      flutter: pl.jumpHeld && !pl.onGround && pl.vy > 0, vy: pl.vy,
      hurt: pl.invuln > 1 || w.state !== "playing", blink: pl.blinkT < 0, time: w.time,
    });
  }

  for (const e of w.effects) drawFx(e.fx, e.screen ? e.x + cam : e.x, e.y);

  composite(frame, out, C.skyBot);
}
