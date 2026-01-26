"""Command-line interface for the Hedj odds feed."""

from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from hedj.models import EventOdds
from hedj.providers.base import OddsProvider
from hedj.providers.example_provider import ExampleProvider
from hedj.storage import OddsStorage

logger = logging.getLogger(__name__)


def setup_logging(verbose: bool = False) -> None:
    """Configure logging for the CLI."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def load_config(config_path: str) -> dict:
    """Load configuration from JSON file."""
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    with open(path, "r") as f:
        return json.load(f)


def create_provider(config: dict) -> ExampleProvider:
    """Create an odds provider based on config."""
    provider_config = config.get("provider", {})
    provider_type = provider_config.get("type", "example")

    if provider_type == "example":
        return ExampleProvider(
            base_url=provider_config.get("base_url", ""),
            api_key=provider_config.get("api_key", "STUB"),
            regions=provider_config.get("regions", ["us"]),
            books=provider_config.get("books", ["example_book"]),
            raw_directory=config.get("storage", {}).get("raw_directory"),
            player_prop_markets=provider_config.get("player_prop_markets", []),
            markets=provider_config.get("markets", ["h2h", "spreads", "totals"]),
        )
    else:
        raise ValueError(f"Unknown provider type: {provider_type}")


def run_update(config: dict, fetch_props: bool = False) -> None:
    """Run a single update cycle: fetch, store, generate latest."""
    # Create provider
    provider = create_provider(config)
    logger.info(f"Using provider: {provider.__class__.__name__} ({provider.book_name})")

    # Get sports and futures to fetch
    sports = config.get("provider", {}).get("sports", [])
    futures = config.get("provider", {}).get("futures", [])

    if not sports and not futures:
        logger.warning("No sports or futures configured, nothing to fetch")
        return

    if sports:
        logger.info(f"Fetching odds for: {', '.join(sports)}")
    if futures:
        logger.info(f"Fetching futures for: {', '.join(futures)}")

    # Fetch odds (including futures)
    events: List[EventOdds] = provider.fetch_odds(sports, futures=futures)
    logger.info(f"Fetched {len(events)} events")

    if not events:
        logger.info("No events returned, skipping storage update")
        return

    # Create storage
    storage_config = config.get("storage", {})
    storage = OddsStorage(
        history_path=storage_config.get("history_path", "data/history/odds_history.csv"),
        latest_path=storage_config.get("latest_path", "data/latest/latest.csv"),
        props_history_path=storage_config.get("props_history_path"),
        props_latest_path=storage_config.get("props_latest_path"),
    )

    # Flatten events into rows
    timestamp = datetime.now(timezone.utc)
    rows = storage.flatten_events(events, timestamp=timestamp)
    logger.info(f"Flattened into {len(rows)} odds rows")

    # Append to history
    storage.append_to_history(rows)

    # Generate latest snapshot
    storage.generate_latest()

    # Optionally fetch player props
    if fetch_props and provider.player_prop_markets:
        logger.info("Fetching player props...")
        all_prop_rows = []
        sport_mapping = {event.event_id: next(
            (s for s in sports if provider._normalize_sport(s) == event.sport),
            None
        ) for event in events}

        for event in events:
            original_sport = sport_mapping.get(event.event_id)
            if not original_sport:
                continue

            props = provider.fetch_player_props(original_sport, event.event_id)
            if props:
                prop_rows = storage.flatten_player_props(props, event, timestamp=timestamp)
                all_prop_rows.extend(prop_rows)
                logger.info(f"Fetched {len(props)} props for {event.home_team} vs {event.away_team}")

        if all_prop_rows:
            storage.append_props_to_history(all_prop_rows)
            storage.generate_props_latest()
            logger.info(f"Stored {len(all_prop_rows)} total prop rows")

    # Log API usage stats
    if provider.api_requests_remaining is not None:
        logger.info(f"API requests remaining this month: {provider.api_requests_remaining}")
        if provider.api_requests_remaining < 1000:
            logger.warning(f"LOW API QUOTA: Only {provider.api_requests_remaining} requests remaining!")

    logger.info("Update complete!")


def main() -> int:
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(
        description="Hedj - Sports Betting Odds Movement Feed",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--config",
        "-c",
        default="config.json",
        help="Path to configuration file (default: config.json)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose logging",
    )
    parser.add_argument(
        "--props",
        action="store_true",
        help="Also fetch player props (requires additional API calls)",
    )
    parser.add_argument(
        "--cleanup",
        action="store_true",
        help="Clean up old historical data (keeps last 7 days)",
    )
    parser.add_argument(
        "--cleanup-days",
        type=int,
        default=7,
        help="Number of days of history to keep when cleaning up (default: 7)",
    )

    args = parser.parse_args()

    setup_logging(verbose=args.verbose)

    try:
        logger.info(f"Loading config from {args.config}")
        config = load_config(args.config)

        # Handle cleanup if requested
        if args.cleanup:
            storage_config = config.get("storage", {})
            storage = OddsStorage(
                history_path=storage_config.get("history_path", "data/history/odds_history.csv"),
                latest_path=storage_config.get("latest_path", "data/latest/latest.csv"),
                props_history_path=storage_config.get("props_history_path"),
                props_latest_path=storage_config.get("props_latest_path"),
            )
            removed = storage.cleanup_old_history(days_to_keep=args.cleanup_days)
            logger.info(f"Cleanup complete: removed {removed} old records")

        run_update(config, fetch_props=args.props)
        return 0

    except FileNotFoundError as e:
        logger.error(str(e))
        return 1
    except Exception as e:
        logger.exception(f"Error during update: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
