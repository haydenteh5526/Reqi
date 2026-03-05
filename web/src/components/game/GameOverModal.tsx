"use client";

// =============================================================================
// Game Over Modal — Displays result overlay when game ends
// =============================================================================

import { motion, AnimatePresence } from "framer-motion";
import type { Side } from "@xiangqi/shared";

export type GamePhase =
  | "playing"
  | "checkmate"
  | "stalemate"
  | "resigned"
  | "timeout";

interface GameOverModalProps {
  phase: GamePhase;
  winner: Side | null;
  onNewGame: () => void;
  className?: string;
}

const RESULT_TEXT: Record<string, string> = {
  checkmate: "Checkmate!",
  stalemate: "Stalemate — Draw",
  resigned: "Resignation",
  timeout: "Time Out!",
};

function sideLabel(side: Side): string {
  return side === "red" ? "Red" : "Black";
}

export function GameOverModal({
  phase,
  winner,
  onNewGame,
  className = "",
}: GameOverModalProps) {
  const show = phase !== "playing";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm ${className}`}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="mx-4 w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#262421] p-8 text-center shadow-2xl"
          >
            {/* Result icon */}
            <div className="mb-4 flex justify-center">
              {phase === "stalemate" ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-3xl">
                  ½
                </div>
              ) : winner ? (
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
                    winner === "red"
                      ? "bg-[#c4473b]/20 text-[#c4473b]"
                      : "bg-white/10 text-white"
                  }`}
                >
                  {winner === "red" ? "帥" : "將"}
                </div>
              ) : null}
            </div>

            {/* Title */}
            <h2 className="mb-1 text-xl font-bold text-white">
              {RESULT_TEXT[phase] ?? "Game Over"}
            </h2>

            {/* Subtitle */}
            <p className="mb-6 text-sm text-text-muted">
              {phase === "stalemate"
                ? "Neither side can deliver checkmate."
                : winner
                  ? `${sideLabel(winner)} wins by ${phase}!`
                  : "Game ended."}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={onNewGame}
                className="rounded-lg bg-[#A3262A] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#b93034]"
              >
                New Game
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
