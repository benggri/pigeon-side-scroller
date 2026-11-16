// 게임 전역 상수. 픽셀 단위, 초 단위.

export const VIEW_W = 320;
export const VIEW_H = 180;
export const GROUND_Y = 150; // 땅 표면의 y

export const GRAVITY = 900;
export const JUMP_V = 330; // 최대 점프 높이 ≈ 60px
export const JUMP_CUT = 0.45; // 점프 키를 일찍 떼면 상승 속도에 곱함
export const FLUTTER_FALL = 55; // 공중에서 점프 키를 누르고 있으면 낙하 속도 상한 (파닥파닥)
export const MAX_FALL = 420;
export const RUN_SPEED = 115;
export const RUN_ACCEL = 900;
export const RUN_DECEL = 1100;
export const COYOTE = 0.1;
export const JUMP_BUFFER = 0.12;
export const STOMP_BOUNCE = 260;

export const MAX_HEARTS = 3;
export const INVULN_TIME = 1.4;
export const KNOCKBACK_X = 140;
export const KNOCKBACK_Y = 200;

export const PX_PER_METER = 16;

// 비둘기 충돌 박스 (발 중앙 기준 오프셋)
export const PIGEON_BOX = { w: 12, h: 12 };
