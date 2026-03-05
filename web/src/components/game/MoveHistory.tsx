"use client";

// =============================================================================
// Move History Panel — Shows all moves in numbered pairs (Chinese notation)
// Supports click-to-navigate and keyboard arrow navigation.
// =============================================================================

import { useEffect, useRef } from "react";
import type { Move } from "@xiangqi/shared";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MoveHistoryProps {
  moves: Move[];
  /** Currently viewed move index (null = latest/live). 0-indexed. */
  currentMoveIndex: number | null;
  onGoToMove?: (index: number | null) => void;
  onGoBack?: () => void;
  onGoForward?: () => void;
  onGoToStart?: () => void;
  onGoToEnd?: () => void;
  className?: string;
}

export function MoveHistory({
  moves,
  currentMoveIndex,
  onGoToMove,
  onGoBack,
  onGoForward,
  onGoToStart,
  onGoToEnd,
  className = "",
}: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // The "active" move index: if viewing history, it's currentMoveIndex, otherwise last move
  const activeIndex = currentMoveIndex ?? (moves.length > 0 ? moves.length - 1 : -1);

  // Auto-scroll to bottom on new move (only when at latest)
  useEffect(() => {
    if (currentMoveIndex === null && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length, currentMoveIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onGoBack?.();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onGoForward?.();
      } else if (e.key === "Home") {
        e.preventDefault();
        onGoToStart?.();
      } else if (e.key === "End") {
        e.preventDefault();
        onGoToEnd?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onGoBack, onGoForward, onGoToStart, onGoToEnd]);

  // Group moves into pairs: [red, black?]
  const pairs: { number: number; red: Move; redIndex: number; black?: Move; blackIndex?: number }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      red: moves[i],
      redIndex: i,
      black: moves[i + 1],
      blackIndex: moves[i + 1] ? i + 1 : undefined,
    });
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="border-b border-white/[0.06] px-4 py-2.5">
        <span className="text-[13px] font-bold text-white">Moves</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2">
        {pairs.length === 0 ? (
          <div className="flex h-full min-h-[80px] items-center justify-center text-[13px] text-text-muted">
            No moves yet — Red to play
          </div>
        ) : (
          <div className="space-y-px">
            {pairs.map((pair) => (
              <div
                key={pair.number}
                className="grid grid-cols-[32px_1fr_1fr] items-center gap-1 rounded-md px-2 py-1.5 text-[13px]"
              >
                <span className="text-right font-mono text-[11px] text-text-muted">
                  {pair.number}.
                </span>
                <MoveCell
                  move={pair.red}
                  isActive={activeIndex === pair.redIndex}
                  onClick={() => onGoToMove?.(pair.redIndex)}
                />
                {pair.black ? (
                  <MoveCell
                    move={pair.black}
                    isActive={activeIndex === pair.blackIndex}
                    onClick={() => onGoToMove?.(pair.blackIndex!)}
                  />
                ) : (
                  <span className="text-text-muted">…</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-1 border-t border-white/[0.06] px-3 py-2">
        <NavButton onClick={onGoToStart} title="Go to start (Home)">
          <ChevronFirst size={16} />
        </NavButton>
        <NavButton onClick={onGoBack} title="Previous move (←)">
          <ChevronLeft size={16} />
        </NavButton>
        <NavButton onClick={onGoForward} title="Next move (→)">
          <ChevronRight size={16} />
        </NavButton>
        <NavButton onClick={onGoToEnd} title="Go to latest (End)">
          <ChevronLast size={16} />
        </NavButton>
      </div>
    </div>
  );
}

function MoveCell({
  move,
  isActive,
  onClick,
}: {
  move: Move;
  isActive: boolean;
  onClick: () => void;
}) {
  const isCapture = !!move.captured;
  return (
    <span
      onClick={onClick}
      className={`cursor-pointer rounded px-1.5 py-0.5 font-medium transition-colors ${
        isActive
          ? "bg-accent/30 text-white"
          : isCapture
            ? "text-amber-400 hover:bg-white/[0.06]"
            : "text-text-primary hover:bg-white/[0.06]"
      }`}
    >
      {move.notation}
    </span>
  );
}

function NavButton({
  onClick,
  title,
  children,
}: {
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-8 w-10 items-center justify-center rounded-md bg-white/[0.04] text-text-secondary transition-colors hover:bg-white/[0.1] hover:text-white"
    >
      {children}
    </button>
  );
}
