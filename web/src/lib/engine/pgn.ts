// =============================================================================
// PGN Parser for Xiangqi
// Supports standard PGN format with UCI move notation (e.g. h2e2, b9c7)
// =============================================================================

export interface PgnGame {
  headers: Record<string, string>;
  moves: string[]; // UCI format moves
  result: string;  // "1-0", "0-1", "1/2-1/2", "*"
}

/**
 * Parse a PGN string into structured game data.
 * Expects moves in UCI coordinate format (e.g. "1. h2e2 h9g7 2. e2e6 ...")
 */
export function parsePgn(pgn: string): PgnGame {
  const headers: Record<string, string> = {};
  const lines = pgn.trim().split("\n");

  let moveText = "";
  for (const line of lines) {
    const trimmed = line.trim();
    const headerMatch = trimmed.match(/^\[(\w+)\s+"(.*)"\]$/);
    if (headerMatch) {
      headers[headerMatch[1]] = headerMatch[2];
    } else if (trimmed) {
      moveText += " " + trimmed;
    }
  }

  // Extract result
  const resultMatch = moveText.match(/(1-0|0-1|1\/2-1\/2|\*)[\s]*$/);
  const result = resultMatch?.[1] ?? "*";

  // Remove result, comments, and move numbers, then extract UCI moves
  const cleaned = moveText
    .replace(/(1-0|0-1|1\/2-1\/2|\*)\s*$/, "")
    .replace(/\{[^}]*\}/g, "")       // remove comments
    .replace(/\d+\.\s*/g, "")        // remove move numbers
    .replace(/\.\.\./g, "")          // remove ellipsis
    .trim();

  const moves = cleaned.split(/\s+/).filter((m) => m.length >= 4 && /^[a-i]\d[a-i]\d$/.test(m));

  return { headers, moves, result };
}

/**
 * Serialize a game back to PGN format.
 */
export function toPgn(game: PgnGame): string {
  const headerLines = Object.entries(game.headers)
    .map(([k, v]) => `[${k} "${v}"]`)
    .join("\n");

  const moveLines: string[] = [];
  for (let i = 0; i < game.moves.length; i += 2) {
    const num = Math.floor(i / 2) + 1;
    const white = game.moves[i];
    const black = game.moves[i + 1];
    moveLines.push(black ? `${num}. ${white} ${black}` : `${num}. ${white}`);
  }

  return `${headerLines}\n\n${moveLines.join(" ")} ${game.result}`;
}
