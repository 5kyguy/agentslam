# Simulation Engine

`lib/simulation/engine.ts` powers the UI with continuous mock updates.

## Responsibilities
- Create baseline match state (`createInitialSimulation`)
- Advance state on each tick (`stepSimulation`)
- Append user chat (`appendUserChat`)
- Format utility values (`formatTimer`)

## Data simulated
- Timer, viewers, odds, tug-of-war momentum
- Stoic/Berserk PnL drift
- Trade tape entries
- Chat stream entries
- Activity histogram values

`hooks/useMatchSimulation.ts` runs the engine at a fixed interval for all live pages.
