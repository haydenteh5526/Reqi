"use client";

// =============================================================================
// useXiangqiGame — Main game state hook
// Manages board state, move validation, selection, clocks, and game result.
// For offline / vs-AI play. Multiplayer will extend this via Socket.io sync.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BoardState, Position, Side, Move } from "@xiangqi/shared";
import {
  createInitialBoard,
  pieceAt,
  getLegalMoves,
  applyMove,
  evaluatePosition,
  createMove,
  isInCheck,
} from "@xiangqi/shared";

// ── Types ────────────────────────────────────────────────────────────────────

export type GamePhase = "playing" | "checkmate" | "stalemate" | "resigned" | "timeout";

export interface GameClockState {
  redMs: number;
  blackMs: number;
  incrementMs: number;
  running: boolean;
}

export interface XiangqiGameState {
  board: BoardState;
  turn: Side;
  moves: Move[];
  selectedPos: Position | null;
  legalMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
  checkSide: Side | null;
  phase: GamePhase;
  winner: Side | null;
  clock: GameClockState;
  /** Index of the move being viewed (null = latest / live). 0 = initial, 1 = after first move, etc. */
  viewingMoveIndex: number | null;
}

export interface UseXiangqiGameOptions {
  /** Which side the local player controls (null = both / hotseat) */
  playerSide?: Side | null;
  /** Initial time in ms per side (default 10 min) */
  initialTimeMs?: number;
  /** Increment in ms per move (default 5s) */
  incrementMs?: number;
  /** Whether to enable the clock (default true) */
  enableClock?: boolean;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useXiangqiGame(options: UseXiangqiGameOptions = {}) {
  const {
    playerSide = null,
    initialTimeMs = 600_000,
    incrementMs = 5_000,
    enableClock = true,
  } = options;

  const [state, setState] = useState<XiangqiGameState>(() => ({
    board: createInitialBoard(),
    turn: "red",
    moves: [],
    selectedPos: null,
    legalMoves: [],
    lastMove: null,
    checkSide: null,
    phase: "playing",
    winner: null,
    clock: {
      redMs: initialTimeMs,
      blackMs: initialTimeMs,
      incrementMs,
      running: enableClock,
    },
    viewingMoveIndex: null,
  }));

  // ── Clock tick ──────────────────────────────────────────────────────

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enableClock) return;
    if (state.phase !== "playing" || !state.clock.running) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.phase !== "playing") return prev;

        const key = prev.turn === "red" ? "redMs" : "blackMs";
        const newTime = prev.clock[key] - 100;

        if (newTime <= 0) {
          return {
            ...prev,
            phase: "timeout",
            winner: prev.turn === "red" ? "black" : "red",
            clock: { ...prev.clock, [key]: 0, running: false },
          };
        }

        return {
          ...prev,
          clock: { ...prev.clock, [key]: newTime },
        };
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enableClock, state.phase, state.turn, state.clock.running]);

  // ── Square selection / move logic ──────────────────────────────────

  const handleSelectSquare = useCallback(
    (pos: Position) => {
      setState((prev) => {
        if (prev.phase !== "playing") return prev;

        const clickedPiece = pieceAt(prev.board, pos);

        // If we have a selection and this is a legal move destination → execute move
        if (prev.selectedPos && prev.legalMoves.some((m) => m.col === pos.col && m.row === pos.row)) {
          return executeMove(prev, prev.selectedPos, pos);
        }

        // If clicking own piece (and it's our turn) → select it
        if (clickedPiece && clickedPiece.side === prev.turn) {
          // In hotseat mode (playerSide=null), allow both sides
          // Otherwise, only allow selecting own pieces
          if (playerSide !== null && clickedPiece.side !== playerSide) {
            return prev;
          }

          const legal = getLegalMoves(prev.board, pos);
          return {
            ...prev,
            selectedPos: pos,
            legalMoves: legal,
          };
        }

        // Deselect
        return {
          ...prev,
          selectedPos: null,
          legalMoves: [],
        };
      });
    },
    [playerSide],
  );

  // ── Resign ─────────────────────────────────────────────────────────

  const resign = useCallback((side: Side) => {
    setState((prev) => {
      if (prev.phase !== "playing") return prev;
      return {
        ...prev,
        phase: "resigned",
        winner: side === "red" ? "black" : "red",
        clock: { ...prev.clock, running: false },
        selectedPos: null,
        legalMoves: [],
      };
    });
  }, []);

  // ── Direct move (for bot / external use) ────────────────────────────

  const makeMove = useCallback((from: Position, to: Position) => {
    setState((prev) => {
      if (prev.phase !== "playing") return prev;
      return executeMove(prev, from, to);
    });
  }, []);

  // ── Move Navigation ──────────────────────────────────────────────

  const goToMove = useCallback((index: number | null) => {
    setState((prev) => {
      if (index === null || index >= prev.moves.length) {
        return { ...prev, viewingMoveIndex: null, selectedPos: null, legalMoves: [] };
      }
      const clamped = Math.max(0, index);
      return { ...prev, viewingMoveIndex: clamped, selectedPos: null, legalMoves: [] };
    });
  }, []);

  const goForward = useCallback(() => {
    setState((prev) => {
      if (prev.viewingMoveIndex === null) return prev; // already at latest
      const next = prev.viewingMoveIndex + 1;
      if (next >= prev.moves.length) {
        return { ...prev, viewingMoveIndex: null, selectedPos: null, legalMoves: [] };
      }
      return { ...prev, viewingMoveIndex: next, selectedPos: null, legalMoves: [] };
    });
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.moves.length === 0) return prev;
      if (prev.viewingMoveIndex === null) {
        // Go to last move
        return { ...prev, viewingMoveIndex: prev.moves.length - 1, selectedPos: null, legalMoves: [] };
      }
      if (prev.viewingMoveIndex <= 0) return prev; // already at start
      return { ...prev, viewingMoveIndex: prev.viewingMoveIndex - 1, selectedPos: null, legalMoves: [] };
    });
  }, []);

  const goToStart = useCallback(() => {
    setState((prev) => {
      if (prev.moves.length === 0) return prev;
      return { ...prev, viewingMoveIndex: 0, selectedPos: null, legalMoves: [] };
    });
  }, []);

  const goToEnd = useCallback(() => {
    setState((prev) => ({
      ...prev,
      viewingMoveIndex: null,
      selectedPos: null,
      legalMoves: [],
    }));
  }, []);

  // ── Reconstructed board for history viewing ────────────────────────

  const viewBoard = useMemo(() => {
    if (state.viewingMoveIndex === null) return state.board;
    // Replay moves from initial up to viewingMoveIndex
    let b = createInitialBoard();
    for (let i = 0; i <= state.viewingMoveIndex; i++) {
      const m = state.moves[i];
      if (m) b = applyMove(b, m.from, m.to);
    }
    return b;
  }, [state.viewingMoveIndex, state.moves, state.board]);

  const viewLastMove = useMemo(() => {
    if (state.viewingMoveIndex === null) return state.lastMove;
    if (state.viewingMoveIndex < 0) return null;
    const m = state.moves[state.viewingMoveIndex];
    return m ? { from: m.from, to: m.to } : null;
  }, [state.viewingMoveIndex, state.moves, state.lastMove]);

  const isViewingHistory = state.viewingMoveIndex !== null;

  // ── New Game ───────────────────────────────────────────────────────

  const newGame = useCallback(() => {
    setState({
      board: createInitialBoard(),
      turn: "red",
      moves: [],
      selectedPos: null,
      legalMoves: [],
      lastMove: null,
      checkSide: null,
      phase: "playing",
      winner: null,
      clock: {
        redMs: initialTimeMs,
        blackMs: initialTimeMs,
        incrementMs,
        running: enableClock,
      },
      viewingMoveIndex: null,
    });
  }, [initialTimeMs, incrementMs, enableClock]);

  return {
    ...state,
    handleSelectSquare,
    makeMove,
    resign,
    newGame,
    // Move navigation
    viewBoard,
    viewLastMove,
    isViewingHistory,
    goToMove,
    goForward,
    goBack,
    goToStart,
    goToEnd,
  };
}

