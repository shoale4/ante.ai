"""
Twitter bot for posting line movement alerts.
"""
from __future__ import annotations

import os
import csv
from datetime import datetime
from typing import Optional
import tweepy


def get_twitter_client() -> tweepy.Client:
    """Create authenticated Twitter API v2 client."""
    return tweepy.Client(
        consumer_key=os.environ["TWITTER_API_KEY"],
        consumer_secret=os.environ["TWITTER_API_SECRET"],
        access_token=os.environ["TWITTER_ACCESS_TOKEN"],
        access_token_secret=os.environ["TWITTER_ACCESS_SECRET"],
    )


def load_latest_odds(filepath: str = "data/latest/latest.csv") -> list[dict]:
    """Load the latest odds data from CSV."""
    if not os.path.exists(filepath):
        return []

    with open(filepath, "r") as f:
        reader = csv.DictReader(f)
        return list(reader)


def find_significant_movements(
    odds_data: list[dict],
    spread_threshold: float = 2.5,
    total_threshold: float = 3.0,
    moneyline_threshold: int = 30,
) -> list[dict]:
    """
    Find significant line movements that warrant a tweet.

    Args:
        odds_data: List of odds records from latest.csv
        spread_threshold: Minimum spread movement (points)
        total_threshold: Minimum total movement (points)
        moneyline_threshold: Minimum moneyline movement

    Returns:
        List of significant movements with tweet-worthy info
    """
    significant = []

    for row in odds_data:
        try:
            movement = float(row.get("price_movement", 0) or 0)
            line_movement = float(row.get("line_movement", 0) or 0)
            market = row.get("market", "")
            sport = row.get("sport", "")

            # Skip if no movement data
            if movement == 0 and line_movement == 0:
                continue

            is_significant = False
            movement_desc = ""

            if market == "spread" and abs(line_movement) >= spread_threshold:
                is_significant = True
                direction = "moved to" if line_movement > 0 else "moved to"
                movement_desc = f"spread {direction} {row.get('current_line', 'N/A')}"

            elif market == "total" and abs(line_movement) >= total_threshold:
                is_significant = True
                direction = "up" if line_movement > 0 else "down"
                movement_desc = f"total {direction} to {row.get('current_line', 'N/A')}"

            elif market == "moneyline" and abs(movement) >= moneyline_threshold:
                is_significant = True
                direction = "shortened" if movement > 0 else "lengthened"
                movement_desc = f"moneyline {direction} to {row.get('current_price', 'N/A')}"

            if is_significant:
                significant.append({
                    "sport": sport,
                    "event": f"{row.get('away_team', '')} @ {row.get('home_team', '')}",
                    "market": market,
                    "outcome": row.get("outcome", ""),
                    "book": row.get("book", ""),
                    "movement_desc": movement_desc,
                    "line_movement": line_movement,
                    "price_movement": movement,
                    "current_price": row.get("current_price", ""),
                    "current_line": row.get("current_line", ""),
                    "opening_price": row.get("opening_price", ""),
                    "opening_line": row.get("opening_line", ""),
                })

        except (ValueError, TypeError):
            continue

    return significant


def format_movement_tweet(movement: dict) -> str:
    """Format a movement into a tweet."""
    sport_emoji = "🏀" if movement["sport"] == "NBA" else "🏈"

    # Build the tweet
    lines = [
        f"{sport_emoji} LINE MOVE ALERT",
        f"",
        f"{movement['event']}",
        f"",
        f"📊 {movement['movement_desc'].title()}",
    ]

    # Add context about the movement
    if movement["market"] == "spread":
        opening = movement.get("opening_line", "")
        if opening:
            lines.append(f"(opened at {opening})")
    elif movement["market"] == "total":
        opening = movement.get("opening_line", "")
        if opening:
            lines.append(f"(opened at {opening})")

    lines.extend([
        f"",
        f"🔗 ante-ai.vercel.app",
    ])

    return "\n".join(lines)


def format_daily_recap(movements: list[dict]) -> Optional[str]:
    """Format a daily recap tweet of all significant movements."""
    if not movements:
        return None

    # Group by sport
    nfl_moves = [m for m in movements if m["sport"] == "NFL"]
    nba_moves = [m for m in movements if m["sport"] == "NBA"]

    lines = [
        "📈 DAILY LINE MOVEMENT RECAP",
        "",
    ]

    if nba_moves:
        lines.append(f"🏀 NBA: {len(nba_moves)} significant moves")
    if nfl_moves:
        lines.append(f"🏈 NFL: {len(nfl_moves)} significant moves")

    # Highlight biggest move
    biggest = max(movements, key=lambda m: abs(m.get("line_movement", 0) or m.get("price_movement", 0)))
    lines.extend([
        "",
        f"🔥 Biggest: {biggest['event']}",
        f"   {biggest['movement_desc']}",
        "",
        "🔗 Full details: ante-ai.vercel.app",
    ])

    return "\n".join(lines)


def post_tweet(client: tweepy.Client, text: str) -> bool:
    """Post a tweet and return success status."""
    try:
        response = client.create_tweet(text=text)
        print(f"Tweet posted: {response.data['id']}")
        return True
    except tweepy.TweepyException as e:
        print(f"Failed to post tweet: {e}")
        return False


def run_alerts(
    dry_run: bool = False,
    recap_only: bool = False,
) -> None:
    """
    Main function to check for movements and post tweets.

    Args:
        dry_run: If True, print tweets but don't post
        recap_only: If True, only post daily recap
    """
    # Load latest odds
    odds_data = load_latest_odds()
    if not odds_data:
        print("No odds data found")
        return

    # Find significant movements
    movements = find_significant_movements(odds_data)
    print(f"Found {len(movements)} significant movements")

    if not movements:
        print("No significant movements to tweet about")
        return

    # Initialize Twitter client (unless dry run)
    client = None if dry_run else get_twitter_client()

    if recap_only:
        # Post daily recap only
        recap = format_daily_recap(movements)
        if recap:
            print(f"\n--- RECAP TWEET ---\n{recap}\n-------------------")
            if not dry_run:
                post_tweet(client, recap)
    else:
        # Post individual alerts for each significant movement
        # Limit to top 3 to avoid spam
        top_movements = sorted(
            movements,
            key=lambda m: abs(m.get("line_movement", 0) or m.get("price_movement", 0)),
            reverse=True
        )[:3]

        for movement in top_movements:
            tweet = format_movement_tweet(movement)
            print(f"\n--- TWEET ---\n{tweet}\n-------------")
            if not dry_run:
                post_tweet(client, tweet)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Ante AI Twitter Bot")
    parser.add_argument("--dry-run", action="store_true", help="Print tweets without posting")
    parser.add_argument("--recap", action="store_true", help="Post daily recap only")

    args = parser.parse_args()
    run_alerts(dry_run=args.dry_run, recap_only=args.recap)
