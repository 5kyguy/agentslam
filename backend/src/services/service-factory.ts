import type { AppConfig } from "../config.js";
import type { MatchService } from "./match-service.js";
import type { AgentService } from "./agent-service.js";
import type { Store } from "../store/store.js";
import type { AgentProcessManager } from "../agents/process-manager.js";
import { RealMatchService } from "./real-match-service.js";
import { UniswapClient } from "../integrations/uniswap.js";
import { KeeperHubClient } from "../integrations/keeperhub.js";
import { KeeperHubExecutionPoller } from "./keeperhub-execution-poller.js";

export interface MatchServiceBundle {
  matchService: MatchService;
  keeperHubPoller?: KeeperHubExecutionPoller;
}

export function buildMatchServiceBundle(
  config: AppConfig,
  agentService: AgentService,
  store: Store,
  processManager: AgentProcessManager,
): MatchServiceBundle {
  const uniswap = new UniswapClient({
    apiKey: config.uniswap.apiKey,
    baseUrl: config.uniswap.baseUrl,
    chainId: config.uniswap.chainId,
    swapperAddress: config.uniswap.swapperAddress,
    timeoutMs: config.uniswap.timeoutMs,
    maxRetries: config.uniswap.maxRetries,
    permit2Disabled: config.uniswap.permit2Disabled,
    universalRouterVersion: config.uniswap.universalRouterVersion,
    permitSignature: config.uniswap.permitSignature,
  });

  const khCfg = config.keeperhub;
  const keeperHub =
    khCfg.apiKey.trim().length > 0
      ? new KeeperHubClient({
          apiKey: khCfg.apiKey,
          baseUrl: khCfg.baseUrl,
          timeoutMs: khCfg.timeoutMs,
          maxRetries: khCfg.maxRetries,
        })
      : undefined;

  const keeperHubPoller =
    keeperHub !== undefined ? new KeeperHubExecutionPoller(store, keeperHub, khCfg) : undefined;

  const matchService = new RealMatchService(
    config,
    agentService,
    store,
    processManager,
    uniswap,
    keeperHub,
    keeperHubPoller,
  );

  return { matchService, keeperHubPoller };
}

export function createMatchService(
  config: AppConfig,
  agentService: AgentService,
  store: Store,
  processManager: AgentProcessManager,
): MatchService {
  return buildMatchServiceBundle(config, agentService, store, processManager).matchService;
}
