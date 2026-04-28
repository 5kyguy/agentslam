import { randomUUID } from "node:crypto";
import type { AgentCreateRequest, AgentState, AgentStats } from "../types.js";
import type { Store } from "../store/store.js";

const DEFAULT_STATS: AgentStats = {
  rating: 1200,
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  avgPnlPct: 0,
};

export class AgentRegistry {
  constructor(private readonly store: Store) {}

  create(input: AgentCreateRequest, compiledPrompt: string): AgentState {
    const id = `agent_${randomUUID().slice(0, 8)}`;
    const agent: AgentState = {
      id,
      name: input.name,
      status: "ready",
      strategy: input.strategy,
      prompt: compiledPrompt,
      riskTolerance: input.riskTolerance ?? 0.5,
      personality: input.personality ?? "",
      createdAt: new Date().toISOString(),
      stats: { ...DEFAULT_STATS },
    };
    this.store.saveAgent(agent);
    return agent;
  }

  get(id: string): AgentState | undefined {
    return this.store.getAgent(id);
  }

  list(): AgentState[] {
    return this.store.listAgents();
  }

  delete(id: string): boolean {
    return this.store.deleteAgent(id);
  }

  setStatus(id: string, status: AgentState["status"]): void {
    this.store.updateAgentStatus(id, status);
  }

  updateStats(id: string, result: "win" | "loss" | "draw", pnlPct: number): void {
    this.store.updateAgentStats(id, result, pnlPct);
  }
}
