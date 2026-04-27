import type { AppConfig } from "../config.js";
import type { MatchService } from "./match-service.js";
import { DummyMatchService } from "./dummy-match-service.js";
import { RealMatchService } from "./real-match-service.js";

export function createMatchService(config: AppConfig): MatchService {
  if (config.backendMode === "real") {
    return new RealMatchService();
  }
  return new DummyMatchService(config);
}
