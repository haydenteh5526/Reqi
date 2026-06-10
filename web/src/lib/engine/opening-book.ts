// =============================================================================
// ECCO Opening Book — Common Xiangqi openings for book move detection
// Maps move sequences (UCI) to opening names. If a game's first N moves match
// a known sequence, those moves are classified as "book".
// =============================================================================

export interface BookEntry {
  moves: string[];
  name: string;
  code: string; // ECCO code
}

// Key openings from the Encyclopedia of Chinese Chess Openings (ECCO)
export const OPENING_BOOK: BookEntry[] = [
  // ── Central Cannon (中炮) ──────────────────────────────────────────
  { code: "B20", name: "Central Cannon", moves: ["h2e2"] },
  { code: "B21", name: "Central Cannon vs Screen Horse", moves: ["h2e2", "h9g7"] },
  { code: "B22", name: "Central Cannon vs Screen Horse (both)", moves: ["h2e2", "h9g7", "b2e2"] },
  { code: "B30", name: "Central Cannon vs Opposite Cannon", moves: ["h2e2", "b9e7"] },
  { code: "B32", name: "Central Cannon vs Same Direction Cannon", moves: ["h2e2", "h9e7"] },

  // ── Central Cannon + Horse ─────────────────────────────────────────
  { code: "C00", name: "Central Cannon + Right Horse", moves: ["h2e2", "h9g7", "h0g2"] },
  { code: "C10", name: "Central Cannon + Left Horse", moves: ["h2e2", "h9g7", "b0c2"] },
  { code: "C20", name: "Central Cannon + Chariot", moves: ["h2e2", "h9g7", "i0h0"] },

  // ── Elephant Opening (飞相局) ──────────────────────────────────────
  { code: "D00", name: "Elephant Opening", moves: ["g0e2"] },
  { code: "D01", name: "Elephant Opening (left)", moves: ["c0e2"] },

  // ── Horse Opening (起马局) ─────────────────────────────────────────
  { code: "A00", name: "Horse Opening (right)", moves: ["h0g2"] },
  { code: "A01", name: "Horse Opening (left)", moves: ["b0c2"] },
  { code: "A10", name: "Double Horse Opening", moves: ["h0g2", "h9g7", "b0c2"] },

  // ── Cannon Openings ────────────────────────────────────────────────
  { code: "B00", name: "Cannon to 3rd File", moves: ["h2g2"] },
  { code: "B01", name: "Cannon to 7th File", moves: ["h2i2"] },
  { code: "B10", name: "Palcorner Cannon", moves: ["h2d2"] },
  { code: "B12", name: "Cross-Palace Cannon", moves: ["h2f2"] },

  // ── Black Responses ────────────────────────────────────────────────
  { code: "B40", name: "Central Cannon vs Left Cannon", moves: ["h2e2", "b9d7"] },
  { code: "B50", name: "Central Cannon vs Sandwiched Horse", moves: ["h2e2", "h9g7", "b2e2", "b9c7"] },

  // ── Iron Gate Defense ──────────────────────────────────────────────
  { code: "D10", name: "Iron Gate Defense", moves: ["h2e2", "h9g7", "h0g2", "g9e7"] },

  // ── Common continuations ───────────────────────────────────────────
  { code: "C30", name: "56 Cannon", moves: ["h2e2", "h9g7", "h0g2", "i9h9", "i0h0"] },
  { code: "C40", name: "Riverbank Cannon", moves: ["h2e2", "h9g7", "e2e6"] },
  { code: "C50", name: "Central Cannon + Chariot Patrol", moves: ["h2e2", "h9g7", "i0h0", "i9h9", "h0h6"] },
];

/**
 * Detect how many moves from the start are "book" moves.
 * Returns the number of moves that match a known opening sequence.
 */
export function detectBookMoves(moves: string[]): number {
  let maxBookDepth = 0;

  for (const entry of OPENING_BOOK) {
    if (entry.moves.length > moves.length) continue;

    let matches = true;
    for (let i = 0; i < entry.moves.length; i++) {
      if (moves[i] !== entry.moves[i]) {
        matches = false;
        break;
      }
    }

    if (matches && entry.moves.length > maxBookDepth) {
      maxBookDepth = entry.moves.length;
    }
  }

  return maxBookDepth;
}

/**
 * Get the opening name for a move sequence.
 */
export function getOpeningName(moves: string[]): string | null {
  let bestMatch: BookEntry | null = null;

  for (const entry of OPENING_BOOK) {
    if (entry.moves.length > moves.length) continue;

    let matches = true;
    for (let i = 0; i < entry.moves.length; i++) {
      if (moves[i] !== entry.moves[i]) {
        matches = false;
        break;
      }
    }

    if (matches && (!bestMatch || entry.moves.length > bestMatch.moves.length)) {
      bestMatch = entry;
    }
  }

  return bestMatch?.name ?? null;
}
