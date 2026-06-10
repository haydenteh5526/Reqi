/**
 * Mock Data for Dashboard
 *
 * All placeholder / sample data used across dashboard components.
 * Consolidating here ensures:
 *   1. No hardcoded values scattered across components
 *   2. Easy to replace with real API data later
 *   3. Clear data contracts for each component
 *
 * TODO: Replace each section with real API calls (Supabase queries)
 */

// ── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  displayName: string;
  avatar: string | null;
  initial: string;
  rating: number;
  bestRating: number;
}

export const MOCK_USER: UserProfile = {
  displayName: "Guest",
  avatar: null,
  initial: "G",
  rating: 768,
  bestRating: 812,
};

// ── Stats ───────────────────────────────────────────────────────────────────

export interface UserStats {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  bestRating: number;
  streakDays: number;
  puzzlesSolved: number;
  puzzleStreak: number;
  nextLessonTitle: string;
}

export const MOCK_STATS: UserStats = {
  games: 10,
  wins: 6,
  losses: 3,
  draws: 1,
  rating: 768,
  bestRating: 812,
  streakDays: 0,
  puzzlesSolved: 200,
  puzzleStreak: 3,
  nextLessonTitle: "Opening Principles: The River Crossing",
};

// ── League ──────────────────────────────────────────────────────────────────

export interface LeagueInfo {
  name: string;
  rank: number;
  trophies: number;
}

export const MOCK_LEAGUE: LeagueInfo = {
  name: "Stone League",
  rank: 16,
  trophies: 15,
};

// ── Game History ────────────────────────────────────────────────────────────

export interface PlayerInfo {
  name: string;
  rating: number;
  flag?: string;
}

export interface GameRecord {
  id: string;
  timeControl: string;
  player1: PlayerInfo;
  player2: PlayerInfo;
  result: string;
  moves: number;
  date: string;
}

export const MOCK_GAMES: GameRecord[] = [
  {
    id: "1",
    timeControl: "10 min",
    player1: { name: "Guest", rating: 768, flag: "🇺🇸" },
    player2: { name: "EVC30", rating: 732, flag: "🇨🇳" },
    result: "1-0",
    moves: 23,
    date: "Feb 23, 2026",
  },
  {
    id: "2",
    timeControl: "5 min",
    player1: { name: "Dragon88", rating: 812, flag: "🇻🇳" },
    player2: { name: "Guest", rating: 768, flag: "🇺🇸" },
    result: "0-1",
    moves: 41,
    date: "Feb 22, 2026",
  },
  {
    id: "3",
    timeControl: "3 min",
    player1: { name: "XiangqiMaster", rating: 1105, flag: "🇹🇼" },
    player2: { name: "Guest", rating: 768, flag: "🇺🇸" },
    result: "1-0",
    moves: 56,
    date: "Feb 21, 2026",
  },
];

// ── Daily Games ─────────────────────────────────────────────────────────────

export interface DailyGameMatch {
  opponentName: string;
  opponentRating: number;
  label: string;
}

export const MOCK_DAILY_MATCH: DailyGameMatch = {
  opponentName: "Player_1234",
  opponentRating: 1200,
  label: "Recent Opponent",
};

// ── Board Preview Cards ─────────────────────────────────────────────────────

export interface BoardPreviewItem {
  id: string;
  label: string;
  description?: string;
  positionKey: "puzzle" | "starting" | "review";
}

export const MOCK_BOARD_PREVIEWS: BoardPreviewItem[] = [
  { id: "puzzle", label: "Solve Puzzle", positionKey: "puzzle" },
  { id: "lesson", label: "Start Lesson", positionKey: "starting" },
  { id: "review", label: "Review Game", description: "Review vs Player123", positionKey: "review" },
];
