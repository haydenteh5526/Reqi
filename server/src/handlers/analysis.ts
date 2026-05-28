// =============================================================================
// Analysis Handlers — REST endpoints for Pikafish engine analysis
// =============================================================================

import { Router, Request, Response } from "express";
import { AnalysisService, AnalysisServiceOptions } from "../engine/analysis-service";

const router = Router();

// ── Singleton service (initialized lazily) ───────────────────────────────────

let service: AnalysisService | null = null;

export function initAnalysisService(opts: AnalysisServiceOptions): AnalysisService {
  service = new AnalysisService(opts);
  return service;
}

export function getAnalysisService(): AnalysisService | null {
  return service;
}

// ── Middleware: ensure engine is running ──────────────────────────────────────

function requireEngine(_req: Request, res: Response, next: Function): void {
  if (!service?.isReady()) {
    res.status(503).json({ error: "Engine not available" });
    return;
  }
  next();
}

// ── POST /analysis/position ──────────────────────────────────────────────────
// Body: { fen: string, depth?: number }

router.post("/position", requireEngine, async (req: Request, res: Response) => {
  const { fen, depth, moves } = req.body;
  if (!fen || typeof fen !== "string") {
    res.status(400).json({ error: "fen is required" });
    return;
  }

  try {
    let result;
    if (Array.isArray(moves) && moves.length > 0) {
      // Analyze position after applying moves from the given FEN
      const r = await service!.bridge.analyzeWithMoves(fen, moves, { depth: depth ?? 16 });
      const best = r.evals[r.evals.length - 1];
      result = {
        fen,
        depth: best?.depth ?? depth ?? 16,
        score: best?.score ?? { type: "cp", value: 0 },
        bestLine: best?.pv ?? [],
        bestMove: r.bestMove.move,
      };
    } else {
      result = await service!.analyzePosition(fen, depth);
    }
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /analysis/game ──────────────────────────────────────────────────────
// Body: { moves: string[], startFen?: string, depth?: number }

router.post("/game", requireEngine, async (req: Request, res: Response) => {
  const { moves, startFen, depth } = req.body;
  if (!Array.isArray(moves)) {
    res.status(400).json({ error: "moves array is required" });
    return;
  }

  try {
    const result = await service!.reviewGame(moves, startFen, depth);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /analysis/status ─────────────────────────────────────────────────────

router.get("/status", (_req: Request, res: Response) => {
  res.json({ ready: service?.isReady() ?? false });
});

export { router as analysisRouter };
