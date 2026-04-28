import type { Store } from "./store.js";
import { PostgresStore } from "./postgres-store.js";

export function createStore(databaseUrl: string): Store {
  return new PostgresStore(databaseUrl);
}
