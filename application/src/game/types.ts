import type { Fx } from "./pixelfx";
import type { ObstacleKind } from "./sprites";

export type Input = { left: boolean; right: boolean; jump: boolean };

export type Player = {
  x: number; // 발 중앙
  y: number; // 발 바닥
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
  coyote: number;
  jumpBuffer: number;
  jumpHeld: boolean;
  invuln: number;
  walk: number;
  blinkT: number;
};

export type Obstacle = { kind: ObstacleKind; x: number; w: number; h: number };

export type Monster = {
  type: "slime" | "bat";
  x: number; // 중앙
  y: number; // slime: 발 바닥, bat: 몸 중앙
  baseY: number;
  dir: 1 | -1;
  minX: number;
  maxX: number;
  phase: number;
  alive: boolean;
  fx: Fx | null;
};

export type Coin = { x: number; y: number; taken: boolean; fx: Fx | null };

export type WorldFx = { fx: Fx; x: number; y: number; screen?: boolean };

export type GameEvent = "jump" | "flutter" | "coin" | "stomp" | "hurt" | "gameover" | "milestone";

export type Box = { x: number; y: number; w: number; h: number }; // 왼쪽 위

export type World = {
  seed: number;
  rng: () => number;
  time: number;
  player: Player;
  hearts: number;
  coins: number;
  stomps: number;
  maxX: number;
  camX: number;
  obstacles: Obstacle[];
  monsters: Monster[];
  pickups: Coin[];
  effects: WorldFx[];
  nextSpawnX: number;
  nextMilestone: number;
  state: "playing" | "dying" | "over";
  dyingT: number;
  events: GameEvent[];
  /** 그래픽 효과(pixelfx) 생성 여부. 테스트에서는 꺼서 빠르게 돌린다. */
  withFx: boolean;
};
