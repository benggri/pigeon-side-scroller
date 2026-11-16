// 스프라이트 미리보기 PNG 생성 (개발용): npx tsx scripts/preview-sprites.ts <out.png>
import { writeFileSync } from "node:fs";
import { encodePNG } from "../node_modules/pixelfx/tools/lib/png.mjs";
import { createFrame, painterFor, composite, hex } from "../src/game/pixelfx";
import { drawPigeon, drawObstacle, type PigeonPose } from "../src/game/sprites";

const W = 200, H = 40, S = 5;
const f = createFrame(W, H);
const p = painterFor(f);
const base: PigeonPose = { facing: 1, walk: 0, moving: false, airborne: false, flutter: false, vy: 0, hurt: false, blink: false, time: 0 };
const poses: Partial<PigeonPose>[] = [
  {}, { moving: true, walk: 0.1 }, { moving: true, walk: 0.2 }, { moving: true, walk: 0.3 },
  { airborne: true, vy: -100 }, { airborne: true, vy: 100 }, { hurt: true }, { facing: -1, moving: true, walk: 0.1 },
];
poses.forEach((o, i) => drawPigeon(p, 12 + i * 24, 30, { ...base, ...o }));
drawObstacle(p, "cone", 4, 40); drawObstacle(p, "hydrant", 24, 40); drawObstacle(p, "can", 44, 40);
const small = new Uint8ClampedArray(W * H * 4);
composite(f, small, hex("#cfe8ff"));
const big = new Uint8ClampedArray(W * S * H * S * 4);
for (let y = 0; y < H * S; y++) for (let x = 0; x < W * S; x++) {
  const si = (Math.floor(y / S) * W + Math.floor(x / S)) * 4, di = (y * W * S + x) * 4;
  for (let k = 0; k < 4; k++) big[di + k] = small[si + k];
}
writeFileSync(process.argv[2], encodePNG(W * S, H * S, big));
