import type { AppConfig } from "../config.js";
import type { MatchService } from "./match-service.js";
import type { AgentService } from "./agent-service.js";
import type { Store } from "../store/store.js";
import type { AgentProcessManager } from "../agents/process-manager.js";
import { RealMatchService } from "./real-match-service.js";
import { UniswapClient } from "../integrations/uniswap.js";

export function createMatchService(
  config: AppConfig,
  agentService: AgentService,
  store: Store,
  processManager: AgentProcessManager,
): MatchService {
  const uniswap = new UniswapClient({
    apiKey: config.uniswap.apiKey,
    baseUrl: config.uniswap.baseUrl,
    chainId: config.uniswap.chainId,
    swapperAddress: config.uniswap.swapperAddress,
    timeoutMs: config.uniswap.timeoutMs,
    maxRetries: config.uniswap.maxRetries,
  });

  return new RealMatchService(config, agentService, store, processManager, uniswap);
}
