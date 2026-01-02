"""Data models for odds tracking."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Literal, Optional


@dataclass
class OutcomeOdds:
    """Represents an individual betting outcome."""

    outcome: Literal["home", "away", "over", "under"]
    price: int  # American odds
    line: Optional[float] = None  # Spread or total (None for moneyline)


@dataclass
class MarketOdds:
    """Represents a market within an event."""

    market_type: Literal["moneyline", "spread", "total"]
    book: str = ""  # Sportsbook identifier
    outcomes: List[OutcomeOdds] = field(default_factory=list)


@dataclass
class EventOdds:
    """Represents a single sporting event with all its markets."""

    event_id: str
    sport: str
    home_team: str
    away_team: str
    markets: List[MarketOdds] = field(default_factory=list)
    start_time: Optional[datetime] = None


@dataclass
class OddsRow:
    """A flattened row representing a single odds snapshot."""

    timestamp_utc: str
    book: str
    sport: str
    event_id: str
    event_start_time: Optional[str]
    home_team: str
    away_team: str
    market_type: str
    outcome: str
    price: int
    line: Optional[float]

    def to_dict(self) -> dict:
        """Convert to dictionary for CSV writing."""
        return {
            "timestamp_utc": self.timestamp_utc,
            "book": self.book,
            "sport": self.sport,
            "event_id": self.event_id,
            "event_start_time": self.event_start_time or "",
            "home_team": self.home_team,
            "away_team": self.away_team,
            "market_type": self.market_type,
            "outcome": self.outcome,
            "price": self.price,
            "line": self.line if self.line is not None else "",
        }

    @classmethod
    def fieldnames(cls) -> List[str]:
        """Return CSV field names."""
        return [
            "timestamp_utc",
            "book",
            "sport",
            "event_id",
            "event_start_time",
            "home_team",
            "away_team",
            "market_type",
            "outcome",
            "price",
            "line",
        ]


@dataclass
class LatestOddsRow:
    """A row in the latest snapshot with computed movement fields."""

    book: str
    sport: str
    event_id: str
    event_start_time: Optional[str]
    home_team: str
    away_team: str
    market_type: str
    outcome: str
    opening_price: int
    current_price: int
    price_movement: int
    opening_line: Optional[float]
    current_line: Optional[float]
    line_movement: Optional[float]
    last_updated: str

    def to_dict(self) -> dict:
        """Convert to dictionary for CSV writing."""
        return {
            "book": self.book,
            "sport": self.sport,
            "event_id": self.event_id,
            "event_start_time": self.event_start_time or "",
            "home_team": self.home_team,
            "away_team": self.away_team,
            "market_type": self.market_type,
            "outcome": self.outcome,
            "opening_price": self.opening_price,
            "current_price": self.current_price,
            "price_movement": self.price_movement,
            "opening_line": self.opening_line if self.opening_line is not None else "",
            "current_line": self.current_line if self.current_line is not None else "",
            "line_movement": self.line_movement if self.line_movement is not None else "",
            "last_updated": self.last_updated,
        }

    @classmethod
    def fieldnames(cls) -> List[str]:
        """Return CSV field names."""
        return [
            "book",
            "sport",
            "event_id",
            "event_start_time",
            "home_team",
            "away_team",
            "market_type",
            "outcome",
            "opening_price",
            "current_price",
            "price_movement",
            "opening_line",
            "current_line",
            "line_movement",
            "last_updated",
        ]
