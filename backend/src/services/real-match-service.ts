import type { MatchService } from "./match-service.js";
import type { MatchCreateRequest } from "../types.js";

export class RealMatchService implements MatchService {
  private unsupported(): never {
    throw new Error("Real backend mode is not implemented yet. Use BACKEND_MODE=dummy.");
  }

  createMatch(_input: MatchCreateRequest) {
    return this.unsupported();
  }
  getMatch(_id: string) {
    return this.unsupported();
  }
  getTrades(_id: string) {
    return this.unsupported();
  }
  getFeed(_id: string) {
    return this.unsupported();
  }
  stopMatch(_id: string) {
    return this.unsupported();
  }
  getStrategies() {
    return this.unsupported();
  }
  getLeaderboard() {
    return this.unsupported();
  }
  onWsConnect(_matchId: string, _send: (payload: unknown) => void) {
    return this.unsupported();
  }
}
