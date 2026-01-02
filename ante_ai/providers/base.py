"""Base provider interface for odds APIs."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from ante_ai.models import EventOdds


class OddsProvider(ABC):
    """Abstract base class for odds providers."""

    @abstractmethod
    def fetch_odds(self, sports: List[str]) -> List[EventOdds]:
        """Fetch odds for the given sports.

        Args:
            sports: List of sport identifiers (e.g., ["americanfootball_nfl", "basketball_nba"])

        Returns:
            List of EventOdds objects containing all markets and outcomes
        """
        ...

    @property
    @abstractmethod
    def book_name(self) -> str:
        """Return the sportsbook identifier for this provider."""
        ...
