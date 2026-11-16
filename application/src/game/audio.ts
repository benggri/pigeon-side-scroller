// WebAudio 로 만드는 짧은 효과음. 파일 없이 합성한다.
import type { GameEvent } from "./types";

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}

/** 사용자 입력 안에서 한 번 불러 오디오를 깨운다 (브라우저 자동재생 정책). */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, to: number, dur: number, type: OscillatorType, vol = 0.12, delay = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export function playEvent(e: GameEvent) {
  switch (e) {
    case "jump": tone(420, 760, 0.12, "square", 0.06); break;
    case "flutter": tone(900, 700, 0.05, "triangle", 0.03); break;
    case "coin": tone(988, 988, 0.07, "square", 0.05); tone(1319, 1319, 0.16, "square", 0.05, 0.07); break;
    case "stomp": tone(300, 90, 0.18, "square", 0.08); tone(660, 990, 0.1, "triangle", 0.06, 0.06); break;
    case "hurt": tone(330, 110, 0.3, "sawtooth", 0.07); break;
    case "gameover": [523, 392, 330, 262].forEach((f, i) => tone(f, f * 0.98, 0.22, "triangle", 0.09, i * 0.2)); break;
    case "milestone": [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.12, "square", 0.05, i * 0.09)); break;
  }
}
