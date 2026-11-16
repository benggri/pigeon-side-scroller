import { describe, expect, it } from "vitest";
import { FLUTTER_FALL, GROUND_Y, MAX_HEARTS } from "./constants";
import { createWorld, meters, step } from "./world";
import type { Input, World } from "./types";

const IDLE: Input = { left: false, right: false, jump: false };
const DT = 1 / 60;

/** 빈 세계: 자동 생성 없이 시나리오용 엔티티만 둔다. */
function emptyWorld(): World {
  const w = createWorld(1, false);
  w.obstacles = [];
  w.monsters = [];
  w.pickups = [];
  w.nextSpawnX = 1e9;
  return w;
}

function run(w: World, input: Input, seconds: number) {
  for (let t = 0; t < seconds; t += DT) step(w, input, DT);
}

describe("비둘기 이동", () => {
  it("오른쪽 키로 앞으로 걷는다", () => {
    const w = emptyWorld();
    run(w, { ...IDLE, right: true }, 1);
    expect(w.player.x).toBeGreaterThan(140);
    expect(w.player.facing).toBe(1);
  });

  it("점프하면 떠올랐다가 땅으로 돌아온다", () => {
    const w = emptyWorld();
    step(w, { ...IDLE, jump: true }, DT);
    let minY = w.player.y;
    for (let i = 0; i < 20; i++) { step(w, { ...IDLE, jump: true }, DT); minY = Math.min(minY, w.player.y); }
    expect(GROUND_Y - minY).toBeGreaterThan(30);
    run(w, IDLE, 2);
    expect(w.player.onGround).toBe(true);
    expect(w.player.y).toBe(GROUND_Y);
  });

  it("공중에서 점프 키를 누르고 있으면 천천히 내려온다 (파닥파닥)", () => {
    const w = emptyWorld();
    run(w, { ...IDLE, jump: true }, 0.6);
    expect(w.player.onGround).toBe(false);
    expect(w.player.vy).toBeLessThanOrEqual(FLUTTER_FALL);
  });

  it("카메라 왼쪽 밖으로는 나갈 수 없다", () => {
    const w = emptyWorld();
    run(w, { ...IDLE, right: true }, 2);
    run(w, { ...IDLE, left: true }, 4);
    expect(w.player.x).toBeGreaterThanOrEqual(w.camX + 8);
  });
});

describe("장애물", () => {
  it("옆으로 부딪히면 하트를 잃고 밀려난다", () => {
    const w = emptyWorld();
    w.obstacles.push({ kind: "cone", x: 100, w: 12, h: 13 });
    run(w, { ...IDLE, right: true }, 0.6);
    expect(w.hearts).toBe(MAX_HEARTS - 1);
    expect(w.player.x).toBeLessThan(100);
  });

  it("위에 올라서면 다치지 않는다", () => {
    const w = emptyWorld();
    w.obstacles.push({ kind: "can", x: 56, w: 14, h: 12 });
    w.player.y = GROUND_Y - 40;
    w.player.onGround = false;
    run(w, IDLE, 1);
    expect(w.hearts).toBe(MAX_HEARTS);
    expect(w.player.y).toBe(GROUND_Y - 12);
    expect(w.player.onGround).toBe(true);
  });
});

describe("몬스터", () => {
  const slime = (x: number) => ({ type: "slime" as const, x, y: GROUND_Y, baseY: GROUND_Y, dir: 1 as const, minX: x, maxX: x, phase: 0, alive: true, fx: null });

  it("위에서 밟으면 물리치고 튀어 오른다", () => {
    const w = emptyWorld();
    w.monsters.push(slime(60));
    w.player.y = GROUND_Y - 50;
    w.player.onGround = false;
    run(w, IDLE, 0.5);
    expect(w.stomps).toBe(1);
    expect(w.monsters.filter((m) => m.alive)).toHaveLength(0);
    expect(w.hearts).toBe(MAX_HEARTS);
  });

  it("옆에서 닿으면 다친다", () => {
    const w = emptyWorld();
    w.monsters.push(slime(100));
    run(w, { ...IDLE, right: true }, 0.6);
    expect(w.hearts).toBe(MAX_HEARTS - 1);
    expect(w.monsters[0].alive).toBe(true);
  });

  it("하트를 모두 잃으면 게임 오버", () => {
    const w = emptyWorld();
    for (let i = 0; i < MAX_HEARTS; i++) {
      w.player.invuln = 0;
      w.monsters = [slime(w.player.x + 4)];
      step(w, IDLE, DT);
    }
    expect(w.hearts).toBe(0);
    expect(w.events).toContain("gameover");
    run(w, IDLE, 2);
    expect(w.state).toBe("over");
  });
});

describe("동전과 레벨", () => {
  it("동전을 먹으면 개수가 오른다", () => {
    const w = emptyWorld();
    w.pickups.push({ x: 90, y: GROUND_Y - 2, taken: false, fx: null });
    run(w, { ...IDLE, right: true }, 0.5);
    expect(w.coins).toBe(1);
  });

  it("같은 시드면 같은 레벨이 나온다", () => {
    const a = createWorld(42, false), b = createWorld(42, false);
    expect(a.obstacles).toEqual(b.obstacles);
    expect(a.monsters.map((m) => [m.type, m.x])).toEqual(b.monsters.map((m) => [m.type, m.x]));
  });

  it("앞으로 가면 레벨이 계속 생기고 지나간 것은 치운다", () => {
    const w = createWorld(7, false);
    w.player.invuln = 1e9;
    // 장애물에 막히지 않게 비둘기를 직접 옮기며 진행
    for (let i = 0; i < 1200; i++) { w.player.x += 3; w.player.y = 0; step(w, IDLE, DT); }
    expect(meters(w)).toBeGreaterThan(150);
    const ahead = [...w.obstacles, ...w.monsters, ...w.pickups].filter((e) => e.x > w.camX);
    expect(ahead.length).toBeGreaterThan(0);
    expect([...w.obstacles, ...w.monsters].every((e) => e.x > w.camX - 100)).toBe(true);
  });
});
