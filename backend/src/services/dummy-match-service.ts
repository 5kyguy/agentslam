import { STRATEGIES } from "./strategy-catalog.js";
import type { AppConfig } from "../config.js";
import { SimulationEngine } from "./simulation-engine.js";
import type { MatchService } from "./match-service.js";
import type { Store } from "../store/store.js";
import type { MatchCreateRequest } from "../types.js";

export class DummyMatchService implements MatchService {
  private readonly engine: SimulationEngine;

  constructor(config: AppConfig, private readonly store: Store) {
    this.engine = new SimulationEngine(config, store);
  }

  createMatch(input: MatchCreateRequest) {
    return this.engine.createMatch(input);
  }

  getMatch(id: string) {
    return this.store.getMatch(id);
  }

  getTrades(id: string) {
    return this.store.getTrades(id);
  }

  getFeed(id: string) {
    return this.store.getFeed(id);
  }

  stopMatch(id: string) {
    return this.engine.stopMatch(id);
  }

  getStrategies() {
    return STRATEGIES;
  }

  getLeaderboard() {
    const lb = this.store.getLeaderboard();
    if (lb.length > 0) return lb;
    return [
      { rank: 1, strategy: "Momentum Trader", rating: 1236, wins: 8, losses: 3, draws: 1, avgPnlPct: 4.22, matchesPlayed: 12 },
      { rank: 2, strategy: "DCA Bot", rating: 1210, wins: 7, losses: 4, draws: 1, avgPnlPct: 3.18, matchesPlayed: 12 },
    ];
  }

  onWsConnect(matchId: string, send: (payload: unknown) => void): () => void {
    const match = this.getMatch(matchId);
    if (match) {
      send({ event: "snapshot", match_id: matchId, timestamp: new Date().toISOString(), payload: match });
    }
    return this.store.subscribe(matchId, send);
  }
}
