from enum import Enum
from dataclasses import dataclass


class ActionType(str, Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


@dataclass
class StrategySignal:
    action: ActionType
    amount: float
    reasoning: str
    confidence: float


@dataclass
class TickContext:
    token_pair: str
    eth_price: float
    price_history: list[float]
    usdc_balance: float
    eth_balance: float
    portfolio_usd: float
    pnl_pct: float
    trade_count: int
    tick_number: int
    ticks_remaining: int


@dataclass
class MatchInfo:
    match_id: str
    token_pair: str
    starting_capital_usd: float
    contender_side: str
