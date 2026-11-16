// pixelfx 는 타입 선언이 없는 JS 패키지. 실제 타입은 src/game/pixelfx.ts 에서 좁힌다.
declare module "pixelfx";
declare module "pixelfx/fx/*";
declare module "*/pixelfx/tools/lib/png.mjs" {
  export function encodePNG(w: number, h: number, rgba: Uint8Array | Uint8ClampedArray): Uint8Array;
}
