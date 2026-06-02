"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { GameReviewResult } from "@/lib/engine";

interface GameEndOverlayProps {
  open: boolean;
  result: string; // "1-0", "0-1", "1/2-1/2"
  review?: GameReviewResult | null;
  redPlayer?: string;
  blackPlayer?: string;
  totalMoves: number;
  onClose: () => void;
}

export function GameEndOverlay({ open, result, review, redPlayer = "Red", blackPlayer = "Black", totalMoves, onClose }: GameEndOverlayProps) {
  if (!open) return null;

  const winner = result === "1-0" ? "red" : result === "0-1" ? "black" : "draw";
  const title = winner === "draw" ? "Draw" : `${winner === "red" ? redPlayer : blackPlayer} Wins`;
  const subtitle = winner === "draw" ? "Game ended in a draw" : "by Checkmate";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#262421] rounded-xl p-6 w-[320px] shadow-2xl border border-white/[0.06] text-center space-y-4"
        >
          {/* Result ribbon */}
          <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${
            winner === "red" ? "bg-red-500/20 text-red-400" :
            winner === "black" ? "bg-neutral-500/20 text-neutral-300" :
            "bg-yellow-500/20 text-yellow-300"
          }`}>
            {title}
          </div>

          <p className="text-sm text-[#8b8784]">{subtitle}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#1a1816] rounded-lg p-3">
              <div className="text-[#8b8784]">Total Moves</div>
              <div className="text-lg font-bold text-[#e8e6e3]">{totalMoves}</div>
            </div>
            {review && (
              <div className="bg-[#1a1816] rounded-lg p-3">
                <div className="text-[#8b8784]">Accuracy</div>
                <div className="text-lg font-bold text-[#e8e6e3]">
                  {review.redAccuracy.toFixed(0)}% / {review.blackAccuracy.toFixed(0)}%
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-[#81b64c] hover:bg-[#8fc455] text-white font-semibold text-sm transition-all"
          >
            Continue Reviewing
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
