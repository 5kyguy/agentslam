# Architecture

Agent Slam is a Fastify (TypeScript) backend that orchestrates head-to-head matches between Python agent processes. PostgreSQL persists all state; WebSocket streams live updates to the UI.

```bash
                        AGENT SLAM UI
               live leaderboard, feed, setup
                            |
                        HTTP / WS
                            |
                    ┌───────┴───────┐
                    │  Fastify API   │
                    │  (TypeScript)  │
                    └───┬───────┬───┘
                        |       |
              ┌─────────┘       └──────────┐
              |                             |
    ┌─────────┴─────────┐       ┌──────────┴──────────┐
    │  RealMatchService  │       │  AgentProcessManager │
    │  (Referee role)    │       │  spawn / kill procs  │
    └─────────┬─────────┘       └──────────┬──────────┘
              |                             |
        WS /ws/matches/:id          WS /ws/agent/:id
              |                        /        \
    ┌─────────┴─────────┐    ┌───────┴───┐  ┌────┴─────┐
    │    UI Clients      │    │ Python A  │  │ Python B │
    │  (snapshots, feed) │    │ Strategy  │  │ Strategy │
    └───────────────────-┘    └───────────┘  └──────────┘
                                    |
                          ┌─────────┴─────────┐
                          │ Uniswap Trading API│
                          │ (optional prices)  │
                          └───────────────────┘
```

## Backend Server (TypeScript / Fastify)

The backend is the referee and source of truth. It does not trade — it orchestrates.

Responsibilities:

- Register agents and manage their lifecycle state.
- Create matches, enforce rules, track PnL, and declare winners.
- Spawn Python agent processes on match start, kill them on match end.
- Own all portfolio balances and trade execution (paper trading).
- Stream live match updates to UI clients via WebSocket.
- Persist all state to PostgreSQL.

Key modules:

| Module | File | Purpose |
| --- | --- | --- |
| `RealMatchService` | `services/real-match-service.ts` | Match lifecycle, tick loop, portfolio tracking |
| `AgentProcessManager` | `agents/process-manager.ts` | Spawn and kill Python agent processes |
| `RemoteAgentConnection` | `agents/remote-agent.ts` | WS-based evaluate with 8s timeout |
| `AgentService` | `services/agent-service.ts` | Agent CRUD and stats |
| `PostgresStore` | `store/postgres-store.ts` | Write-through persistence |
| `UniswapClient` | `integrations/uniswap.ts` | Real price quotes (optional) |

## Python Agent Processes

Each contender runs as a separate Python process. The backend spawns them via `AgentProcessManager` and communicates over WebSocket.

### Agent Lifecycle

1. **Spawn**: On match creation, `AgentProcessManager.spawn()` starts `python3 -m chain_slam_agents --agent-id <id> --strategy <strategy> --ws-url <url>`.
2. **Connect**: The Python process connects to `/ws/agent/:agentId`. The `RemoteAgentConnection.register()` binds the socket.
3. **Tick loop**: Every 10 seconds, `RealMatchService` sends a `tick` message with market context. Each agent evaluates its strategy and returns a `decision`.
4. **End**: When the match ends or is stopped, the backend sends `match_end` and kills the process.

### Agent SDK (`agents/chain_slam_agents/`)

```bash
agents/
├── pyproject.toml
└── chain_slam_agents/
    ├── __init__.py
    ├── __main__.py         # Entry point
    ├── runner.py           # WS connection + message loop
    ├── base.py             # Strategy ABC
    ├── types.py            # TickContext, StrategySignal, ActionType
    └── strategies/
        ├── __init__.py     # Strategy registry
        └── impl.py         # All 6 strategy implementations
```

### Strategy Interface

```python
from abc import ABC, abstractmethod
from .types import TickContext, StrategySignal

class Strategy(ABC):
    @abstractmethod
    def evaluate(self, ctx: TickContext) -> StrategySignal: ...

    @abstractmethod
    def describe(self) -> str: ...
```

### Built-in Strategies

| ID | Name | Description | Risk |
| --- | --- | --- | --- |
| `dca` | DCA Bot | Buys fixed amounts at fixed intervals | Low |
| `momentum` | Momentum Trader | Buys into strength, sells into weakness | Medium |
| `mean_reverter` | Mean Reverter | Bets that extreme prices revert to the mean | Medium |
| `fear_greed` | Fear and Greed | Buys drops, sells rallies | Medium-High |
| `grid` | Grid Trader | Trades around predefined price bands | Low-Medium |
| `random` | Random Walk | Random trades as a control baseline | Chaos |

All strategies are purely algorithmic — no LLM calls, fast and deterministic.

## Uniswap Integration

Uniswap is the market data layer (optional). When enabled, the backend fetches real prices from the Uniswap Trading API for match ticks. When disabled or on error, prices are simulated with random walks.

- Trading API base URL: `https://trade-api.gateway.uniswap.org/v1`
- Uses the `/quote` endpoint for price discovery
- No on-chain execution — paper trading only

## Match Rules

| Rule | Description |
| --- | --- |
| Equal capital | Both contenders start with the same USDC balance |
| Same market | Both agents trade the same token pair |
| Position limits | No single trade can use more than 50% of starting capital |
| Minimum trade | Trades must be at least $10 equivalent |
| Transparent decisions | Every decision is broadcast before execution |
| Timeout protection | Agents that don't respond within 8 seconds default to hold |
| Parallel evaluation | Both agents are ticked simultaneously |

## Data Persistence

PostgreSQL 17 stores all durable state. `PostgresStore` extends `InMemoryStore` with a write-through pattern: all reads come from memory, all writes go to both memory and PostgreSQL.

| Table | Purpose |
| --- | --- |
| `agents` | Agent registration, stats, ratings |
| `matches` | Match state, contender data, PnL |
| `trades` | Trade history per match |
| `decisions` | Decision feed per match |
| `leaderboard` | Cached leaderboard rankings |

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/agents` | Register a new agent |
| `GET` | `/api/agents` | List all agents |
| `GET` | `/api/agents/:id` | Get agent state |
| `POST` | `/api/matches` | Create a match |
| `GET` | `/api/matches/:id` | Get match state |
| `GET` | `/api/matches/:id/trades` | Get trade history |
| `GET` | `/api/matches/:id/feed` | Get decision feed |
| `POST` | `/api/matches/:id/stop` | Stop a match |
| `GET` | `/api/strategies` | List available strategies |
| `GET` | `/api/leaderboard` | Get leaderboard |
| `WS` | `/ws/matches/:id` | Stream live match updates (UI) |
| `WS` | `/ws/agent/:agentId` | Agent communication channel (internal) |
