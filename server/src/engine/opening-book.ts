// =============================================================================
// Opening Book Detection — Server-side
// =============================================================================

// Common ECCO openings as UCI move sequences
const BOOK_LINES: string[][] = [
  ["h2e2"],
  ["h2e2", "h9g7"],
  ["h2e2", "h9g7", "b2e2"],
  ["h2e2", "b9e7"],
  ["h2e2", "h9e7"],
  ["h2e2", "h9g7", "h0g2"],
  ["h2e2", "h9g7", "b0c2"],
  ["h2e2", "h9g7", "i0h0"],
  ["g0e2"],
  ["c0e2"],
  ["h0g2"],
  ["b0c2"],
  ["h0g2", "h9g7", "b0c2"],
  ["h2g2"],
  ["h2d2"],
  ["h2e2", "h9g7", "b2e2", "b9c7"],
  ["h2e2", "h9g7", "h0g2", "g9e7"],
  ["h2e2", "h9g7", "h0g2", "i9h9", "i0h0"],
  ["h2e2", "h9g7", "e2e6"],
  ["h2e2", "h9g7", "i0h0", "i9h9", "h0h6"],
];

/**
 * Returns how many moves from the start are book moves.
 */
export function detectBookMoves(moves: string[]): number {
  let maxDepth = 0;
  for (const line of BOOK_LINES) {
    if (line.length > moves.length) continue;
    let match = true;
    for (let i = 0; i < line.length; i++) {
      if (moves[i] !== line[i]) { match = false; break; }
    }
    if (match && line.length > maxDepth) maxDepth = line.length;
  }
  return maxDepth;
}
