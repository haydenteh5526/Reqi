import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
];

// ── Express ──────────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// ── Analysis Routes ──────────────────────────────────────────────────────────
import { analysisRouter, initAnalysisService } from "./handlers/analysis";
app.use("/analysis", analysisRouter);

// Start engine if PIKAFISH_PATH is configured
const PIKAFISH_PATH = process.env.PIKAFISH_PATH;
if (PIKAFISH_PATH) {
  const svc = initAnalysisService({
    enginePath: PIKAFISH_PATH,
    threads: parseInt(process.env.ENGINE_THREADS ?? "1", 10),
    hash: parseInt(process.env.ENGINE_HASH ?? "128", 10),
    defaultDepth: parseInt(process.env.ENGINE_DEPTH ?? "18", 10),
  });
  svc.start().then(() => {
    console.log("[engine] Pikafish ready");
  }).catch((err) => {
    console.error("[engine] Failed to start Pikafish:", err.message);
  });
}

// ── HTTP + Socket.io ─────────────────────────────────────────────────────────
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// ── Socket Connection Handler ────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on("disconnect", (reason) => {
    console.log(`[socket] disconnected: ${socket.id} (${reason})`);
  });
});

// ── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[server] Xiangqi game server running on :${PORT}`);
});

export { app, io, httpServer };
