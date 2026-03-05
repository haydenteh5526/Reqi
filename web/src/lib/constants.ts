/**
 * Xiangqi.app — Constants
 *
 * Application-wide constants (time controls, board dimensions, etc.)
 */

export const BOARD_COLS = 9;
export const BOARD_ROWS = 10;

/** Default time controls offered in matchmaking */
export const TIME_CONTROLS = [
  { initialMs: 60_000, incrementMs: 0, label: "1+0 Bullet" },
  { initialMs: 180_000, incrementMs: 2_000, label: "3+2 Blitz" },
  { initialMs: 600_000, incrementMs: 5_000, label: "10+5 Rapid" },
  { initialMs: 1_800_000, incrementMs: 10_000, label: "30+10 Classical" },
] as const;
