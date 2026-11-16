// 앞쪽으로 끝없이 레벨을 만들어 낸다. 시드 고정 난수라 같은 시드면 같은 레벨.
import { GROUND_Y, PX_PER_METER, VIEW_W } from "./constants";
import { FX, createFx } from "./pixelfx";
import { obstacleSize, type ObstacleKind } from "./sprites";
import type { World } from "./types";

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const FIRST_SPAWN_X = 300;
const KINDS: ObstacleKind[] = ["cone", "hydrant", "can"];

/** 0(쉬움) → 1(어려움). 약 400m 에 걸쳐 천천히 오른다. */
export function difficulty(w: World) {
  return Math.min(1, w.maxX / PX_PER_METER / 400);
}

function addObstacle(w: World, x: number, kind?: ObstacleKind) {
  const k = kind ?? KINDS[Math.floor(w.rng() * KINDS.length)];
  const s = obstacleSize(k);
  w.obstacles.push({ kind: k, x, w: s.w, h: s.h });
  return s;
}

function addCoin(w: World, x: number, y: number) {
  const fx = w.withFx ? createFx(FX.coin, { x, y, seed: Math.floor(w.rng() * 1000) }) : null;
  if (fx) fx.update(w.rng() * 1.6); // 동전마다 회전 위상을 다르게
  w.pickups.push({ x, y, taken: false, fx });
}

function addCoinArc(w: World, cx: number, n = 5) {
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0.5 : i / (n - 1);
    addCoin(w, cx + (u - 0.5) * 56, GROUND_Y - 30 - Math.sin(u * Math.PI) * 26);
  }
}

function addSlime(w: World, x: number) {
  const dir = w.rng() < 0.5 ? 1 : -1;
  const phase = w.rng() * 1.8;
  const fx = w.withFx ? createFx(FX.slime, { x, y: GROUND_Y, hop: 10, light: 0.35, seed: Math.floor(w.rng() * 1000), flip: dir < 0 }) : null;
  fx?.update(phase); // 이동(phase)과 점프 애니메이션 위상을 맞춘다
  w.monsters.push({ type: "slime", x, y: GROUND_Y, baseY: GROUND_Y, dir, minX: x - 36, maxX: x + 36, phase, alive: true, fx });
}

function addBat(w: World, x: number) {
  const baseY = GROUND_Y - 16 - Math.floor(w.rng() * 10);
  const fx = w.withFx ? createFx(FX.bat, { x, y: baseY, seed: Math.floor(w.rng() * 1000), flip: true }) : null;
  w.monsters.push({ type: "bat", x, y: baseY, baseY, dir: -1, minX: x - 60, maxX: x + 20, phase: w.rng() * 6, alive: true, fx });
}

/** 패턴 하나를 x 에 놓고, 차지한 폭을 돌려준다. */
function spawnPattern(w: World, x: number): number {
  const d = difficulty(w);
  const r = w.rng();
  if (r < 0.3) {
    const s = addObstacle(w, x);
    if (w.rng() < 0.5) addCoin(w, x + s.w / 2, GROUND_Y - s.h - 22);
    return s.w;
  }
  if (r < 0.45) {
    addCoinArc(w, x + 28);
    return 56;
  }
  if (r < 0.7) {
    addSlime(w, x + 36);
    return 72;
  }
  if (r < 0.7 + 0.15 + d * 0.1) {
    addBat(w, x + 20);
    return 40;
  }
  // 장애물 두 개 사이에 동전
  const a = addObstacle(w, x);
  const gap = 46 - d * 10;
  addCoin(w, x + a.w + gap / 2, GROUND_Y - 34);
  const b = addObstacle(w, x + a.w + gap);
  return a.w + gap + b.w;
}

/** 카메라 앞쪽까지 레벨을 채우고, 지나간 것은 치운다. */
export function ensureLevel(w: World) {
  while (w.nextSpawnX < w.camX + VIEW_W + 80) {
    const used = spawnPattern(w, w.nextSpawnX);
    const d = difficulty(w);
    const gap = 110 + w.rng() * 90 - d * 50;
    w.nextSpawnX += used + gap;
  }
  const left = w.camX - 80;
  w.obstacles = w.obstacles.filter((o) => o.x + o.w > left);
  w.monsters = w.monsters.filter((m) => m.alive && m.x > left);
  w.pickups = w.pickups.filter((c) => !c.taken && c.x > left);
}
