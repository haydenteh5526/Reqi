<div align="center">
  <img src="web/public/icons/icon.svg" height="80" width="80" />
  <h1>Reqi</h1>
  <p><strong>Xiangqi game review & analysis tool</strong></p>
  <p>Analyze your Chinese Chess games with engine-powered move classifications, accuracy scores, and interactive analysis.</p>

  ![License](https://img.shields.io/github/license/haydenteh5526/Reqi?v=1)
  ![Last Commit](https://img.shields.io/github/last-commit/haydenteh5526/Reqi?v=1)
  ![Top Language](https://img.shields.io/github/languages/top/haydenteh5526/Reqi?v=1)

  **[Live Demo →](https://reqi-mu.vercel.app/)**
</div>

---

## Features

- **Game Review** — Import PGN, get full engine analysis with move-by-move classifications
- **Analysis Board** — Move pieces freely with live engine evaluation and best move arrows
- **Move Classifications** — Brilliant, Best, Excellent, Good, Book, Inaccuracy, Mistake, Blunder
- **Accuracy Scores** — Chess.com-style accuracy percentage per player
- **Eval Bar & Graph** — Real-time evaluation display with interactive graph
- **Opening Detection** — ECCO opening book recognition
- **Algebraic Notation** — Chess-style piece notation (Hg3, Ce5, Rxd10)
- **Chinese Notation** — Traditional notation in game review (炮二平五)
- **Drag & Drop** — Move pieces by dragging (mouse and touch)
- **Themes** — 3 board themes (Classic Wood, Dark, Jade)
- **Sound Effects** — Move, capture, check, undo sounds
- **PWA** — Installable, works offline
- **Share** — Save and share analyzed games via link

## Screenshots

> Coming soon

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Animation | Framer Motion |
| Engine | Fairy Stockfish (server-side native binary) |
| Auth & DB | Supabase (PostgreSQL, Auth, RLS) |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 20+
- [Fairy Stockfish binary](https://fairy-stockfish.github.io/download/) (largeboard variant)

### Installation

```bash
git clone https://github.com/haydenteh5526/Reqi.git
cd Reqi
```

### Server (Engine)

```bash
cd server
cp .env.example .env
# Set PIKAFISH_PATH to your Fairy Stockfish binary path in .env
npm install
npm run dev
```

Wait for `[engine] Pikafish ready`.

### Web Frontend

```bash
cd web
cp .env.local.example .env.local
# Fill in Supabase keys (optional for local dev)
npm install
npm run dev
```

Open **http://localhost:3000**

## Project Structure

```
reqi/
├── web/           → Next.js frontend
│   ├── src/
│   │   ├── app/           → Pages (/, /review, /analysis)
│   │   ├── components/    → UI components (board, review, layout)
│   │   ├── hooks/         → React hooks (useAnalysisBoard, useGameReview)
│   │   └── lib/           → Engine client, notation, sounds, themes
│   └── public/            → Static assets, PWA manifest, engine WASM
├── server/        → Express + Socket.io game server
│   └── src/
│       ├── engine/        → UCI bridge, analysis service, opening book
│       └── handlers/      → REST API endpoints
└── shared/        → Shared TypeScript types & game logic
    └── src/
        └── engine/        → Rules engine, FEN parser
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analysis/position` | Analyze a single position (FEN + optional moves) |
| POST | `/analysis/game` | Full game review (array of UCI moves) |
| GET | `/analysis/status` | Engine readiness check |

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `PIKAFISH_PATH` | Path to Fairy Stockfish binary |
| `ENGINE_THREADS` | Engine thread count (default: 1) |
| `ENGINE_HASH` | Hash table size in MB (default: 128) |
| `ENGINE_DEPTH` | Default analysis depth (default: 18) |
| `PORT` | Server port (default: 3001) |

### Web (`web/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Analysis server URL (optional, defaults to localhost:3001) |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Fairy Stockfish](https://github.com/fairy-stockfish/Fairy-Stockfish) — Multi-variant chess engine
- [Pikafish](https://github.com/official-pikafish/Pikafish) — Strong Xiangqi engine
- [chess.com](https://chess.com) — UI/UX inspiration
- [Rechess](https://github.com/haydenteh5526/Rechess) — Sister project for chess
