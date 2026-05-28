"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardState, Position, Side, Move } from "@xiangqi/shared";
import {
  createInitialBoard,
  pieceAt,
  getLegalMoves,
  applyMove,
  createMove,
  isInCheck,
} from "@xiangqi/shared";
import type { PositionAnalysis } from "@/lib/engine";

// ── Types ────────────────────────────────────────────────────────────────────

interface AnalysisState {
  board: BoardState;
  turn: Side;
  moves: Move[];
  selectedPos: Position | null;
  legalMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
  checkSide: Side | null;
  // Analysis
  evaluation: PositionAnalysis | null;
  isAnalyzing: boolean;
  bestMoveArrow: { from: Position; to: Position } | null;
  // History navigation
  currentIndex: number; // moves.length = live position
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAnalysisBoard() {
  const [state, setState] = useState<AnalysisState>({
    board: createInitialBoard(),
    turn: "red",
    moves: [],
    selectedPos: null,
    legalMoves: [],
    lastMove: null,
    checkSide: null,
    evaluation: null,
    isAnalyzing: false,
    bestMoveArrow: null,
    currentIndex: 0,
  });

  const abortRef = useRef<AbortController | null>(null);

  // ── Request engine eval for current position ─────────────────────────

  const analyzePosition = useCallback(async (board: BoardState, turn: Side, moves: Move[]) => {
    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, isAnalyzing: true }));

    try {
      // Build UCI moves list from our Move objects
      const uciMoves = moves.map((m) => posToUci(m.from, m.to));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/analysis/position`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
          moves: uciMoves,
          depth: 16,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data: PositionAnalysis = await res.json();

      if (controller.signal.aborted) return;

      // Parse best move into arrow
      const bestArrow = data.bestMove ? uciToPos(data.bestMove) : null;

      setState((s) => ({
        ...s,
        evaluation: data,
        isAnalyzing: false,
        bestMoveArrow: bestArrow,
      }));
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") {
        setState((s) => ({ ...s, isAnalyzing: false }));
      }
    }
  }, []);

  // ── Trigger analysis when position changes ───────────────────────────

  useEffect(() => {
    analyzePosition(state.board, state.turn, state.moves.slice(0, state.currentIndex));
  }, [state.currentIndex, state.moves.length]);

  // ── Select square / make move ────────────────────────────────────────

  const handleSelectSquare = useCallback((pos: Position) => {
    setState((prev) => {
      // If viewing history, don't allow moves
      if (prev.currentIndex < prev.moves.length) return prev;

      const clickedPiece = pieceAt(prev.board, pos);

      // Execute move if legal destination
      if (prev.selectedPos && prev.legalMoves.some((m) => m.col === pos.col && m.row === pos.row)) {
        const move = createMove(prev.board, prev.selectedPos, pos);
        if (!move) return prev;

        const newBoard = applyMove(prev.board, prev.selectedPos, pos);
        const newTurn: Side = prev.turn === "red" ? "black" : "red";
        const check = isInCheck(newBoard, newTurn) ? newTurn : null;
        const newMoves = [...prev.moves, move];

        return {
          ...prev,
          board: newBoard,
          turn: newTurn,
          moves: newMoves,
          selectedPos: null,
          legalMoves: [],
          lastMove: { from: prev.selectedPos, to: pos },
          checkSide: check,
          evaluation: null,
          bestMoveArrow: null,
          currentIndex: newMoves.length,
        };
      }

      // Select own piece
      if (clickedPiece && clickedPiece.side === prev.turn) {
        return {
          ...prev,
          selectedPos: pos,
          legalMoves: getLegalMoves(prev.board, pos),
        };
      }

      // Deselect
      return { ...prev, selectedPos: null, legalMoves: [] };
    });
  }, []);

  // ── Undo last move ───────────────────────────────────────────────────

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.moves.length === 0) return prev;

      const newMoves = prev.moves.slice(0, -1);
      // Rebuild board from scratch
      let board = createInitialBoard();
      for (const m of newMoves) {
        board = applyMove(board, m.from, m.to);
      }
      const turn: Side = newMoves.length % 2 === 0 ? "red" : "black";
      const lastMove = newMoves.length > 0
        ? { from: newMoves[newMoves.length - 1].from, to: newMoves[newMoves.length - 1].to }
        : null;

      return {
        ...prev,
        board,
        turn,
        moves: newMoves,
        selectedPos: null,
        legalMoves: [],
        lastMove,
        checkSide: isInCheck(board, turn) ? turn : null,
        evaluation: null,
        bestMoveArrow: null,
        currentIndex: newMoves.length,
      };
    });
  }, []);

  // ── Reset board ──────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setState({
      board: createInitialBoard(),
      turn: "red",
      moves: [],
      selectedPos: null,
      legalMoves: [],
      lastMove: null,
      checkSide: null,
      evaluation: null,
      isAnalyzing: false,
      bestMoveArrow: null,
      currentIndex: 0,
    });
  }, []);

  // ── Navigation ───────────────────────────────────────────────────────

  const goTo = useCallback((index: number) => {
    setState((prev) => {
      const clamped = Math.max(0, Math.min(index, prev.moves.length));
      let board = createInitialBoard();
      for (let i = 0; i < clamped; i++) {
        board = applyMove(board, prev.moves[i].from, prev.moves[i].to);
      }
      const turn: Side = clamped % 2 === 0 ? "red" : "black";
      const lastMove = clamped > 0
        ? { from: prev.moves[clamped - 1].from, to: prev.moves[clamped - 1].to }
        : null;

      return {
        ...prev,
        board,
        turn,
        selectedPos: null,
        legalMoves: [],
        lastMove,
        checkSide: isInCheck(board, turn) ? turn : null,
        evaluation: null,
        bestMoveArrow: null,
        currentIndex: clamped,
      };
    });
  }, []);

  // ── Cleanup ──────────────────────────────────────────────────────────

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  return {
    ...state,
    handleSelectSquare,
    undo,
    reset,
    goTo,
    goBack: useCallback(() => goTo(state.currentIndex - 1), [goTo, state.currentIndex]),
    goForward: useCallback(() => goTo(state.currentIndex + 1), [goTo, state.currentIndex]),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function posToUci(from: Position, to: Position): string {
  const fc = String.fromCharCode(97 + from.col);
  const fr = 9 - from.row;
  const tc = String.fromCharCode(97 + to.col);
  const tr = 9 - to.row;
  return `${fc}${fr}${tc}${tr}`;
}

function uciToPos(uci: string): { from: Position; to: Position } | null {
  if (!uci || uci.length < 4) return null;
  return {
    from: { col: (uci.charCodeAt(0) - 97) as Position["col"], row: (9 - parseInt(uci[1])) as Position["row"] },
    to: { col: (uci.charCodeAt(2) - 97) as Position["col"], row: (9 - parseInt(uci[3])) as Position["row"] },
  };
}
