"use client";

// ── Board Preview Cards ──────────────────────────────────────────────────────
// Row of 3 miniature Xiangqi board previews using shared data + theme system.

import { MiniBoardSVG } from "@/components/board/MiniBoardSVG";
import {
  STARTING_POSITION,
  SAMPLE_PUZZLE_POSITION,
  SAMPLE_REVIEW_POSITION,
} from "@/lib/pieces";
import type { PieceDef } from "@/lib/pieces";
import { MOCK_BOARD_PREVIEWS } from "@/lib/mock-data";

// ── Position map (links mock-data positionKey → actual piece arrays) ────────

const POSITION_MAP: Record<string, PieceDef[]> = {
  puzzle: SAMPLE_PUZZLE_POSITION,
  starting: STARTING_POSITION,
  review: SAMPLE_REVIEW_POSITION,
};

// ── Card ────────────────────────────────────────────────────────────────────

function BoardPreviewCard({
  label,
  description,
  pieces,
  id,
  onClick,
}: {
  label: string;
  description?: string;
  pieces: PieceDef[];
  id: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-1 flex-col overflow-hidden rounded-lg bg-board-panel ring-1 ring-white/[0.06] transition-all duration-200 hover:ring-white/[0.14] hover:shadow-xl hover:shadow-black/30"
    >
      <div className="p-1.5">
        <MiniBoardSVG pieces={pieces} id={id} className="rounded-t-lg" />
      </div>
      <div className="px-3 py-2.5 text-center">
        <span className="text-[13px] font-semibold text-white transition-colors duration-150">
          {label}
        </span>
        {description && (
          <p className="mt-0.5 text-[11px] text-text-muted">{description}</p>
        )}
      </div>
    </button>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────

export function BoardPreviews() {
  return (
    <div className="flex gap-2.5">
      {MOCK_BOARD_PREVIEWS.map((item) => (
        <BoardPreviewCard
          key={item.id}
          id={`bp-${item.id}`}
          label={item.label}
          description={item.description}
          pieces={POSITION_MAP[item.positionKey] ?? STARTING_POSITION}
        />
      ))}
    </div>
  );
}
