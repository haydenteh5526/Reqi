"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MoveAnalysis, MoveClassification } from "@/lib/engine";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
} from "lucide-react";

// chess.com exact classification colors
const CLASSIFICATION_BG: Record<MoveClassification, string> = {
  brilliant: "rgba(26, 188, 156, 0.18)",
  best: "rgba(150, 188, 72, 0.15)",
  excellent: "rgba(92, 139, 176, 0.15)",
  good: "rgba(150, 188, 72, 0.10)",
  book: "rgba(168, 139, 101, 0.12)",
  inaccuracy: "rgba(247, 199, 53, 0.12)",
  mistake: "rgba(231, 152, 39, 0.15)",
  blunder: "rgba(202, 52, 49, 0.18)",
};

const CLASSIFICATION_ACCENT: Record<MoveClassification, string> = {
  brilliant: "#1abc9c",
  best: "#96bc4b",
  excellent: "#5c8bb0",
  good: "#96bc4b",
  book: "#a88b65",
  inaccuracy: "#f7c735",
  mistake: "#e79827",
  blunder: "#ca3431",
};

const CLASSIFICATION_ICON: Record<MoveClassification, { symbol: React.ReactNode; bg: string }> = {
  brilliant: { symbol: "!!", bg: "#1abc9c" },
  best: { symbol: "★", bg: "#96bc4b" },
  excellent: { symbol: "!", bg: "#5c8bb0" },
  good: { symbol: <Check size={11} strokeWidth={3} />, bg: "#96bc4b" },
  book: { symbol: <BookOpen size={10} strokeWidth={2.5} />, bg: "#a88b65" },
  inaccuracy: { symbol: "?!", bg: "#f7c735" },
  mistake: { symbol: "?", bg: "#e79827" },
  blunder: { symbol: "??", bg: "#ca3431" },
};

interface ReviewMoveListProps {
  moves: string[];
  notations?: string[]; // Chinese notation (optional, falls back to UCI)
  analysis: MoveAnalysis[] | null;
  currentIndex: number;
  onGoTo: (index: number) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onGoToStart: () => void;
  onGoToEnd: () => void;
}

export function ReviewMoveList({
  moves,
  notations,
  analysis,
  currentIndex,
  onGoTo,
  onGoBack,
  onGoForward,
  onGoToStart,
  onGoToEnd,
}: ReviewMoveListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current?.querySelector("[data-active='true']");
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); onGoBack(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); onGoForward(); }
      else if (e.key === "Home") { e.preventDefault(); onGoToStart(); }
      else if (e.key === "End") { e.preventDefault(); onGoToEnd(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onGoBack, onGoForward, onGoToStart, onGoToEnd]);

  const pairs: Array<{ num: number; red: MoveCell; black?: MoveCell }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      red: { uci: notations?.[i] ?? moves[i], index: i + 1, analysis: analysis?.[i] ?? null },
      black: moves[i + 1]
        ? { uci: notations?.[i + 1] ?? moves[i + 1], index: i + 2, analysis: analysis?.[i + 1] ?? null }
        : undefined,
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {pairs.map((pair) => {
          const redActive = currentIndex === pair.red.index;
          const blackActive = pair.black && currentIndex === pair.black.index;
          const activeAnalysis = redActive ? pair.red.analysis : blackActive ? pair.black!.analysis : null;
          const rowBg = activeAnalysis?.classification
            ? CLASSIFICATION_BG[activeAnalysis.classification]
            : redActive || blackActive ? "rgba(255,255,255,0.04)" : "transparent";

          return (
            <div
              key={pair.num}
              className="flex items-stretch border-b border-white/[0.03] transition-colors duration-200"
              style={{ backgroundColor: rowBg }}
            >
              {/* Move number */}
              <div className="w-9 flex items-center justify-center text-[11px] text-foreground-muted font-mono shrink-0">
                {pair.num}.
              </div>

              {/* Red move */}
              <MoveCellButton
                cell={pair.red}
                active={redActive}
                onClick={() => onGoTo(pair.red.index)}
              />

              {/* Black move */}
              {pair.black ? (
                <MoveCellButton
                  cell={pair.black}
                  active={!!blackActive}
                  onClick={() => onGoTo(pair.black!.index)}
                />
              ) : (
                <div className="flex-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-1 py-2.5 px-3 border-t border-white/[0.06] bg-[#1e1c1a]">
        <NavBtn onClick={onGoToStart} label="Start"><ChevronFirst size={16} /></NavBtn>
        <NavBtn onClick={onGoBack} label="Back"><ChevronLeft size={16} /></NavBtn>
        <NavBtn onClick={onGoForward} label="Forward"><ChevronRight size={16} /></NavBtn>
        <NavBtn onClick={onGoToEnd} label="End"><ChevronLast size={16} /></NavBtn>
      </div>
    </div>
  );
}

// ── Move Cell ────────────────────────────────────────────────────────────────

interface MoveCell {
  uci: string;
  index: number;
  analysis: MoveAnalysis | null;
}

function MoveCellButton({ cell, active, onClick }: { cell: MoveCell; active: boolean; onClick: () => void }) {
  const cls = cell.analysis?.classification;
  const icon = cls ? CLASSIFICATION_ICON[cls] : null;
  const showIcon = icon && icon.bg;

  return (
    <button
      data-active={active}
      onClick={onClick}
      className={`flex-1 flex items-center gap-1.5 px-2.5 py-[7px] text-left transition-all duration-150 relative ${
        active
          ? "text-white font-medium"
          : "text-[#b0aba6] hover:text-[#e0dcd8] hover:bg-white/[0.03]"
      }`}
    >
      {/* Classification icon badge */}
      {showIcon && (
        <span
          className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ backgroundColor: icon.bg }}
        >
          {icon.symbol}
        </span>
      )}
      {!showIcon && cls && (
        <span
          className="w-[6px] h-[6px] rounded-full shrink-0"
          style={{ backgroundColor: CLASSIFICATION_ACCENT[cls] }}
        />
      )}
      {!cls && <span className="w-[6px] shrink-0" />}

      {/* Move text */}
      <span className="font-mono text-[13px] tracking-tight">{cell.uci}</span>

      {/* Active indicator bar */}
      {active && (
        <motion.div
          layoutId="active-move"
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r"
          style={{ backgroundColor: cls ? CLASSIFICATION_ACCENT[cls] : "#81b64c" }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
    </button>
  );
}

function NavBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="p-2 rounded-md hover:bg-white/[0.08] active:bg-white/[0.12] text-[#8b8784] hover:text-[#e0dcd8] transition-all duration-100"
    >
      {children}
    </button>
  );
}
