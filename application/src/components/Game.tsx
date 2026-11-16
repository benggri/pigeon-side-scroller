"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { playEvent, setMuted, unlockAudio } from "@/game/audio";
import { MAX_HEARTS, VIEW_H, VIEW_W } from "@/game/constants";
import { createFrame } from "@/game/pixelfx";
import { render } from "@/game/render";
import type { Input, World } from "@/game/types";
import { createWorld, meters, score, step } from "@/game/world";
import styles from "./Game.module.css";

type Phase = "title" | "playing" | "paused" | "over";
type Hud = { hearts: number; coins: number; meters: number; score: number };

const BEST_KEY = "pigeon-side-scroller.best";
const readBest = () => {
  try { return Number(localStorage.getItem(BEST_KEY) ?? 0) || 0; } catch { return 0; }
};
const writeBest = (v: number) => {
  try { localStorage.setItem(BEST_KEY, String(v)); } catch { /* 저장 불가 환경은 무시 */ }
};

const noopSubscribe = () => () => {};

function SoundIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden fill="currentColor">
      <path d="M2 6h3l4-3v10L5 10H2z" />
      {off ? (
        <path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M11 5.5c1.2 1.2 1.2 3.8 0 5M13 4c2 2 2 6 0 8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

const KEYS = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  jump: ["Space", "ArrowUp", "KeyW", "KeyZ"],
};

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const inputRef = useRef<Input>({ left: false, right: false, jump: false });
  const phaseRef = useRef<Phase>("title");
  const [phase, setPhaseState] = useState<Phase>("title");
  const [hud, setHud] = useState<Hud>({ hearts: MAX_HEARTS, coins: 0, meters: 0, score: 0 });
  // 최고 기록은 localStorage 에서 읽는다 (서버 렌더링에선 0)
  const best = useSyncExternalStore(noopSubscribe, readBest, () => 0);
  const [newBest, setNewBest] = useState(false);
  const [muted, setMutedState] = useState(false);

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const start = useCallback(() => {
    unlockAudio();
    worldRef.current = createWorld();
    inputRef.current = { left: false, right: false, jump: false };
    setNewBest(false);
    setPhase("playing");
  }, [setPhase]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === "playing") setPhase("paused");
    else if (phaseRef.current === "paused") setPhase("playing");
  }, [setPhase]);

  // 게임 루프
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const frame = createFrame(VIEW_W, VIEW_H);
    const img = ctx.createImageData(VIEW_W, VIEW_H);
    let last = performance.now(), raf = 0, hudKey = "";
    const idle: Input = { left: false, right: false, jump: false };

    worldRef.current ??= createWorld(1);
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = worldRef.current!, ph = phaseRef.current;
      if (ph === "playing") step(w, inputRef.current, dt);
      else if (ph === "title") {
        // 타이틀 화면: 비둘기가 제자리에서 두리번
        step(w, idle, dt);
      }
      for (const e of w.events) playEvent(e);
      w.events.length = 0;
      render(w, frame, img.data);
      ctx.putImageData(img, 0, 0);

      const h: Hud = { hearts: w.hearts, coins: w.coins, meters: meters(w), score: score(w) };
      const key = `${h.hearts}|${h.coins}|${h.meters}|${h.score}`;
      if (key !== hudKey) { hudKey = key; setHud(h); }
      if (ph === "playing" && w.state === "over") {
        const s = score(w);
        if (s > readBest()) { writeBest(s); setNewBest(true); }
        setPhase("over");
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [setPhase]);

  // 키보드
  useEffect(() => {
    const set = (code: string, down: boolean) => {
      const i = inputRef.current;
      let hit = false;
      if (KEYS.left.includes(code)) { i.left = down; hit = true; }
      if (KEYS.right.includes(code)) { i.right = down; hit = true; }
      if (KEYS.jump.includes(code)) { i.jump = down; hit = true; }
      return hit;
    };
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "KeyP" || e.code === "Escape") { togglePause(); return; }
      const ph = phaseRef.current;
      if ((ph === "title" || ph === "over") && (e.code === "Space" || e.code === "Enter")) {
        e.preventDefault();
        if (!e.repeat) start();
        return;
      }
      if (set(e.code, true)) e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => { set(e.code, false); };
    const onBlur = () => { inputRef.current = { left: false, right: false, jump: false }; if (phaseRef.current === "playing") setPhase("paused"); };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [start, togglePause, setPhase]);

  // 터치 버튼
  const press = (k: keyof Input, down: boolean) => (e: React.PointerEvent) => {
    e.preventDefault();
    if (down) { unlockAudio(); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }
    inputRef.current[k] = down;
  };
  const touchProps = (k: keyof Input) => ({
    onPointerDown: press(k, true),
    onPointerUp: press(k, false),
    onPointerCancel: press(k, false),
    onPointerLeave: press(k, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const toggleMute = () => { setMuted(!muted); setMutedState(!muted); };

  return (
    <div className={styles.wrap}>
      <div className={styles.stage}>
        <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} className={styles.canvas} aria-label="비둘기 횡스크롤 게임 화면" />
        {phase !== "title" && (
          <div className={styles.hud}>
            <div className={styles.hearts} aria-label={`하트 ${hud.hearts}개`}>
              {Array.from({ length: MAX_HEARTS }, (_, i) => (
                <span key={i} className={i < hud.hearts ? styles.heart : styles.heartEmpty}>♥</span>
              ))}
            </div>
            <div className={styles.stats}>
              <span><i className={styles.coinIcon} aria-hidden />{hud.coins}</span>
              <span>{hud.meters}m</span>
              <span className={styles.score}>{hud.score.toLocaleString()}점</span>
            </div>
            <div className={styles.hudButtons}>
              <button type="button" className={styles.iconBtn} onClick={toggleMute} aria-label={muted ? "소리 켜기" : "소리 끄기"}>
                <SoundIcon off={muted} />
              </button>
              <button type="button" className={styles.iconBtn} onClick={togglePause} aria-label="일시정지">
                <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden fill="currentColor">
                  {phase === "paused" ? <path d="M4 2l10 6-10 6z" /> : <path d="M3 2h3.5v12H3zM9.5 2H13v12H9.5z" />}
                </svg>
              </button>
            </div>
          </div>
        )}

        {phase === "title" && (
          <div className={styles.overlay}>
            <h1 className={styles.title}>구구 대모험</h1>
            <p className={styles.subtitle}>비둘기 구구와 함께 공원을 달려요!</p>
            <button type="button" className={styles.startBtn} onClick={start}>시작하기</button>
            <ul className={styles.help}>
              <li><kbd>←</kbd><kbd>→</kbd> 걷기</li>
              <li><kbd>Space</kbd> 점프 · 꾹 누르면 파닥파닥 천천히 내려와요</li>
              <li>몬스터는 위에서 밟으면 물리칠 수 있어요</li>
            </ul>
            {best > 0 && <p className={styles.best}>최고 기록 {best.toLocaleString()}점</p>}
          </div>
        )}

        {phase === "paused" && (
          <div className={styles.overlay}>
            <h2 className={styles.title}>잠깐 쉬어요</h2>
            <button type="button" className={styles.startBtn} onClick={togglePause}>계속하기</button>
          </div>
        )}

        {phase === "over" && (
          <div className={styles.overlay}>
            <h2 className={styles.title}>앗, 아야!</h2>
            {newBest && <p className={styles.newBest}>★ 새로운 최고 기록! ★</p>}
            <p className={styles.result}>
              {hud.meters}m 달리고 동전 {hud.coins}개를 모았어요
            </p>
            <p className={styles.finalScore}>{hud.score.toLocaleString()}점</p>
            <p className={styles.best}>최고 기록 {best.toLocaleString()}점</p>
            <button type="button" className={styles.startBtn} onClick={start}>다시 하기</button>
          </div>
        )}
      </div>

      <div className={styles.touch}>
        <div className={styles.touchLeft}>
          <button type="button" className={styles.padBtn} aria-label="왼쪽" {...touchProps("left")}>◀</button>
          <button type="button" className={styles.padBtn} aria-label="오른쪽" {...touchProps("right")}>▶</button>
        </div>
        <button type="button" className={`${styles.padBtn} ${styles.jumpBtn}`} aria-label="점프" {...touchProps("jump")}>점프</button>
      </div>
    </div>
  );
}
