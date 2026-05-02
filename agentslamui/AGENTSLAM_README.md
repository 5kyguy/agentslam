# AgentSlam UI

AgentSlam UI is a Next.js App Router application for the Agent Slam backend arena.

## Backend Integration

Set the backend URL before running the frontend:

```bash
cp .env.example .env.local
npm run dev
```

Default API target: `http://localhost:8787`.

The match pages use backend REST plus `WS /ws/matches/:id` for live snapshots, decisions, trades, KeeperHub audit updates, and 0G memory proof status.

## Routes
- `/` lobby
- `/matches` backend match command center and creation flow
- `/matches/[id]` backend match detail
- `/matches/[id]/arena` live arena feed + chat
- `/matches/[id]/recap` replay-style recap
- `/strategies` backend strategy marketplace
- `/leaderboard` backend ranking views
- `/season` season progress hub
- `/creator/dashboard` backend creator telemetry dashboard

## Architecture
- Domain components: `components/agentslam/*`
- Backend API client: `lib/api.ts`
- Backend-to-UI adapters: `lib/live-adapters.ts`
- Live match hook: `hooks/useMatchSimulation.ts`
