# Chain Slam Dummy Backend

Placeholder backend server for frontend integration while real referee/agent backends are built incrementally.

## Quick Start

```bash
npm install
npm run dev
```

Server default: `http://localhost:8787`

## Environment

Copy `.env.example` and adjust as needed:

- `BACKEND_MODE=dummy|real` (`real` is a placeholder and intentionally not implemented)
- `SIM_SEED` for deterministic simulated behavior
- `SIM_TICK_MS` simulation tick interval in milliseconds
- `SIM_ERROR_RATE` reserved for future fault injection
- `CORS_ORIGIN` frontend origin allow-list (or `*` for local development)

## API Contracts

### REST

- `POST /api/matches`
- `GET /api/matches/:id`
- `GET /api/matches/:id/trades`
- `GET /api/matches/:id/feed`
- `POST /api/matches/:id/stop`
- `GET /api/strategies`
- `GET /api/leaderboard`

### WebSocket

- `WS /ws/matches/:id`

Event envelope shape:

```json
{
  "event": "snapshot | decision | trade_executed | completed | stopped",
  "match_id": "match_xxx",
  "timestamp": "2026-04-27T07:00:00.000Z",
  "payload": {}
}
```

Decision event payload:

```json
{
  "event": "decision",
  "contender": "Momentum Trader",
  "action": "buy",
  "amount": 150,
  "reasoning": "Price action confirms trend continuation.",
  "confidence": 0.72,
  "timestamp": "2026-04-27T07:00:00.000Z"
}
```

Trade event payload:

```json
{
  "event": "trade_executed",
  "contender": "Momentum Trader",
  "txHash": "0xabc123",
  "sold": { "token": "USDC", "amount": 150 },
  "bought": { "token": "WETH", "amount": 0.044 },
  "gasUsd": 1.23,
  "timestamp": "2026-04-27T07:00:00.000Z"
}
```

## Validation / QA

Run the smoke test:

```bash
npm run test:smoke
```

The smoke script verifies:

1. Match creation
2. WS snapshot reception
3. Feed and trade retrieval
4. Stop endpoint
5. Leaderboard retrieval
