export interface StrategyOption {
  id: string;
  name: string;
  riskProfile: string;
  description: string;
}

export const STRATEGIES: StrategyOption[] = [
  { id: "dca", name: "DCA Bot", riskProfile: "Low", description: "Buys fixed amounts at fixed intervals." },
  {
    id: "momentum",
    name: "Momentum Trader",
    riskProfile: "Medium",
    description: "Buys into strength and sells into weakness."
  },
  {
    id: "mean_reverter",
    name: "Mean Reverter",
    riskProfile: "Medium",
    description: "Bets that extreme prices revert to the mean."
  },
  { id: "fear_greed", name: "Fear and Greed", riskProfile: "Medium-High", description: "Buys drops and sells rallies." },
  { id: "grid", name: "Grid Trader", riskProfile: "Low-Medium", description: "Trades around predefined price bands." },
  { id: "random", name: "Random Walk", riskProfile: "Chaos", description: "Random trades as a control baseline." }
];
