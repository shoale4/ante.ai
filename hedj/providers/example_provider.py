"""Example odds provider for testing and development."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, List, Optional

import requests

from hedj.models import EventOdds, MarketOdds, OutcomeOdds, PlayerPropOdds
from hedj.providers.base import OddsProvider

logger = logging.getLogger(__name__)


class ExampleProvider(OddsProvider):
    """Example provider that can fetch from a real API or return stub data."""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        regions: List[str],
        books: List[str],
        raw_directory: Optional[str] = None,
        player_prop_markets: Optional[List[str]] = None,
        markets: Optional[List[str]] = None,
    ):
        self.base_url = base_url
        self.api_key = api_key
        self.regions = regions
        self.books = books
        self.raw_directory = Path(raw_directory) if raw_directory else None
        self._book_name = books[0] if books else "example_book"
        self.player_prop_markets = player_prop_markets or []
        self.markets = markets or ["h2h", "spreads", "totals"]
        self.api_requests_used = 0
        self.api_requests_remaining = None

    @property
    def book_name(self) -> str:
        return self._book_name

    def fetch_odds(self, sports: List[str]) -> List[EventOdds]:
        """Fetch odds for the given sports.

        If API key is 'STUB' or API call fails, returns stub data for testing.
        """
        if self.api_key == "STUB":
            logger.info("Using stub data (API key is STUB)")
            return self._get_stub_data(sports)

        all_events: List[EventOdds] = []

        for sport in sports:
            try:
                events = self._fetch_sport(sport)
                all_events.extend(events)
            except Exception as e:
                logger.warning(f"Failed to fetch {sport}, using stub data: {e}")
                all_events.extend(self._get_stub_data([sport]))

        return all_events

    def _fetch_sport(self, sport: str) -> List[EventOdds]:
        """Fetch odds for a single sport from the API."""
        params = {
            "apiKey": self.api_key,
            "regions": ",".join(self.regions),
            "markets": ",".join(self.markets),
            "oddsFormat": "american",
            "bookmakers": ",".join(self.books),
        }

        url = f"{self.base_url}/{sport}/odds"
        logger.info(f"Fetching odds from {url}")

        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        # Track API usage from response headers
        requests_used = response.headers.get("x-requests-used")
        requests_remaining = response.headers.get("x-requests-remaining")
        if requests_used:
            self.api_requests_used = int(requests_used)
        if requests_remaining:
            self.api_requests_remaining = int(requests_remaining)
            logger.info(f"API quota: {requests_remaining} requests remaining")

        # Save raw response for debugging
        if self.raw_directory:
            self._save_raw(sport, data)

        return self._parse_response(data, sport)

    def _save_raw(self, sport: str, data: Any) -> None:
        """Save raw API response to file."""
        self.raw_directory.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = self.raw_directory / f"{sport}_{timestamp}.json"
        with open(filename, "w") as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved raw response to {filename}")

    def _parse_response(self, data: List[dict], sport: str) -> List[EventOdds]:
        """Parse API response into EventOdds objects."""
        events: List[EventOdds] = []

        for event_data in data:
            event_id = event_data.get("id", "")
            home_team = event_data.get("home_team", "")
            away_team = event_data.get("away_team", "")
            commence_time = event_data.get("commence_time")

            start_time = None
            if commence_time:
                try:
                    start_time = datetime.fromisoformat(commence_time.replace("Z", "+00:00"))
                except ValueError:
                    pass

            # Parse bookmakers
            markets: List[MarketOdds] = []
            for bookmaker in event_data.get("bookmakers", []):
                book_key = bookmaker.get("key", "")
                if book_key not in self.books:
                    continue

                for market_data in bookmaker.get("markets", []):
                    market = self._parse_market(market_data, home_team, away_team, book_key)
                    if market:
                        markets.append(market)

            if markets:
                events.append(
                    EventOdds(
                        event_id=event_id,
                        sport=self._normalize_sport(sport),
                        home_team=home_team,
                        away_team=away_team,
                        start_time=start_time,
                        markets=markets,
                    )
                )

        return events

    def _parse_market(
        self, market_data: dict, home_team: str, away_team: str, book: str
    ) -> Optional[MarketOdds]:
        """Parse a single market from API response."""
        market_key = market_data.get("key", "")
        outcomes_data = market_data.get("outcomes", [])

        if market_key == "h2h":
            # Moneyline (including draw for soccer)
            outcomes = []
            for o in outcomes_data:
                name = o.get("name", "")
                price = o.get("price", 0)
                if name == home_team:
                    outcomes.append(OutcomeOdds(outcome="home", price=price))
                elif name == away_team:
                    outcomes.append(OutcomeOdds(outcome="away", price=price))
                elif name.lower() == "draw":
                    outcomes.append(OutcomeOdds(outcome="draw", price=price))
            if outcomes:
                return MarketOdds(market_type="moneyline", book=book, outcomes=outcomes)

        elif market_key == "spreads":
            # Spread
            outcomes = []
            for o in outcomes_data:
                name = o.get("name", "")
                price = o.get("price", 0)
                point = o.get("point", 0.0)
                if name == home_team:
                    outcomes.append(OutcomeOdds(outcome="home", price=price, line=point))
                elif name == away_team:
                    outcomes.append(OutcomeOdds(outcome="away", price=price, line=point))
            if outcomes:
                return MarketOdds(market_type="spread", book=book, outcomes=outcomes)

        elif market_key == "totals":
            # Total (over/under)
            outcomes = []
            for o in outcomes_data:
                name = o.get("name", "").lower()
                price = o.get("price", 0)
                point = o.get("point", 0.0)
                if name == "over":
                    outcomes.append(OutcomeOdds(outcome="over", price=price, line=point))
                elif name == "under":
                    outcomes.append(OutcomeOdds(outcome="under", price=price, line=point))
            if outcomes:
                return MarketOdds(market_type="total", book=book, outcomes=outcomes)

        return None

    def fetch_player_props(self, sport: str, event_id: str) -> List[PlayerPropOdds]:
        """Fetch player props for a specific event."""
        if not self.player_prop_markets or self.api_key == "STUB":
            return []

        try:
            params = {
                "apiKey": self.api_key,
                "regions": ",".join(self.regions),
                "markets": ",".join(self.player_prop_markets),
                "oddsFormat": "american",
                "bookmakers": ",".join(self.books),
            }

            url = f"{self.base_url}/{sport}/events/{event_id}/odds"
            logger.info(f"Fetching player props from {url}")

            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            return self._parse_player_props(data)
        except Exception as e:
            logger.warning(f"Failed to fetch player props for {event_id}: {e}")
            return []

    def _parse_player_props(self, data: dict) -> List[PlayerPropOdds]:
        """Parse player props from API response."""
        props: List[PlayerPropOdds] = []

        for bookmaker in data.get("bookmakers", []):
            book_key = bookmaker.get("key", "")
            if book_key not in self.books:
                continue

            for market_data in bookmaker.get("markets", []):
                market_key = market_data.get("key", "")
                if not market_key.startswith("player_"):
                    continue

                for outcome in market_data.get("outcomes", []):
                    # Player props have 'description' for player name
                    player_name = outcome.get("description", "")
                    outcome_name = outcome.get("name", "").lower()
                    price = outcome.get("price", 0)
                    line = outcome.get("point", 0.0)

                    if player_name and outcome_name in ("over", "under"):
                        props.append(
                            PlayerPropOdds(
                                player_name=player_name,
                                prop_type=market_key,
                                outcome=outcome_name,
                                line=line,
                                price=price,
                                book=book_key,
                            )
                        )

        return props

    def _normalize_sport(self, sport: str) -> str:
        """Normalize sport identifier to readable format."""
        mapping = {
            "americanfootball_nfl": "NFL",
            "basketball_nba": "NBA",
            "baseball_mlb": "MLB",
            "icehockey_nhl": "NHL",
            "americanfootball_ncaaf": "NCAAF",
            "basketball_ncaab": "NCAAB",
            "mma_mixed_martial_arts": "MMA",
            "soccer_epl": "Soccer",
            "soccer_spain_la_liga": "Soccer",
            "soccer_uefa_champs_league": "Soccer",
            "soccer_germany_bundesliga": "Soccer",
            "soccer_italy_serie_a": "Soccer",
            "soccer_france_ligue_one": "Soccer",
        }
        return mapping.get(sport, sport.upper())

    def _get_stub_data(self, sports: List[str]) -> List[EventOdds]:
        """Return stub data for testing without an API."""
        events: List[EventOdds] = []
        now = datetime.now(timezone.utc)

        for sport in sports:
            normalized = self._normalize_sport(sport)

            if "nfl" in sport.lower():
                events.extend(self._create_nfl_stub_events(now))
            elif "nba" in sport.lower():
                events.extend(self._create_nba_stub_events(now))
            elif "mlb" in sport.lower():
                events.extend(self._create_mlb_stub_events(now))
            elif "nhl" in sport.lower():
                events.extend(self._create_nhl_stub_events(now))
            elif "mma" in sport.lower():
                events.extend(self._create_mma_stub_events(now))
            elif "soccer" in sport.lower():
                events.extend(self._create_soccer_stub_events(now, sport))

        return events

    def _create_nfl_stub_events(self, now: datetime) -> List[EventOdds]:
        """Create stub NFL events."""
        return [
            EventOdds(
                event_id="nfl_stub_001",
                sport="NFL",
                home_team="Kansas City Chiefs",
                away_team="Buffalo Bills",
                start_time=now + timedelta(days=2),
                markets=[
                    MarketOdds(
                        market_type="moneyline",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-150),
                            OutcomeOdds(outcome="away", price=130),
                        ],
                    ),
                    MarketOdds(
                        market_type="spread",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-110, line=-3.0),
                            OutcomeOdds(outcome="away", price=-110, line=3.0),
                        ],
                    ),
                    MarketOdds(
                        market_type="total",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="over", price=-110, line=47.5),
                            OutcomeOdds(outcome="under", price=-110, line=47.5),
                        ],
                    ),
                ],
            ),
            EventOdds(
                event_id="nfl_stub_002",
                sport="NFL",
                home_team="San Francisco 49ers",
                away_team="Dallas Cowboys",
                start_time=now + timedelta(days=3),
                markets=[
                    MarketOdds(
                        market_type="moneyline",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-180),
                            OutcomeOdds(outcome="away", price=155),
                        ],
                    ),
                    MarketOdds(
                        market_type="spread",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-105, line=-4.0),
                            OutcomeOdds(outcome="away", price=-115, line=4.0),
                        ],
                    ),
                    MarketOdds(
                        market_type="total",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="over", price=-108, line=49.0),
                            OutcomeOdds(outcome="under", price=-112, line=49.0),
                        ],
                    ),
                ],
            ),
        ]

    def _create_nba_stub_events(self, now: datetime) -> List[EventOdds]:
        """Create stub NBA events."""
        return [
            EventOdds(
                event_id="nba_stub_001",
                sport="NBA",
                home_team="Los Angeles Lakers",
                away_team="Boston Celtics",
                start_time=now + timedelta(days=1),
                markets=[
                    MarketOdds(
                        market_type="moneyline",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=120),
                            OutcomeOdds(outcome="away", price=-140),
                        ],
                    ),
                    MarketOdds(
                        market_type="spread",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-110, line=2.5),
                            OutcomeOdds(outcome="away", price=-110, line=-2.5),
                        ],
                    ),
                    MarketOdds(
                        market_type="total",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="over", price=-110, line=225.5),
                            OutcomeOdds(outcome="under", price=-110, line=225.5),
                        ],
                    ),
                ],
            ),
            EventOdds(
                event_id="nba_stub_002",
                sport="NBA",
                home_team="Golden State Warriors",
                away_team="Phoenix Suns",
                start_time=now + timedelta(days=1, hours=3),
                markets=[
                    MarketOdds(
                        market_type="moneyline",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-165),
                            OutcomeOdds(outcome="away", price=145),
                        ],
                    ),
                    MarketOdds(
                        market_type="spread",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-108, line=-4.0),
                            OutcomeOdds(outcome="away", price=-112, line=4.0),
                        ],
                    ),
                    MarketOdds(
                        market_type="total",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="over", price=-105, line=232.0),
                            OutcomeOdds(outcome="under", price=-115, line=232.0),
                        ],
                    ),
                ],
            ),
        ]

    def _create_mlb_stub_events(self, now: datetime) -> List[EventOdds]:
        """Create stub MLB events."""
        return [
            EventOdds(
                event_id="mlb_stub_001",
                sport="MLB",
                home_team="New York Yankees",
                away_team="Boston Red Sox",
                start_time=now + timedelta(days=1),
                markets=[
                    MarketOdds(
                        market_type="moneyline",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-145),
                            OutcomeOdds(outcome="away", price=125),
                        ],
                    ),
                    MarketOdds(
                        market_type="spread",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-115, line=-1.5),
                            OutcomeOdds(outcome="away", price=-105, line=1.5),
                        ],
                    ),
                    MarketOdds(
                        market_type="total",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="over", price=-110, line=8.5),
                            OutcomeOdds(outcome="under", price=-110, line=8.5),
                        ],
                    ),
                ],
            ),
            EventOdds(
                event_id="mlb_stub_002",
                sport="MLB",
                home_team="Los Angeles Dodgers",
                away_team="San Francisco Giants",
                start_time=now + timedelta(days=1, hours=3),
                markets=[
                    MarketOdds(
                        market_type="moneyline",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-180),
                            OutcomeOdds(outcome="away", price=155),
                        ],
                    ),
                    MarketOdds(
                        market_type="spread",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=105, line=-1.5),
                            OutcomeOdds(outcome="away", price=-125, line=1.5),
                        ],
                    ),
                    MarketOdds(
                        market_type="total",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="over", price=-108, line=7.5),
                            OutcomeOdds(outcome="under", price=-112, line=7.5),
                        ],
                    ),
                ],
            ),
        ]

    def _create_nhl_stub_events(self, now: datetime) -> List[EventOdds]:
        """Create stub NHL events."""
        return [
            EventOdds(
                event_id="nhl_stub_001",
                sport="NHL",
                home_team="Toronto Maple Leafs",
                away_team="Montreal Canadiens",
                start_time=now + timedelta(days=1),
                markets=[
                    MarketOdds(
                        market_type="moneyline",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-155),
                            OutcomeOdds(outcome="away", price=135),
                        ],
                    ),
                    MarketOdds(
                        market_type="spread",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-115, line=-1.5),
                            OutcomeOdds(outcome="away", price=-105, line=1.5),
                        ],
                    ),
                    MarketOdds(
                        market_type="total",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="over", price=-110, line=6.5),
                            OutcomeOdds(outcome="under", price=-110, line=6.5),
                        ],
                    ),
                ],
            ),
            EventOdds(
                event_id="nhl_stub_002",
                sport="NHL",
                home_team="Vegas Golden Knights",
                away_team="Colorado Avalanche",
                start_time=now + timedelta(days=1, hours=3),
                markets=[
                    MarketOdds(
                        market_type="moneyline",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-130),
                            OutcomeOdds(outcome="away", price=110),
                        ],
                    ),
                    MarketOdds(
                        market_type="spread",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=105, line=-1.5),
                            OutcomeOdds(outcome="away", price=-125, line=1.5),
                        ],
                    ),
                    MarketOdds(
                        market_type="total",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="over", price=-105, line=5.5),
                            OutcomeOdds(outcome="under", price=-115, line=5.5),
                        ],
                    ),
                ],
            ),
        ]

    def _create_mma_stub_events(self, now: datetime) -> List[EventOdds]:
        """Create stub MMA/UFC events."""
        return [
            EventOdds(
                event_id="mma_stub_001",
                sport="MMA",
                home_team="Jon Jones",
                away_team="Stipe Miocic",
                start_time=now + timedelta(days=7),
                markets=[
                    MarketOdds(
                        market_type="moneyline",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-250),
                            OutcomeOdds(outcome="away", price=210),
                        ],
                    ),
                ],
            ),
            EventOdds(
                event_id="mma_stub_002",
                sport="MMA",
                home_team="Islam Makhachev",
                away_team="Charles Oliveira",
                start_time=now + timedelta(days=7, hours=2),
                markets=[
                    MarketOdds(
                        market_type="moneyline",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-180),
                            OutcomeOdds(outcome="away", price=155),
                        ],
                    ),
                ],
            ),
        ]

    def _create_soccer_stub_events(self, now: datetime, sport: str) -> List[EventOdds]:
        """Create stub soccer events."""
        # Determine league name from sport key
        league_names = {
            "soccer_epl": "EPL",
            "soccer_spain_la_liga": "La Liga",
            "soccer_uefa_champs_league": "UCL",
        }
        # All normalize to "Soccer" for display

        return [
            EventOdds(
                event_id="soccer_stub_001",
                sport="Soccer",
                home_team="Manchester City",
                away_team="Liverpool",
                start_time=now + timedelta(days=3),
                markets=[
                    MarketOdds(
                        market_type="moneyline",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=120),
                            OutcomeOdds(outcome="draw", price=250),
                            OutcomeOdds(outcome="away", price=180),
                        ],
                    ),
                    MarketOdds(
                        market_type="spread",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-110, line=-0.5),
                            OutcomeOdds(outcome="away", price=-110, line=0.5),
                        ],
                    ),
                    MarketOdds(
                        market_type="total",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="over", price=-105, line=2.5),
                            OutcomeOdds(outcome="under", price=-115, line=2.5),
                        ],
                    ),
                ],
            ),
            EventOdds(
                event_id="soccer_stub_002",
                sport="Soccer",
                home_team="Real Madrid",
                away_team="Barcelona",
                start_time=now + timedelta(days=5),
                markets=[
                    MarketOdds(
                        market_type="moneyline",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=110),
                            OutcomeOdds(outcome="draw", price=240),
                            OutcomeOdds(outcome="away", price=165),
                        ],
                    ),
                    MarketOdds(
                        market_type="spread",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="home", price=-108, line=-0.5),
                            OutcomeOdds(outcome="away", price=-112, line=0.5),
                        ],
                    ),
                    MarketOdds(
                        market_type="total",
                        book="fanduel",
                        outcomes=[
                            OutcomeOdds(outcome="over", price=-110, line=3.0),
                            OutcomeOdds(outcome="under", price=-110, line=3.0),
                        ],
                    ),
                ],
            ),
        ]
