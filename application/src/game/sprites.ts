// 직접 그린 픽셀 스프라이트: 비둘기와 장애물. pixelfx Painter.sprite 로 그린다.
import type { Painter } from "./pixelfx";

type Pal = Record<string, string>;

export const PIGEON_PAL: Pal = {
  K: "#2b2540", // 외곽선
  G: "#b4bed2", // 몸 밝은 회색
  g: "#8d98b2", // 몸 중간
  d: "#5f6886", // 날개 줄무늬
  W: "#d6dcea", // 가슴 하이라이트
  N: "#4fbf94", // 목 초록 광택
  P: "#9a6cc4", // 목 보라 광택
  E: "#ff8a3d", // 눈
  e: "#2b2540", // 눈동자
  B: "#4a4258", // 부리
  c: "#f4f6fb", // 콧등(납막)
  F: "#f2879a", // 발
  T: "#4c5577", // 꼬리
  R: "#ff9fb4", // 볼터치
};

const BODY = [
  "....KKKKKK....",
  "..KKGGGGGGKK..",
  "KKTgGGGGGGGGK.",
  "KTTgGGGGGGWWGK",
  "KTTdgGGGGWWWWK",
  ".KTTdggGWWWWK.",
  "..KKKdggWWKK..",
  ".....KKKKKK...",
];

const HEAD = [
  "..KKKK...",
  ".KGGGGK..",
  "KGGGGEeK.",
  "KGRGGGcK.",
  "KNNGGKBBK",
  "KNPNNKKK.",
  ".KNPNK...",
];

const HEAD_BLINK = [
  "..KKKK...",
  ".KGGGGK..",
  "KGGGGKKK.",
  "KGRGGGcK.",
  "KNNGGKBBK",
  "KNPNNKKK.",
  ".KNPNK...",
];

const HEAD_HURT = [
  "..KKKK...",
  ".KGGGGK..",
  "KGGGKeKK.",
  "KGRGGKcK.",
  "KNNGGKBBK",
  "KNPNNKKK.",
  ".KNPNK...",
];

const WING_FOLD = [
  "KKKKKK.",
  "KdggggK",
  ".KddggK",
  "..KKKK.",
];

const WING_UP = [
  "....KK",
  "...KgK",
  "..KggK",
  ".KgdgK",
  "KddgK.",
  "KKKK..",
];

const WING_DOWN = [
  "KKKKKK.",
  "KdggggK",
  ".KdggK.",
  "..KdgK.",
  "...KK..",
];

const LEGS = [
  // 서 있기
  ["..F..F..", "..F..F..", "..F..F..", ".FFF.FFF"],
  // 걷기 1
  ["..F..F..", "..F...F.", ".F....F.", "FFF..FFF"],
  // 걷기 2
  ["...FF...", "...F.F..", "...F..F.", "..FFFFFF"],
];

export type PigeonPose = {
  facing: 1 | -1;
  walk: number; // 걷기 위상 (초 누적)
  moving: boolean;
  airborne: boolean;
  flutter: boolean;
  vy: number;
  hurt: boolean;
  blink: boolean;
  time: number;
};

function part(p: Painter, rows: string[], cx: number, by: number, dx: number, dy: number, flip: boolean, a = 1) {
  const w = rows[0].length;
  const x = flip ? cx - dx - w : cx + dx;
  p.sprite(rows, PIGEON_PAL, Math.round(x), Math.round(by + dy), { flip, a });
}

