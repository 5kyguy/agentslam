import { formatInt } from "@/lib/format";

// AgentSlam Match Simulation Engine
// Generates realistic market data, trades, and match events

export interface SimulationState {
  matchId: string;
  elapsed: number;
  duration: number;

  leftAgentPnL: number;
  rightAgentPnL: number;
  leftAgentTrades: number;
  rightAgentTrades: number;

  stakingVelocity: number;
  totalStaked: number;
  leftStaked: number;
  rightStaked: number;
  odds: {
    left: number;
    right: number;
  };

  ethPrice: number;
  blockHeight: number;
  transactionsPerSecond: number;
  networkLatency: number;

  recentTrades: TradeEvent[];
  chatMessages: ChatMessage[];
  systemEvents: SystemEvent[];

  lastLeadChange: number;
  isPowerUpAvailable: boolean;
  tradeAnticipationMeter: number;
}

export interface TradeEvent {
  id: string;
  timestamp: number;
  agent: "left" | "right";
  type: "LONG" | "SHORT" | "CLOSE";
  size: number;
  pnl: number;
  price: number;
}

export interface ChatMessage {
  id: string;
  timestamp: number;
  author: string;
  role: "user" | "oracle" | "system" | "bot";
  content: string;
  prediction?: "left" | "right";
}

export interface SystemEvent {
  id: string;
  timestamp: number;
  type: "LEAD_CHANGE" | "HOT_MONEY" | "CRITICAL_ALERT" | "POWER_UP" | "QUEST";
  description: string;
  severity: "low" | "medium" | "high";
}

const SIMULATION_CONFIG = {
  INITIAL_ETH: 2450,
  VOLATILITY: 0.015,
  DRIFT: -0.001,
  UPDATE_INTERVAL: 2300,
  TRADE_FREQUENCY: 6800,
  CHAT_FREQUENCY: 4500,
  STAKE_ARRIVAL_INTERVAL: 3000,
};

const BOT_NAMES = [
  "CryptoWizard",
  "VolatilityHunter",
  "ChainAnalyst",
  "TradeBot7",
  "OracleWhisperer",
  "LiquiditySeeker",
  "TrendSpotter",
  "VegasOdds",
  "MomentumMaster",
  "RektRescuer",
  "ArbitrageKing",
  "SignalSpy",
  "BlockBuilder",
  "SwapMaster",
  "GasOptimizer",
];

const SYSTEM_MESSAGES = [
  "Lead change! The momentum shifts!",
  "Critical trade alert: position size increased!",
  "Network latency spike detected",
  "Hot money inbound - staking velocity surge!",
  "Prediction market update: odds shifting",
  "Mid-match challenge: Will we see a reversal?",
  "Consensus forming in the crowd",
  "Whale activity detected",
];

function createSeedTrades(basePrice: number): TradeEvent[] {
  return [
    { id: "seed-trade-1", timestamp: 18, agent: "left", type: "LONG", size: 2.4, pnl: 22.4, price: basePrice - 6 },
    { id: "seed-trade-2", timestamp: 26, agent: "right", type: "SHORT", size: 3.1, pnl: -14.2, price: basePrice - 3 },
    { id: "seed-trade-3", timestamp: 41, agent: "left", type: "CLOSE", size: 1.2, pnl: 9.8, price: basePrice + 2 },
    { id: "seed-trade-4", timestamp: 53, agent: "right", type: "LONG", size: 2.7, pnl: 5.1, price: basePrice + 4 },
    { id: "seed-trade-5", timestamp: 61, agent: "left", type: "LONG", size: 1.9, pnl: 11.3, price: basePrice + 8 },
    { id: "seed-trade-6", timestamp: 74, agent: "right", type: "SHORT", size: 3.8, pnl: -7.4, price: basePrice + 6 },
  ];
}

function createSeedChat(): ChatMessage[] {
  return [
    {
      id: "seed-chat-1",
      timestamp: 15,
      author: "System",
      role: "system",
      content: "Arena initialized. Prediction market open.",
    },
    {
      id: "seed-chat-2",
      timestamp: 34,
      author: "Oracle",
      role: "oracle",
      content: "Large wallet staked $8,000 on Left",
      prediction: "left",
    },
    {
      id: "seed-chat-3",
      timestamp: 46,
      author: "CryptoWizard",
      role: "bot",
      content: "Momentum still favors disciplined entries.",
      prediction: "left",
    },
    {
      id: "seed-chat-4",
      timestamp: 59,
      author: "VolatilityHunter",
      role: "bot",
      content: "Right side could squeeze if ETH rejects this level.",
      prediction: "right",
    },
  ];
}

