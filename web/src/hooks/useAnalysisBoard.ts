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
import { EngineClient, type PositionAnalysis } from "@/lib/engine";

// ── Types ────────────────────────────────────────────────────────────────────

interface AnalysisState {
  board: BoardState;
  turn: Side;
  moves: Move[];
  selectedPos: Position | null;
  legalMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
  checkSide: Side | null;
  lastMoveWasCapture: boolean;
  // Analysis
  evaluation: PositionAnalysis | null;
  isAnalyzing: boolean;
  bestMoveArrow: { from: Position; to: Position } | null;
  // History navigation
  currentIndex: number; // moves.length = live position
  analysisVersion: number; // increments to force re-analysis
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAnalysisBoard(depth = 16) {
  const [state, setState] = useState<AnalysisState>({
    board: createInitialBoard(),
    turn: "red",
    moves: [],
    selectedPos: null,
    legalMoves: [],
    lastMove: null,
    checkSide: null,
    lastMoveWasCapture: false,
    evaluation: null,
    isAnalyzing: false,
    bestMoveArrow: null,
    currentIndex: 0,
    analysisVersion: 0,
  });

  const abortRef = useRef<AbortController | null>(null);
  const engineRef = useRef<EngineClient | null>(null);
  const [engineReady, setEngineReady] = useState(false);

  // ── Init engine once on mount ────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        engineRef.current = new EngineClient();
        await engineRef.current.init();
        setEngineReady(true);
      } catch {
        // WASM failed — that's OK, we'll show a message
        console.warn("WASM engine unavailable. Start the server: cd server && npm run dev");
        setEngineReady(false);
      }
    };
    init();
    return () => { engineRef.current?.destroy(); engineRef.current = null; };
  }, []);

  // ── Analyze whenever engine is ready or position changes ─────────────

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, isAnalyzing: true, evaluation: null, bestMoveArrow: null }));

    const run = async () => {
      const uciMoves = state.moves.slice(0, state.currentIndex).map((m) => posToUci(m.from, m.to));
      const fen = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";

      try {
        let data: PositionAnalysis | null = null;

        // Try server first (fast, always available if running)
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
          const res = await fetch(`${apiUrl}/analysis/position`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fen, moves: uciMoves.length > 0 ? uciMoves : undefined, depth }),
          });
          if (res.ok) data = await res.json();
        } catch {}

        // Fallback to WASM
        if (!data && engineReady && engineRef.current) {
          data = await engineRef.current.analyzePosition(fen, depth, (ev) => {
            if (cancelled) return;
            const bestArrow = ev.pv[0] ? uciToPos(ev.pv[0]) : null;
            setState((s) => ({
              ...s,
              evaluation: { fen, depth: ev.depth, score: ev.score, bestLine: ev.pv, bestMove: ev.pv[0] ?? "" },
              bestMoveArrow: bestArrow,
            }));
          });
        }

        if (cancelled || !data) return;
        const bestArrow = data.bestMove ? uciToPos(data.bestMove) : null;
        const evalData = data;
        setState((s) => ({ ...s, evaluation: evalData, isAnalyzing: false, bestMoveArrow: bestArrow }));
      } catch {
        if (!cancelled) setState((s) => ({ ...s, isAnalyzing: false }));
      }
    };
    run();
    return () => { cancelled = true; engineRef.current?.stop(); };
  }, [engineReady, state.currentIndex, state.moves.length, state.analysisVersion, depth]);

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

        const wasCapture = !!move.captured;
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
          lastMoveWasCapture: wasCapture,
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
        lastMoveWasCapture: false,
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
      lastMoveWasCapture: false,
      evaluation: null,
      isAnalyzing: false,
      bestMoveArrow: null,
      currentIndex: 0,
      analysisVersion: 0,
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
        lastMoveWasCapture: clamped > 0 ? !!prev.moves[clamped - 1].captured : false,
        currentIndex: clamped,
        analysisVersion: prev.analysisVersion + 1,
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
  const fr = 10 - from.row;
  const tc = String.fromCharCode(97 + to.col);
  const tr = 10 - to.row;
  return `${fc}${fr}${tc}${tr}`;
}

function uciToPos(uci: string): { from: Position; to: Position } | null {
  if (!uci || uci.length < 4) return null;
  const match = uci.match(/^([a-i])(\d+)([a-i])(\d+)$/);
  if (!match) return null;
  // Engine ranks: 1=Red's back rank (our row 9), 10=Black's back rank (our row 0)
  const fromCol = match[1].charCodeAt(0) - 97;
  const fromRow = 10 - parseInt(match[2], 10);
  const toCol = match[3].charCodeAt(0) - 97;
  const toRow = 10 - parseInt(match[4], 10);
  return {
    from: { col: fromCol as Position["col"], row: fromRow as Position["row"] },
    to: { col: toCol as Position["col"], row: toRow as Position["row"] },
  };
}
