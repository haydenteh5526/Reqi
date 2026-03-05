/**
 * Board & Piece Theme System
 *
 * Each theme defines colors for the board background, grid lines, pieces,
 * and text. Users can select their preferred theme via settings.
 */

export interface PieceColors {
  /** Disc fill color */
  fill: string;
  /** Disc stroke / outer ring */
  stroke: string;
  /** Inner ring color */
  innerRing: string;
  /** Character text color */
  text: string;
}

export interface BoardTheme {
  id: string;
  name: string;
  /** Board background center (for radial gradient) */
  boardBgCenter: string;
  /** Board background edge (for radial gradient) */
  boardBgEdge: string;
  /** Board outer border */
  boardBorder: string;
  /** Grid line color */
  gridColor: string;
  /** Grid line width */
  gridWidth: number;
  /** River text color */
  riverTextColor: string;
  /** River text opacity */
  riverTextOpacity: number;
  /** Red side piece colors */
  redPiece: PieceColors;
  /** Black side piece colors */
  blackPiece: PieceColors;
  /** Drop shadow opacity for pieces */
  pieceShadowOpacity: number;
}

// ── Classic Wood Theme (matches traditional Xiangqi boards) ─────────────────

export const THEME_CLASSIC_WOOD: BoardTheme = {
  id: "classic-wood",
  name: "Classic Wood",
  boardBgCenter: "#e8d4a2",
  boardBgEdge: "#d4be8a",
  boardBorder: "#b8a070",
  gridColor: "#8b7355",
  gridWidth: 0.8,
  riverTextColor: "#8b7355",
  riverTextOpacity: 0.6,
  redPiece: {
    fill: "#c4473b",
    stroke: "#9e3830",
    innerRing: "#a83a30",
    text: "#f5e8e0",
  },
  blackPiece: {
    fill: "#2d2d2d",
    stroke: "#1a1a1a",
    innerRing: "#404040",
    text: "#e8e0d0",
  },
  pieceShadowOpacity: 0.35,
};

// ── Dark Theme (matches our dark UI panels) ─────────────────────────────────

export const THEME_DARK: BoardTheme = {
  id: "dark",
  name: "Dark",
  boardBgCenter: "#524d47",
  boardBgEdge: "#3a3632",
  boardBorder: "#5d5852",
  gridColor: "#6b6560",
  gridWidth: 0.5,
  riverTextColor: "#6b6560",
  riverTextOpacity: 0.5,
  redPiece: {
    fill: "#c4473b",
    stroke: "#e8675a",
    innerRing: "#a83a30",
    text: "#1a0a08",
  },
  blackPiece: {
    fill: "#e8dcc8",
    stroke: "#f5efe5",
    innerRing: "#c8bfa8",
    text: "#2a2520",
  },
  pieceShadowOpacity: 0.5,
};

// ── Jade Theme ──────────────────────────────────────────────────────────────

export const THEME_JADE: BoardTheme = {
  id: "jade",
  name: "Jade",
  boardBgCenter: "#2d4a3e",
  boardBgEdge: "#1e3630",
  boardBorder: "#3d5a4e",
  gridColor: "#5a7a6a",
  gridWidth: 0.6,
  riverTextColor: "#5a7a6a",
  riverTextOpacity: 0.5,
  redPiece: {
    fill: "#c4473b",
    stroke: "#e8675a",
    innerRing: "#a83a30",
    text: "#f5e8e0",
  },
  blackPiece: {
    fill: "#1a1a1a",
    stroke: "#3a3a3a",
    innerRing: "#2a2a2a",
    text: "#d4e8d0",
  },
  pieceShadowOpacity: 0.4,
};

// ── All available themes ────────────────────────────────────────────────────

export const BOARD_THEMES: BoardTheme[] = [
  THEME_CLASSIC_WOOD,
  THEME_DARK,
  THEME_JADE,
];

/** Default theme for the application */
export const DEFAULT_BOARD_THEME = THEME_CLASSIC_WOOD;
