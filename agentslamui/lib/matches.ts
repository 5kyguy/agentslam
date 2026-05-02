import { matchToMeta, type AgentBrand, type MatchMeta } from "@/lib/live-adapters";

export type { AgentBrand, MatchMeta };

export const MATCHES: MatchMeta[] = [];

export function getMatchById(id: string): MatchMeta {
  return matchToMeta(null, id);
}

export function getPrimaryLiveMatch(): MatchMeta {
  return matchToMeta(null, "pending");
}
