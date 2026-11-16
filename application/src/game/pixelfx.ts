// pixelfx 를 타입이 있는 얇은 래퍼로 감싼다. (pixelfx 는 순수 JS 라이브러리)
import * as core from "pixelfx";
import * as slimeMod from "pixelfx/fx/critters/slime";
import * as batMod from "pixelfx/fx/critters/bat";
import * as coinMod from "pixelfx/fx/pickups/coin-spin";
import * as poofMod from "pixelfx/fx/spawn/poof";
import * as collectMod from "pixelfx/fx/pickups/collect-burst";
import * as hitSparkMod from "pixelfx/fx/impacts/hit-spark";
import * as confettiMod from "pixelfx/fx/ui/confetti";
import * as blossomMod from "pixelfx/fx/weather/cherry-blossoms";

export type Frame = { w: number; h: number; ox: number; oy: number; color: Uint32Array; light: Uint32Array };

export interface Painter {
  place(x: number, y: number, flip?: boolean, angle?: number): void;
  px(x: number, y: number, c: number): void;
  dot(x: number, y: number, c: number, a?: number): void;
  rect(x: number, y: number, w: number, h: number, c: number, a?: number): void;
  ellipse(cx: number, cy: number, rx: number, ry: number, c: number, a?: number): void;
  circle(cx: number, cy: number, r: number, c: number, a?: number): void;
  line(x0: number, y0: number, x1: number, y1: number, c: number, a?: number): void;
  poly(pts: [number, number][], c: number, a?: number): void;
  glow(x: number, y: number, r: number, c: number, k?: number): void;
  sprite(rows: string[], pal: Record<string, string | number>, x: number, y: number,
    opts?: { scale?: number; a?: number; flip?: boolean; flipY?: boolean; tint?: number }): void;
  text(str: string, x: number, y: number, c: number,
    opts?: { font?: "mini" | "big"; scale?: number; align?: "left" | "center" | "right"; outline?: number; shadow?: number; a?: number }): void;
}

export type FxOptions = { x?: number; y?: number; flip?: boolean; seed?: number; palette?: string[]; light?: number; [k: string]: unknown };

export interface Fx {
  readonly t: number;
  options: FxOptions;
  meta: { duration?: number; loop?: boolean };
  update(dt: number): void;
  draw(frame: Frame, layer?: "back" | "front"): void;
  stop(): void;
  done(): boolean;
}

type FxModule = { meta: unknown };

const c = core as unknown as {
  createFrame(w: number, h: number): Frame;
  clearFrame(f: Frame): Frame;
  createFx(mod: FxModule, o?: FxOptions): Fx;
  composite(f: Frame, out: Uint8ClampedArray, bg?: number | Uint32Array | null, lightK?: number): Uint8ClampedArray;
  painterFor(f: Frame): Painter;
  hex(h: string | number): number;
};

export const createFrame = c.createFrame;
export const clearFrame = c.clearFrame;
export const createFx = c.createFx;
export const composite = c.composite;
export const painterFor = c.painterFor;
export const hex = c.hex;

export const FX = {
  slime: slimeMod as FxModule,
  bat: batMod as FxModule,
  coin: coinMod as FxModule,
  poof: poofMod as FxModule,
  collect: collectMod as FxModule,
  hitSpark: hitSparkMod as FxModule,
  confetti: confettiMod as FxModule,
  blossom: blossomMod as FxModule,
};
