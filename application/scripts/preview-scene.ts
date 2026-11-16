// 게임 화면 미리보기 PNG (개발용): npx tsx scripts/preview-scene.ts <out.png> [seconds]
import { writeFileSync } from "node:fs";
import { encodePNG } from "../node_modules/pixelfx/tools/lib/png.mjs";
import { VIEW_H as H, VIEW_W as W } from "../src/game/constants";
import { createFrame } from "../src/game/pixelfx";
import { render } from "../src/game/render";
import { createWorld, step } from "../src/game/world";

const S = 3, secs = Number(process.argv[3] ?? 2.2);
const w = createWorld(Number(process.argv[4] ?? 5));
if (process.argv[5]) w.player.invuln = 1e9;
const f = createFrame(W, H), small = new Uint8ClampedArray(W * H * 4);
for (let t = 0; t < secs; t += 1 / 60) {
  const jump = process.argv[5] ? t % 0.9 < 0.5 : t > secs - 0.35;
  step(w, { left: false, right: true, jump }, 1 / 60);
  render(w, f, small);
}
const big = new Uint8ClampedArray(W * S * H * S * 4);
for (let y = 0; y < H * S; y++) for (let x = 0; x < W * S; x++) {
  const si = (Math.floor(y / S) * W + Math.floor(x / S)) * 4, di = (y * W * S + x) * 4;
  for (let k = 0; k < 4; k++) big[di + k] = small[si + k];
}
writeFileSync(process.argv[2], encodePNG(W * S, H * S, big));
console.log("x", w.player.x.toFixed(0), "hearts", w.hearts, "monsters", w.monsters.map((m) => m.type + "@" + m.x.toFixed(0)).join(","));
