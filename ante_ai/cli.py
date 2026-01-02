"""Command-line interface for the Ante AI odds feed."""

from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from ante_ai.models import EventOdds
from ante_ai.providers.base import OddsProvider
from ante_ai.providers.example_provider import ExampleProvider
from ante_ai.storage import OddsStorage

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


def create_provider(config: dict) -> OddsProvider:
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
        )
    else:
        raise ValueError(f"Unknown provider type: {provider_type}")


def run_update(config: dict) -> None:
    """Run a single update cycle: fetch, store, generate latest."""
    # Create provider
    provider = create_provider(config)
    logger.info(f"Using provider: {provider.__class__.__name__} ({provider.book_name})")

    # Get sports to fetch
    sports = config.get("provider", {}).get("sports", [])
    if not sports:
        logger.warning("No sports configured, nothing to fetch")
        return

    logger.info(f"Fetching odds for: {', '.join(sports)}")

    # Fetch odds
    events: List[EventOdds] = provider.fetch_odds(sports)
    logger.info(f"Fetched {len(events)} events")

    if not events:
        logger.info("No events returned, skipping storage update")
        return

    # Create storage
    storage_config = config.get("storage", {})
    storage = OddsStorage(
        history_path=storage_config.get("history_path", "data/history/odds_history.csv"),
        latest_path=storage_config.get("latest_path", "data/latest/latest.csv"),
    )

    # Flatten events into rows
    timestamp = datetime.now(timezone.utc)
    rows = storage.flatten_events(events, book=provider.book_name, timestamp=timestamp)
    logger.info(f"Flattened into {len(rows)} odds rows")

    # Append to history
    storage.append_to_history(rows)

    # Generate latest snapshot
    storage.generate_latest()

    logger.info("Update complete!")


def main() -> int:
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(
        description="Ante AI - Sports Betting Odds Movement Feed",
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

    args = parser.parse_args()

    setup_logging(verbose=args.verbose)

    try:
        logger.info(f"Loading config from {args.config}")
        config = load_config(args.config)

        run_update(config)
        return 0

    except FileNotFoundError as e:
        logger.error(str(e))
        return 1
    except Exception as e:
        logger.exception(f"Error during update: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