// ── Internal: execute a validated move ───────────────────────────────────────

function executeMove(
  prev: XiangqiGameState,
  from: Position,
  to: Position,
): XiangqiGameState {
  const move = createMove(prev.board, from, to);
  if (!move) return prev;

  const newBoard = applyMove(prev.board, from, to);
  const nextTurn: Side = prev.turn === "red" ? "black" : "red";

  // Evaluate position for next player
  const result = evaluatePosition(newBoard, nextTurn);

  // Add increment to the moving side's clock
  const clockKey = prev.turn === "red" ? "redMs" : "blackMs";
  const newClock = {
    ...prev.clock,
    [clockKey]: prev.clock[clockKey] + prev.clock.incrementMs,
  };

  let phase: GamePhase = "playing";
  let winner: Side | null = null;

  if (result.type === "checkmate") {
    phase = "checkmate";
    winner = result.winner;
    newClock.running = false;
  } else if (result.type === "stalemate") {
    phase = "stalemate";
    newClock.running = false;
  }

  return {
    ...prev,
    board: newBoard,
    turn: nextTurn,
    moves: [...prev.moves, move],
    selectedPos: null,
    legalMoves: [],
    lastMove: { from, to },
    checkSide: result.type === "check" ? result.side : null,
    phase,
    winner,
    clock: newClock,
  };
}
