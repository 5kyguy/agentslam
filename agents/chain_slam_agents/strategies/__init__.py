from .impl import (
    DCAStrategy,
    MomentumStrategy,
    MeanReverterStrategy,
    FearGreedStrategy,
    GridStrategy,
    RandomStrategy,
)

STRATEGIES: dict[str, type] = {
    "dca": DCAStrategy,
    "momentum": MomentumStrategy,
    "mean_reverter": MeanReverterStrategy,
    "fear_greed": FearGreedStrategy,
    "grid": GridStrategy,
    "random": RandomStrategy,
}
