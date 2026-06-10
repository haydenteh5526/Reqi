# Xiangqi.app — Monorepo

A premium, real-time multiplayer platform for Chinese Chess (Xiangqi).

## Architecture

```
xiangqi/
├── web/        → Next.js frontend (Vercel)
├── server/     → Socket.io game server (Node.js)
└── shared/     → Shared TypeScript types & constants
```

## Stack

| Layer           | Technology                              |
|-----------------|-----------------------------------------|
| Web Frontend    | Next.js 16, React 19, Tailwind CSS v4   |
| Auth & Data     | Supabase (PostgreSQL, Auth, Row-Level Security) |
| Game Server     | Node.js, Express, Socket.io             |
| Shared Types    | TypeScript interfaces (pieces, board, socket events) |
| Hosting         | Vercel (web), Railway/Fly.io (server)   |

## Getting Started

```bash
# Web frontend
cd web
cp .env.local.example .env.local   # Fill in Supabase keys
npm install
npm run dev                        # → http://localhost:3000

# Game server
cd server
cp .env.example .env               # Fill in config
npm install
npm run dev                        # → http://localhost:3001
```