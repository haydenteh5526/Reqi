"use client";

import type { GameReviewResult, MoveClassification } from "@/lib/engine";

interface ReviewSummaryProps {
  review: GameReviewResult | null;
  redPlayer?: string;
  blackPlayer?: string;
}

const CLASSIFICATIONS: MoveClassification[] = ["brilliant", "best", "excellent", "good", "book", "inaccuracy", "mistake", "blunder"];

const COLORS: Record<MoveClassification, string> = {
  brilliant: "#1abc9c",
  best: "#96bc4b",
  excellent: "#5c8bb0",
  good: "#96bc4b",
  book: "#a88b65",
  inaccuracy: "#f7c735",
  mistake: "#e79827",
  blunder: "#ca3431",
};

const LABELS: Record<MoveClassification, string> = {
  brilliant: "Brilliant",
  best: "Best",
  excellent: "Excellent",
  good: "Good",
  book: "Book",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

export function ReviewSummary({ review, redPlayer = "Red", blackPlayer = "Black" }: ReviewSummaryProps) {
  if (!review) return null;

  const redCounts = countClassifications(review, "red");
  const blackCounts = countClassifications(review, "black");
  const redTotal = review.moves.filter((_, i) => i % 2 === 0).length;
  const blackTotal = review.moves.filter((_, i) => i % 2 !== 0).length;

  return (
    <div className="space-y-5">
      {/* Accuracy rings */}
      <div className="grid grid-cols-2 gap-4">
        <AccuracyRing label={redPlayer} accuracy={review.redAccuracy} color="#ef4444" />
        <AccuracyRing label={blackPlayer} accuracy={review.blackAccuracy} color="#a0a0a0" />
      </div>

      {/* Classification bars */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">Move Quality</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="space-y-1.5">
            {CLASSIFICATIONS.map((cls) => (
              <ClassificationRow key={cls} cls={cls} count={redCounts[cls]} total={redTotal} />
            ))}
          </div>
          <div className="space-y-1.5">
            {CLASSIFICATIONS.map((cls) => (
              <ClassificationRow key={cls} cls={cls} count={blackCounts[cls]} total={blackTotal} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Accuracy Ring (SVG) ──────────────────────────────────────────────────────

function AccuracyRing({ label, accuracy, color }: { label: string; accuracy: number; color: string }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (accuracy / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[76px] h-[76px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 76 76">
          {/* Background ring */}
          <circle cx="38" cy="38" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          {/* Progress ring */}
          <circle
            cx="38" cy="38" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{accuracy.toFixed(1)}</span>
        </div>
      </div>
      <span className="text-xs text-foreground-muted">{label}</span>
    </div>
  );
}

// ── Classification Row ───────────────────────────────────────────────────────

function ClassificationRow({ cls, count, total }: { cls: MoveClassification; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[cls] }} />
      <span className="flex-1 text-foreground-secondary">{LABELS[cls]}</span>
      <span className="font-mono text-foreground w-4 text-right">{count}</span>
      <div className="w-12 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: COLORS[cls] }}
        />
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function countClassifications(review: GameReviewResult, side: "red" | "black"): Record<MoveClassification, number> {
  const counts: Record<MoveClassification, number> = { brilliant: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
  for (const m of review.moves) {
    const isRed = m.moveIndex % 2 === 0;
    if ((side === "red" && isRed) || (side === "black" && !isRed)) {
      counts[m.classification]++;
    }
  }
  return counts;
}
