// =============================================================================
// Engine Web Worker — Loads Fairy Stockfish WASM, speaks UCI via postMessage
// Place fairy-stockfish.js and fairy-stockfish.wasm in public/engine/
// =============================================================================
/// <reference lib="webworker" />

import type { WorkerInMessage, WorkerOutMessage, EngineEval } from "./types";

let engine: { postMessage: (cmd: string) => void; addMessageListener: (cb: (line: string) => void) => void } | null = null;
let currentId: number | null = null;
let evals: EngineEval[] = [];

function post(msg: WorkerOutMessage) {
  (self as unknown as Worker).postMessage(msg);
}

// ── Load the WASM engine ─────────────────────────────────────────────────────

async function init() {
  // Load the fairy-stockfish glue script dynamically
  const response = await fetch("/engine/fairy-stockfish.js");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  // The glue script exposes a factory function
  const module = await import(/* webpackIgnore: true */ url);
  engine = await module.default();

  engine!.addMessageListener((line: string) => {
    handleUciLine(line);
  });

  // Initialize UCI + set xiangqi variant
  send("uci");
  send("setoption name UCI_Variant value xiangqi");
  send("isready");
}

function send(cmd: string) {
  engine?.postMessage(cmd);
}

function handleUciLine(line: string) {
  if (line === "readyok" && currentId === null) {
    post({ type: "ready" });
    return;
  }

  if (line.startsWith("info") && line.includes(" pv ") && currentId !== null) {
    const ev = parseInfo(line);
    if (ev) {
      evals.push(ev);
      post({ type: "info", id: currentId, eval: ev });
    }
  }

  if (line.startsWith("bestmove") && currentId !== null) {
    const move = line.split(/\s+/)[1] ?? "";
    post({ type: "result", id: currentId, evals, bestMove: move });
    currentId = null;
    evals = [];
  }
}

// ── UCI output parser ────────────────────────────────────────────────────────

function parseInfo(line: string): EngineEval | null {
  const depth = extractInt(line, "depth");
  if (depth === null) return null;

  const score = parseScore(line);
  if (!score) return null;

  const pvIdx = line.indexOf(" pv ");
  if (pvIdx === -1) return null;
  const pv = line.slice(pvIdx + 4).trim().split(/\s+/);

  return { depth, score, pv };
}

function parseScore(line: string): EngineEval["score"] | null {
  const cp = line.match(/score cp (-?\d+)/);
  if (cp) return { type: "cp", value: parseInt(cp[1], 10) };
  const mate = line.match(/score mate (-?\d+)/);
  if (mate) return { type: "mate", value: parseInt(mate[1], 10) };
  return null;
}

function extractInt(line: string, key: string): number | null {
  const m = line.match(new RegExp(`\\b${key}\\s+(\\d+)`));
  return m ? parseInt(m[1], 10) : null;
}

// ── Message handler ──────────────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case "init":
      try {
        await init();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        post({ type: "error", id: 0, message });
      }
      break;

    case "analyze":
      currentId = msg.id;
      evals = [];
      send(`position fen ${msg.fen}`);
      send(`go depth ${msg.depth}`);
      break;

    case "analyzeWithMoves":
      currentId = msg.id;
      evals = [];
      send(
        msg.moves.length
          ? `position fen ${msg.fen} moves ${msg.moves.join(" ")}`
          : `position fen ${msg.fen}`,
      );
      send(`go depth ${msg.depth}`);
      break;

    case "stop":
      send("stop");
      break;
  }
};
