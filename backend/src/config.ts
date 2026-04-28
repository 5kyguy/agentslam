export interface AppConfig {
  port: number;
  host: string;
  corsOrigin: string;
  databaseUrl: string;
  llm: {
    provider: string;
    apiKey: string;
    model: string;
    baseUrl: string;
  };
  uniswap: {
    apiKey: string;
    baseUrl: string;
    chainId: number;
    swapperAddress: string;
    timeoutMs: number;
    maxRetries: number;
    /** `mock` = never call POST /swap; `live` = build unsigned txs via POST /swap (requires signing/broadcast). */
    swapMode: "mock" | "live";
  };
  agents: {
    pythonPath: string;
    packageDir: string;
  };
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseSwapMode(raw: string | undefined): "mock" | "live" {
  const v = (raw ?? "mock").toLowerCase();
  if (v === "live") return "live";
  return "mock";
}

export function getConfig(): AppConfig {
  const llmProvider = process.env.LLM_PROVIDER ?? "openai";
  const defaultBaseUrl = llmProvider === "anthropic"
    ? "https://api.anthropic.com/v1"
    : "https://api.openai.com/v1";

  return {
    port: envNumber("PORT", 8787),
    host: process.env.HOST ?? "0.0.0.0",
    corsOrigin: process.env.CORS_ORIGIN ?? "*",
    databaseUrl: process.env.DATABASE_URL ?? "postgresql://agentslam:agentslam@localhost:5432/agentslam",
    llm: {
      provider: llmProvider,
      apiKey: process.env.LLM_API_KEY ?? "",
      model: process.env.LLM_MODEL ?? "gpt-4o-mini",
      baseUrl: process.env.LLM_BASE_URL ?? defaultBaseUrl,
    },
    uniswap: {
      apiKey: process.env.UNISWAP_API_KEY ?? "",
      baseUrl: process.env.UNISWAP_BASE_URL ?? "https://trade-api.gateway.uniswap.org/v1",
      chainId: envNumber("UNISWAP_CHAIN_ID", 1),
      swapperAddress: process.env.UNISWAP_SWAPPER_ADDRESS ?? "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      timeoutMs: envNumber("UNISWAP_TIMEOUT_MS", 15000),
      maxRetries: envNumber("UNISWAP_MAX_RETRIES", 2),
      swapMode: parseSwapMode(process.env.UNISWAP_SWAP_MODE),
    },
    agents: {
      pythonPath: process.env.AGENTS_PYTHON_PATH ?? "python3",
      packageDir: process.env.AGENTS_PACKAGE_DIR ?? "",
    },
  };
}