function createSeedEvents(): SystemEvent[] {
  return [
    {
      id: "seed-event-1",
      timestamp: 22,
      type: "HOT_MONEY",
      description: "Hot money detected entering Left pool",
      severity: "medium",
    },
    {
      id: "seed-event-2",
      timestamp: 48,
      type: "QUEST",
      description: "Quest active: Predict next lead switch in 60s",
      severity: "low",
    },
  ];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

export class MatchSimulation {
  private state: SimulationState;
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private startTime: number;

  constructor(matchId: string, initialState?: Partial<SimulationState>) {
    this.startTime = Date.now();
    this.state = {
      matchId,
      elapsed: 0,
      duration: 1684,
      leftAgentPnL: 245.5,
      rightAgentPnL: 187.3,
      leftAgentTrades: 8,
      rightAgentTrades: 6,
      stakingVelocity: 2.5,
      totalStaked: 50000,
      leftStaked: 28000,
      rightStaked: 22000,
      odds: { left: 56, right: 44 },
      ethPrice: SIMULATION_CONFIG.INITIAL_ETH,
      blockHeight: 18500000,
      transactionsPerSecond: 45,
      networkLatency: 250,
      recentTrades: createSeedTrades(SIMULATION_CONFIG.INITIAL_ETH),
      chatMessages: createSeedChat(),
      systemEvents: createSeedEvents(),
      lastLeadChange: 0,
      isPowerUpAvailable: false,
      tradeAnticipationMeter: 58,
      ...initialState,
    };
  }

  start(onStateChange: (state: SimulationState) => void) {
    this.stop();

    this.intervals.set(
      "timer",
      setInterval(() => {
        this.state.elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        if (this.state.elapsed >= this.state.duration) {
          this.stop();
        }
      }, 100),
    );

    this.intervals.set(
      "market",
      setInterval(() => {
        this.updateMarketData();
        onStateChange(this.getState());
      }, SIMULATION_CONFIG.UPDATE_INTERVAL),
    );

    this.intervals.set(
      "trades",
      setInterval(() => {
        this.generateTrade();
        onStateChange(this.getState());
      }, SIMULATION_CONFIG.TRADE_FREQUENCY),
    );

    this.intervals.set(
      "chat",
      setInterval(() => {
        this.generateChatMessage();
        onStateChange(this.getState());
      }, SIMULATION_CONFIG.CHAT_FREQUENCY),
    );

    this.intervals.set(
      "stakes",
      setInterval(() => {
        this.addStake();
        onStateChange(this.getState());
      }, SIMULATION_CONFIG.STAKE_ARRIVAL_INTERVAL),
    );

    onStateChange(this.getState());
  }

  private updateMarketData() {
    const randomReturn = (Math.random() - 0.5) * 2 * SIMULATION_CONFIG.VOLATILITY + SIMULATION_CONFIG.DRIFT;
    this.state.ethPrice *= 1 + randomReturn;

    this.state.blockHeight += 1;
    this.state.transactionsPerSecond = 45 + Math.random() * 20 - 10;
    this.state.networkLatency = 250 + Math.sin(this.state.elapsed / 10) * 50;

    const agentVolatility = 0.8;
    this.state.leftAgentPnL *= 1 + (randomReturn * agentVolatility + 0.002);
    this.state.rightAgentPnL *= 1 + (randomReturn * 0.8 - 0.001);

    const leftWinning = this.state.leftAgentPnL > this.state.rightAgentPnL;
    const timeSinceLastChange = this.state.elapsed - this.state.lastLeadChange;

    if (timeSinceLastChange > 30 && Math.random() > 0.85) {
      this.state.lastLeadChange = this.state.elapsed;
      this.addSystemEvent(
        "LEAD_CHANGE",
        `Lead changed: ${leftWinning ? "Left" : "Right"} agent takes the lead!`,
        "high",
      );
    }

    if (Math.random() > 0.92) {
      this.addSystemEvent("CRITICAL_ALERT", pickRandom(SYSTEM_MESSAGES), "medium");
    }

    this.updateOdds();
    this.state.tradeAnticipationMeter = clamp(this.state.tradeAnticipationMeter + (Math.random() - 0.5) * 15, 0, 100);
  }

  private generateTrade() {
    const agent = Math.random() > 0.5 ? "left" : "right";
    const type = Math.random() > 0.6 ? "LONG" : Math.random() > 0.5 ? "SHORT" : "CLOSE";
    const size = Math.random() * 5 + 0.5;
    const pnl = (Math.random() - 0.4) * 50;

    const trade: TradeEvent = {
      id: `trade-${Date.now()}`,
      timestamp: this.state.elapsed,
      agent,
      type,
      size,
      pnl,
      price: this.state.ethPrice,
    };

    if (agent === "left") {
      this.state.leftAgentTrades += 1;
      this.state.leftAgentPnL += pnl * 0.1;
    } else {
      this.state.rightAgentTrades += 1;
      this.state.rightAgentPnL += pnl * 0.1;
    }

    this.state.recentTrades.unshift(trade);
    if (this.state.recentTrades.length > 12) {
      this.state.recentTrades.pop();
    }

    this.state.tradeAnticipationMeter = 0;
  }

  private generateChatMessage() {
    const botName = pickRandom(BOT_NAMES);
    const messages = [
      `${botName} is riding this wave!`,
      "Taking profit on that move",
      "Did you see that momentum shift?",
      "The crowd is split on this one",
      `Prediction: next move is ${Math.random() > 0.5 ? "UP" : "DOWN"}`,
      "This is the crucial moment right here",
      "Wait for the reversal they said...",
      "Contrarian play incoming",
      "Just claimed my quest reward!",
    ];

    const prediction = Math.random() > 0.5 ? "left" : "right";

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      timestamp: this.state.elapsed,
      author: botName,
      role: "bot",
      content: pickRandom(messages),
      ...(Math.random() > 0.6 && { prediction }),
    };

    this.state.chatMessages.unshift(message);
    if (this.state.chatMessages.length > 20) {
      this.state.chatMessages.pop();
    }
  }

  private addStake() {
    const amount = Math.random() * 9000 + 1000;
    const side = Math.random() > 0.4 ? "left" : "right";

    if (side === "left") {
      this.state.leftStaked += amount;
    } else {
      this.state.rightStaked += amount;
    }
    this.state.totalStaked += amount;

    this.state.stakingVelocity = (amount / 3000) * 10;

    if (this.state.stakingVelocity > 7.5) {
      this.addSystemEvent("HOT_MONEY", "Hot money inbound - staking velocity surge!", "medium");
    }

    this.state.chatMessages.unshift({
      id: `stake-${Date.now()}`,
      timestamp: this.state.elapsed,
      author: "Oracle",
      role: "oracle",
      content: `${pickRandom(BOT_NAMES)} staked $${formatInt(Math.round(amount))} on ${side === "left" ? "Left" : "Right"}`,
      prediction: side,
    });

    if (this.state.chatMessages.length > 20) {
      this.state.chatMessages.pop();
    }
  }

  private updateOdds() {
    const total = this.state.leftStaked + this.state.rightStaked || 1;
    let leftOdds = (this.state.leftStaked / total) * 100;
    const contrarian = 1 - leftOdds / 100;
    leftOdds = leftOdds * 0.7 + contrarian * 30;

    this.state.odds.left = Math.round(leftOdds);
    this.state.odds.right = 100 - this.state.odds.left;
  }

  private addSystemEvent(
    type: SystemEvent["type"],
    description: string,
    severity: SystemEvent["severity"],
  ) {
    this.state.systemEvents.unshift({
      id: `event-${Date.now()}`,
      timestamp: this.state.elapsed,
      type,
      description,
      severity,
    });

    if (this.state.systemEvents.length > 8) {
      this.state.systemEvents.pop();
    }
  }

  addUserMessage(content: string) {
    const clean = content.trim();
    if (!clean) return;

    this.state.chatMessages.unshift({
      id: `user-${Date.now()}`,
      timestamp: this.state.elapsed,
      author: "You",
      role: "user",
      content: clean,
    });

    if (this.state.chatMessages.length > 20) {
      this.state.chatMessages.pop();
    }
  }

  triggerPowerUp() {
    this.state.isPowerUpAvailable = false;
    this.addSystemEvent("POWER_UP", "Power up deployed by crowd support", "high");
    return {
      direction: Math.random() > 0.5 ? "left" : "right",
      strength: Math.random() * 50 + 25,
    };
  }

  getState(): SimulationState {
    return {
      ...this.state,
      odds: { ...this.state.odds },
      recentTrades: [...this.state.recentTrades],
      chatMessages: [...this.state.chatMessages],
      systemEvents: [...this.state.systemEvents],
    };
  }

  stop() {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }

  reset() {
    this.stop();
    this.startTime = Date.now();
    this.state.elapsed = 0;
  }
}

let currentSimulation: MatchSimulation | null = null;

export function initializeMatchSimulation(
  matchId: string,
  initialState?: Partial<SimulationState>,
): MatchSimulation {
  if (currentSimulation) {
    currentSimulation.stop();
  }
  currentSimulation = new MatchSimulation(matchId, initialState);
  return currentSimulation;
}

export function getCurrentSimulation(): MatchSimulation | null {
  return currentSimulation;
}

export function formatTimer(seconds: number) {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const s = (safe % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
