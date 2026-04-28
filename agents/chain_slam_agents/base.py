from abc import ABC, abstractmethod
from .types import TickContext, StrategySignal


class Strategy(ABC):
    @abstractmethod
    def evaluate(self, ctx: TickContext) -> StrategySignal: ...

    @abstractmethod
    def describe(self) -> str: ...
