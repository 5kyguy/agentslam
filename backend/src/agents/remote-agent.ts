import type { StrategySignal, TickContext } from "../types.js";

const EVALUATE_TIMEOUT_MS = 8_000;

export class RemoteAgentConnection {
  private socket: import("ws").WebSocket | null = null;
  private pendingResolve: ((signal: StrategySignal) => void) | null = null;
  private pendingTimer: NodeJS.Timeout | null = null;
  private connected = false;

  isConnected(): boolean {
    return this.connected;
  }

  register(socket: import("ws").WebSocket): void {
    this.socket = socket;
    this.connected = true;

    socket.on("message", (raw: Buffer) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      } catch {
        return;
      }

      if (msg.type === "decision" && this.pendingResolve) {
        if (this.pendingTimer) clearTimeout(this.pendingTimer);
        const resolve = this.pendingResolve;
        this.pendingResolve = null;
        this.pendingTimer = null;

        resolve({
          action: this.parseAction(msg.action as string),
          amount: Number(msg.amount) || 0,
          reasoning: String(msg.reasoning ?? "").slice(0, 500),
          confidence: Math.min(1, Math.max(0, Number(msg.confidence) || 0)),
        });
      }
    });

    socket.on("close", () => {
      this.connected = false;
      this.socket = null;
      if (this.pendingResolve) {
        clearTimeout(this.pendingTimer!);
        this.pendingResolve({ action: "hold", amount: 0, reasoning: "Agent disconnected.", confidence: 0 });
        this.pendingResolve = null;
        this.pendingTimer = null;
      }
    });
  }

  async evaluate(ctx: TickContext): Promise<StrategySignal> {
    if (!this.socket || !this.connected) {
      return { action: "hold", amount: 0, reasoning: "Agent not connected.", confidence: 0 };
    }

    return new Promise<StrategySignal>((resolve) => {
      this.pendingResolve = resolve;
      this.pendingTimer = setTimeout(() => {
        this.pendingResolve = null;
        this.pendingTimer = null;
        resolve({ action: "hold", amount: 0, reasoning: "Agent evaluate timeout.", confidence: 0 });
      }, EVALUATE_TIMEOUT_MS);

      this.socket!.send(JSON.stringify({ type: "tick", ...ctx }));
    });
  }

  sendEnd(reason: string): void {
    if (this.socket && this.connected) {
      this.socket.send(JSON.stringify({ type: "match_end", reason }));
      this.socket.close();
    }
    this.connected = false;
    this.socket = null;
  }

  private parseAction(raw: string): "buy" | "sell" | "hold" {
    const v = String(raw).toLowerCase().trim();
    if (v === "buy" || v === "sell" || v === "hold") return v;
    return "hold";
  }
}
