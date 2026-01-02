"""Storage logic for odds history and latest snapshot."""

from __future__ import annotations

import csv
import logging
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from ante_ai.models import EventOdds, LatestOddsRow, OddsRow

logger = logging.getLogger(__name__)


class OddsStorage:
    """Manages storage of odds history and latest snapshots."""

    def __init__(self, history_path: str, latest_path: str):
        self.history_path = Path(history_path)
        self.latest_path = Path(latest_path)

        # Ensure directories exist
        self.history_path.parent.mkdir(parents=True, exist_ok=True)
        self.latest_path.parent.mkdir(parents=True, exist_ok=True)

    def flatten_events(
        self, events: List[EventOdds], timestamp: Optional[datetime] = None
    ) -> List[OddsRow]:
        """Flatten EventOdds objects into OddsRow records."""
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        timestamp_str = timestamp.isoformat()
        rows: List[OddsRow] = []

        for event in events:
            start_time_str = event.start_time.isoformat() if event.start_time else None

            for market in event.markets:
                for outcome in market.outcomes:
                    row = OddsRow(
                        timestamp_utc=timestamp_str,
                        book=market.book,
                        sport=event.sport,
                        event_id=event.event_id,
                        event_start_time=start_time_str,
                        home_team=event.home_team,
                        away_team=event.away_team,
                        market_type=market.market_type,
                        outcome=outcome.outcome,
                        price=outcome.price,
                        line=outcome.line,
                    )
                    rows.append(row)

        return rows

    def append_to_history(self, rows: List[OddsRow]) -> int:
        """Append rows to the history CSV file.

        Returns the number of rows appended.
        """
        if not rows:
            logger.info("No rows to append to history")
            return 0

        file_exists = self.history_path.exists()

        with open(self.history_path, "a", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=OddsRow.fieldnames())
            if not file_exists:
                writer.writeheader()
            for row in rows:
                writer.writerow(row.to_dict())

        logger.info(f"Appended {len(rows)} rows to {self.history_path}")
        return len(rows)

    def load_history(self) -> List[dict]:
        """Load all history records from CSV."""
        if not self.history_path.exists():
            return []

        with open(self.history_path, "r", newline="") as f:
            reader = csv.DictReader(f)
            return list(reader)

    def generate_latest(self) -> int:
        """Generate the latest.csv snapshot with computed movement fields.

        Returns the number of rows written to latest.csv.
        """
        history = self.load_history()
        if not history:
            logger.info("No history data available for latest snapshot")
            return 0

        # Group by unique key: (book, sport, event_id, market_type, outcome)
        grouped: Dict[Tuple, List[dict]] = defaultdict(list)
        for record in history:
            key = (
                record["book"],
                record["sport"],
                record["event_id"],
                record["market_type"],
                record["outcome"],
            )
            grouped[key].append(record)

        # Compute latest snapshot for each unique key
        latest_rows: List[LatestOddsRow] = []

        for key, records in grouped.items():
            # Sort by timestamp to find opening and current
            sorted_records = sorted(records, key=lambda r: r["timestamp_utc"])
            first = sorted_records[0]
            last = sorted_records[-1]

            # Parse prices
            opening_price = int(first["price"])
            current_price = int(last["price"])
            price_movement = current_price - opening_price

            # Parse lines (may be empty for moneyline)
            opening_line = self._parse_line(first.get("line"))
            current_line = self._parse_line(last.get("line"))

            line_movement = None
            if opening_line is not None and current_line is not None:
                line_movement = current_line - opening_line

            latest_row = LatestOddsRow(
                book=last["book"],
                sport=last["sport"],
                event_id=last["event_id"],
                event_start_time=last.get("event_start_time") or None,
                home_team=last["home_team"],
                away_team=last["away_team"],
                market_type=last["market_type"],
                outcome=last["outcome"],
                opening_price=opening_price,
                current_price=current_price,
                price_movement=price_movement,
                opening_line=opening_line,
                current_line=current_line,
                line_movement=line_movement,
                last_updated=last["timestamp_utc"],
            )
            latest_rows.append(latest_row)

        # Sort by sport, event_id, market_type, outcome for consistent output
        latest_rows.sort(
            key=lambda r: (r.sport, r.event_id, r.market_type, r.outcome)
        )

        # Write latest.csv (overwrite)
        with open(self.latest_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=LatestOddsRow.fieldnames())
            writer.writeheader()
            for row in latest_rows:
                writer.writerow(row.to_dict())

        logger.info(f"Generated {len(latest_rows)} rows in {self.latest_path}")
        return len(latest_rows)

    def _parse_line(self, value: Optional[str]) -> Optional[float]:
        """Parse a line value from CSV (may be empty string)."""
        if value is None or value == "":
            return None
        try:
            return float(value)
        except ValueError:
            return None
