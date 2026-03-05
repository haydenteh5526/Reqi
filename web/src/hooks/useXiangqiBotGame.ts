"use client";

// =============================================================================
// useXiangqiBotGame — Extends base game hook with bot auto-play
// No clock in bot mode. Bot computes a move when it's the bot's turn.
// =============================================================================

import { useEffect, useRef, useCallback } from "react";
import { useXiangqiGame } from "@/hooks/useXiangqiGame";
import { computeBotMove, type BotDifficulty } from "@/lib/bot/engine";
import type { Side } from "@xiangqi/shared";

export interface UseBotGameOptions {
  playerSide: Side;
  difficulty: BotDifficulty;
}

export function useXiangqiBotGame(options: UseBotGameOptions) {
  const { playerSide, difficulty } = options;

  const botSide: Side = playerSide === "red" ? "black" : "red";

  const game = useXiangqiGame({
    playerSide,
    enableClock: false, // No clock in bot mode
  });

  const botThinkingRef = useRef(false);

  // Auto-play for bot when it's the bot's turn
  useEffect(() => {
    if (game.phase !== "playing") return;
    if (game.turn !== botSide) return;
    if (botThinkingRef.current) return;
    // Don't compute bot move when viewing history
    if (game.isViewingHistory) return;

    botThinkingRef.current = true;

    // Simulate thinking delay (300-900ms based on difficulty)
    const delay = difficulty === "easy" ? 300 : difficulty === "medium" ? 500 : 700;
    const jitter = Math.random() * 400;

    const timer = setTimeout(() => {
      const move = computeBotMove(game.board, botSide, difficulty);
      if (move) {
        game.makeMove(move.from, move.to);
      }
      botThinkingRef.current = false;
    }, delay + jitter);

    return () => {
      clearTimeout(timer);
      botThinkingRef.current = false;
    };
  }, [game.turn, game.phase, game.board, botSide, difficulty, game.makeMove, game.isViewingHistory]);

  return {
    ...game,
    botSide,
    botDifficulty: difficulty,
  };
}