/** 발 중앙 (cx, by) 에 비둘기를 그린다. */
export function drawPigeon(p: Painter, cx: number, by: number, s: PigeonPose, a = 1) {
  const flip = s.facing < 0;
  const step = Math.floor(s.walk * 10) % 4; // 0..3
  // 걸을 때 비둘기 특유의 머리 까딱 (앞/뒤)
  const bob = s.moving && !s.airborne ? [0, 1, 2, 1][step] : 0;
  const bodyLift = s.moving && !s.airborne && (step === 1 || step === 3) ? -1 : 0;
  const y = by + bodyLift;

  // 그림자는 호출 쪽에서 그린다.
  if (!s.airborne) {
    const legs = s.moving ? LEGS[step % 2 === 0 ? 1 : 2] : LEGS[0];
    part(p, legs, cx, by, -5, -4, flip, a);
  } else {
    part(p, ["..F.F..", ".FF.FF."], cx, by, -4, -5, flip, a);
  }
  part(p, BODY, cx, y, -9, -12, flip, a);
  const head = s.hurt ? HEAD_HURT : s.blink ? HEAD_BLINK : HEAD;
  part(p, head, cx, y, 0 + bob, -17, flip, a);

  let wing = WING_FOLD, wdy = -9, wdx = -5;
  if (s.airborne) {
    const flap = s.flutter ? Math.floor(s.time * 16) % 2 === 0 : s.vy < 0;
    if (flap) {
      wing = WING_UP; wdy = -15; wdx = -5;
    } else {
      wing = WING_DOWN; wdy = -9; wdx = -5;
    }
  }
  part(p, wing, cx, y, wdx, wdy, flip, a);
}

// ---------- 장애물 ----------

const CONE = [
  ".....KK.....",
  "....KffK....",
  "....KffK....",
  "...KwwwwK...",
  "...KwwwwK...",
  "..KffffffK..",
  "..KffffffK..",
  ".KwwwwwwwwK.",
  ".KwwwwwwwwK.",
  ".KffffffffK.",
  "KKKKKKKKKKKK",
  "KbbbbbbbbbbK",
  "KKKKKKKKKKKK",
];
const CONE_PAL: Pal = { K: "#3a2a3a", f: "#ff7a3c", w: "#fff4e6", b: "#5a4a5a" };

const HYDRANT = [
  "....KKKK....",
  "...KrrrrK...",
  "..KKKKKKKK..",
  "..KrrhrrrK..",
  "KKKrrhrrrKKK",
  "KyKrrhrrrKyK",
  "KKKrrhrrrKKK",
  "..KrrhrrrK..",
  "..KrrrrrrK..",
  "..KrrrrrrK..",
  ".KKKKKKKKKK.",
  ".KddddddddK.",
  ".KKKKKKKKKK.",
];
const HYDRANT_PAL: Pal = { K: "#3a1f2e", r: "#e8475a", h: "#ff9aa6", y: "#ffd25a", d: "#a82a40" };

const CAN = [
  ".KKKKKKKKKKKK.",
  "KllllllllllllK",
  "KKKKKKKKKKKKKK",
  ".KggggggggggK.",
  ".KgGgggGgggGK.",
  ".KgGgggGgggGK.",
  ".KgGgggGgggGK.",
  ".KgGgggGgggGK.",
  ".KgGgggGgggGK.",
  ".KgGgggGgggGK.",
  ".KggggggggggK.",
  ".KKKKKKKKKKKK.",
];
const CAN_PAL: Pal = { K: "#23304a", l: "#7fd0c0", g: "#4aa898", G: "#2f7f74" };

export type ObstacleKind = "cone" | "hydrant" | "can";

export const OBSTACLES: Record<ObstacleKind, { rows: string[]; pal: Pal }> = {
  cone: { rows: CONE, pal: CONE_PAL },
  hydrant: { rows: HYDRANT, pal: HYDRANT_PAL },
  can: { rows: CAN, pal: CAN_PAL },
};

export function obstacleSize(kind: ObstacleKind) {
  const r = OBSTACLES[kind].rows;
  return { w: r[0].length, h: r.length };
}

/** 장애물의 왼쪽 아래 (x, by) 기준으로 그린다. */
export function drawObstacle(p: Painter, kind: ObstacleKind, x: number, by: number) {
  const o = OBSTACLES[kind];
  p.sprite(o.rows, o.pal, Math.round(x), Math.round(by - o.rows.length));
}
