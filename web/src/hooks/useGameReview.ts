"use client";

import { useCallback, useState } from "react";
import type { BoardState, Position } from "@xiangqi/shared";
import { createInitialBoard, applyMove } from "@xiangqi/shared";
import { EngineClient } from "@/lib/engine";
import type { GameReviewResult, MoveAnalysis } from "@/lib/engine";
import { parsePgn, type PgnGame } from "@/lib/engine/pgn";

// ── Types ────────────────────────────────────────────────────────────────────

export type ReviewStatus = "idle" | "loading" | "analyzing" | "done" | "error";

export interface ReviewState {
  status: ReviewStatus;
  game: PgnGame | null;
  boards: BoardState[];       // board[0] = initial, board[i] = after move i-1
  currentIndex: number;       // 0 = initial position, 1..n = after each move
  review: GameReviewResult | null;
  progress: { done: number; total: number };
  error: string | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useGameReview() {
  const [state, setState] = useState<ReviewState>({
    status: "idle",
    game: null,
    boards: [],
    currentIndex: 0,
    review: null,
    progress: { done: 0, total: 0 },
    error: null,
  });


  // ── Load a game from PGN text ────────────────────────────────────────────

  const loadPgn = useCallback((pgnText: string) => {
    try {
      const game = parsePgn(pgnText);
      const boards = buildBoards(game.moves);
      setState({
        status: "loading",
        game,
        boards,
        currentIndex: 0,
        review: null,
        progress: { done: 0, total: game.moves.length },
        error: null,
      });
      return game;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to parse PGN";
      setState((s) => ({ ...s, status: "error", error: msg }));
      return null;
    }
  }, []);

  // ── Run analysis ─────────────────────────────────────────────────────────

  const analyze = useCallback(async (game?: PgnGame, depth = 16) => {
    const g = game ?? state.game;
    if (!g || g.moves.length === 0) return;

    setState((s) => ({ ...s, status: "analyzing", error: null }));

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000); // 2 min timeout

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/analysis/game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moves: g.moves, depth }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Server error (${res.status})`);
      }
      const review: GameReviewResult = await res.json();
      setState((s) => ({ ...s, status: "done", review, progress: { done: g.moves.length, total: g.moves.length } }));
    } catch (e: unknown) {
      // Fallback to client-side WASM engine
      try {
        const engine = new EngineClient();
        await engine.init();
        const review = await engine.reviewGame(g.moves, {
          depth: Math.min(depth, 12), // lower depth for WASM
          onProgress: (done, total) => setState((s) => ({ ...s, progress: { done, total } })),
        });
        engine.destroy();
        setState((s) => ({ ...s, status: "done", review, progress: { done: g.moves.length, total: g.moves.length } }));
      } catch (wasmErr: unknown) {
        const msg = e instanceof Error
          ? e.name === "AbortError" ? "Analysis timed out. Try fewer moves or lower depth." : e.message
          : "Analysis failed";
        setState((s) => ({ ...s, status: "error", error: msg }));
      }
    }
  }, [state.game]);

  // ── Navigation ───────────────────────────────────────────────────────────

  const goTo = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      currentIndex: Math.max(0, Math.min(index, s.boards.length - 1)),
    }));
  }, []);

  const goForward = useCallback(() => {
    setState((s) => ({
      ...s,
      currentIndex: Math.min(s.currentIndex + 1, s.boards.length - 1),
    }));
  }, []);

  const goBack = useCallback(() => {
    setState((s) => ({
      ...s,
      currentIndex: Math.max(s.currentIndex - 1, 0),
    }));
  }, []);

  const goToStart = useCallback(() => setState((s) => ({ ...s, currentIndex: 0 })), []);
  const goToEnd = useCallback(() => setState((s) => ({ ...s, currentIndex: s.boards.length - 1 })), []);

  // ── Derived data ─────────────────────────────────────────────────────────

  const currentBoard = state.boards[state.currentIndex] ?? createInitialBoard();
  const currentMoveAnalysis: MoveAnalysis | null =
    state.review && state.currentIndex > 0
      ? state.review.moves[state.currentIndex - 1] ?? null
      : null;

  // Last move arrow (from/to of the move that led to current position)
  const lastMove = state.currentIndex > 0 && state.game
    ? uciToPositions(state.game.moves[state.currentIndex - 1])
    : null;

  // ── Cleanup ──────────────────────────────────────────────────────────────

  const destroy = useCallback(() => {}, []);

  return {
    ...state,
    currentBoard,
    currentMoveAnalysis,
    lastMove,
    loadPgn,
    analyze,
    goTo,
    goForward,
    goBack,
    goToStart,
    goToEnd,
    destroy,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildBoards(moves: string[]): BoardState[] {
  const boards: BoardState[] = [createInitialBoard()];
  let current = boards[0];

  for (const uci of moves) {
    const positions = uciToPositions(uci);
    if (!positions) break;
    current = applyMove(current, positions.from, positions.to);
    boards.push(current);
  }

  return boards;
}

function uciToPositions(uci: string): { from: Position; to: Position } | null {
  if (!uci || uci.length < 4) return null;
  const fromCol = uci.charCodeAt(0) - 97; // 'a' = 0
  const fromRow = 9 - parseInt(uci[1], 10); // Fairy Stockfish: 0=Red's back rank, our board: 0=Black's back rank
  const toCol = uci.charCodeAt(2) - 97;
  const toRow = 9 - parseInt(uci[3], 10);
  return {
    from: { col: fromCol as Position["col"], row: fromRow as Position["row"] },
    to: { col: toCol as Position["col"], row: toRow as Position["row"] },
  };
}
