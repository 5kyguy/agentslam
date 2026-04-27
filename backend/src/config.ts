export interface AppConfig {
  port: number;
  host: string;
  corsOrigin: string;
  backendMode: "dummy" | "real";
  simSeed: number;
  simTickMs: number;
  simErrorRate: number;
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getConfig(): AppConfig {
  return {
    port: envNumber("PORT", 8787),
    host: process.env.HOST ?? "0.0.0.0",
    corsOrigin: process.env.CORS_ORIGIN ?? "*",
    backendMode: process.env.BACKEND_MODE === "real" ? "real" : "dummy",
    simSeed: envNumber("SIM_SEED", 42),
    simTickMs: envNumber("SIM_TICK_MS", 2000),
    simErrorRate: envNumber("SIM_ERROR_RATE", 0)
  };
}
