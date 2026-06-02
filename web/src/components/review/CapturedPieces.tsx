"use client";

import type { Piece, Side } from "@xiangqi/shared";
import { pieceChar } from "@xiangqi/shared";

interface CapturedPiecesProps {
  moves: Array<{ captured?: Piece }>;
  side: Side; // which side's captures to show (pieces THIS side lost)
}

const PIECE_ORDER = ["chariot", "horse", "cannon", "elephant", "advisor", "soldier"] as const;

export function CapturedPieces({ moves, side }: CapturedPiecesProps) {
  // Collect pieces captured FROM this side (pieces the opponent took)
  const captured = moves
    .filter((m) => m.captured && m.captured.side === side)
    .map((m) => m.captured!);

  // Sort by value
  const sorted = [...captured].sort(
    (a, b) => PIECE_ORDER.indexOf(a.type as any) - PIECE_ORDER.indexOf(b.type as any)
  );

  if (sorted.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 flex-wrap min-h-[24px]">
      {sorted.map((piece, i) => (
        <span
          key={i}
          className={`inline-flex items-center justify-center w-[22px] h-[22px] rounded-full text-[11px] font-bold ${
            piece.side === "red"
              ? "bg-red-900/30 text-red-400"
              : "bg-neutral-700/40 text-neutral-300"
          }`}
        >
          {pieceChar(piece.type, piece.side)}
        </span>
      ))}
    </div>
  );
}
