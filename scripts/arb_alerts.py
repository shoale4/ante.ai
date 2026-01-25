#!/usr/bin/env python3
"""
Arbitrage Alert System

Checks for arbitrage opportunities in a specific state and sends Discord alerts.
"""

import csv
import json
import os
import sys
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from urllib.request import Request, urlopen
from urllib.error import URLError

# Illinois-legal books (update as needed)
ILLINOIS_BOOKS = {
    "fanduel", "draftkings", "betmgm", "caesars",
    "pointsbetus", "betrivers", "espnbet"
}

# Minimum ROI to alert on (percentage)
MIN_ROI_PERCENT = 0.5

# Maximum ROI (above this is likely bad data)
MAX_ROI_PERCENT = 15.0

# Discord webhook URL from environment
DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL", "")


def load_latest_odds(csv_path: str) -> List[Dict[str, Any]]:
    """Load the latest odds from CSV."""
    odds = []
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            odds.append(row)
    return odds


def american_to_decimal(american: int) -> float:
    """Convert American odds to decimal odds."""
    if american >= 100:
        return 1 + american / 100
    elif american <= -100:
        return 1 + 100 / abs(american)
    else:
        raise ValueError(f"Invalid American odds: {american}")


def is_valid_american_odds(odds: int) -> bool:
    """Check if American odds are valid."""
    return odds >= 100 or odds <= -100


def find_arbitrage_opportunities(odds: List[Dict[str, Any]], allowed_books: set) -> List[Dict[str, Any]]:
    """Find arbitrage opportunities filtered by allowed books."""
    # Group odds by event and market
    events: Dict[str, Dict[str, Dict[str, List[Dict]]]] = {}

    now = datetime.now(timezone.utc)

    for row in odds:
        book = row['book'].lower()
        if book not in allowed_books:
            continue

        event_id = row['event_id']
        market = row['market_type']
        outcome = row['outcome']

        # Skip past events
        try:
            event_time = datetime.fromisoformat(row['event_start_time'].replace('+00:00', '+00:00'))
            if event_time < now:
                continue
        except:
            continue

        try:
            price = int(row['current_price'])
            if not is_valid_american_odds(price):
                continue
        except:
            continue

        if event_id not in events:
            events[event_id] = {
                'sport': row['sport'],
                'home_team': row['home_team'],
                'away_team': row['away_team'],
                'event_start_time': row['event_start_time'],
                'markets': {}
            }

        if market not in events[event_id]['markets']:
            events[event_id]['markets'][market] = {}

        if outcome not in events[event_id]['markets'][market]:
            events[event_id]['markets'][market][outcome] = []

        events[event_id]['markets'][market][outcome].append({
            'book': book,
            'price': price,
            'line': row.get('current_line'),
            'last_updated': row.get('last_updated', '')
        })

    # Find arbs
    opportunities = []

    for event_id, event in events.items():
        for market, outcomes in event['markets'].items():
            # Two-way markets (moneyline home/away, totals over/under)
            if market == 'moneyline':
                arb = check_two_way_arb(
                    outcomes.get('home', []),
                    outcomes.get('away', []),
                    event,
                    market,
                    event_id
                )
                if arb:
                    opportunities.append(arb)

            elif market == 'total':
                # Group by line value
                over_by_line: Dict[str, List] = {}
                under_by_line: Dict[str, List] = {}

                for o in outcomes.get('over', []):
                    line = o.get('line') or '0'
                    if line not in over_by_line:
                        over_by_line[line] = []
                    over_by_line[line].append(o)

                for o in outcomes.get('under', []):
                    line = o.get('line') or '0'
                    if line not in under_by_line:
                        under_by_line[line] = []
                    under_by_line[line].append(o)

                # Check each line
                for line, overs in over_by_line.items():
                    unders = under_by_line.get(line, [])
                    if unders:
                        arb = check_two_way_arb(
                            overs, unders, event, market, event_id,
                            side1_label=f"Over {line}", side2_label=f"Under {line}"
                        )
                        if arb:
                            opportunities.append(arb)

    return sorted(opportunities, key=lambda x: x['roi_percent'], reverse=True)


def check_two_way_arb(
    side1_odds: List[Dict],
    side2_odds: List[Dict],
    event: Dict,
    market: str,
    event_id: str,
    side1_label: Optional[str] = None,
    side2_label: Optional[str] = None
) -> Optional[Dict]:
    """Check for two-way arbitrage opportunity."""
    if not side1_odds or not side2_odds:
        return None

    # Find best odds for each side
    best1 = max(side1_odds, key=lambda x: x['price'])
    best2 = max(side2_odds, key=lambda x: x['price'])

    try:
        dec1 = american_to_decimal(best1['price'])
        dec2 = american_to_decimal(best2['price'])
    except:
        return None

    implied_sum = (1/dec1) + (1/dec2)

    if implied_sum >= 1:
        return None  # No arb

    roi_percent = ((1 / implied_sum) - 1) * 100

    if roi_percent < MIN_ROI_PERCENT or roi_percent > MAX_ROI_PERCENT:
        return None

    # Calculate stakes for $100 total
    total_stake = 100
    stake1 = ((1/dec1) / implied_sum) * total_stake
    stake2 = ((1/dec2) / implied_sum) * total_stake
    profit = (stake1 * dec1) - total_stake

    return {
        'event_id': event_id,
        'sport': event['sport'],
        'home_team': event['home_team'],
        'away_team': event['away_team'],
        'event_start_time': event['event_start_time'],
        'market': market,
        'roi_percent': round(roi_percent, 2),
        'profit': round(profit, 2),
        'legs': [
            {
                'side': side1_label or event['home_team'],
                'book': best1['book'],
                'odds': best1['price'],
                'stake': round(stake1, 2)
            },
            {
                'side': side2_label or event['away_team'],
                'book': best2['book'],
                'odds': best2['price'],
                'stake': round(stake2, 2)
            }
        ]
    }


def format_discord_message(opportunities: List[Dict]) -> Dict:
    """Format opportunities as a Discord webhook message."""
    if not opportunities:
        return None

    embeds = []

    for opp in opportunities[:5]:  # Limit to 5 per message
        # Format game time
        try:
            game_time = datetime.fromisoformat(opp['event_start_time'].replace('+00:00', '+00:00'))
            time_str = game_time.strftime("%a %I:%M %p ET")
        except:
            time_str = "TBD"

        # Format odds with + sign for positive
        def fmt_odds(odds):
            return f"+{odds}" if odds > 0 else str(odds)

        leg1 = opp['legs'][0]
        leg2 = opp['legs'][1]

        embed = {
            "title": f"🚨 {opp['roi_percent']}% ARB: {opp['away_team']} @ {opp['home_team']}",
            "color": 0x00FF00,  # Green
            "fields": [
                {
                    "name": f"📍 {leg1['side']}",
                    "value": f"**{leg1['book'].upper()}** @ {fmt_odds(leg1['odds'])}\nStake: ${leg1['stake']:.2f}",
                    "inline": True
                },
                {
                    "name": f"📍 {leg2['side']}",
                    "value": f"**{leg2['book'].upper()}** @ {fmt_odds(leg2['odds'])}\nStake: ${leg2['stake']:.2f}",
                    "inline": True
                },
                {
                    "name": "💰 Guaranteed Profit",
                    "value": f"**${opp['profit']:.2f}** on $100",
                    "inline": False
                }
            ],
            "footer": {
                "text": f"{opp['sport']} • {opp['market'].title()} • {time_str}"
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        embeds.append(embed)

    return {
        "content": f"**{len(opportunities)} Arbitrage Opportunity{'s' if len(opportunities) != 1 else ''} Found in Illinois!**",
        "embeds": embeds
    }


def send_discord_alert(message: Dict) -> bool:
    """Send alert to Discord webhook."""
    if not DISCORD_WEBHOOK_URL:
        print("No Discord webhook URL configured")
        return False

    try:
        data = json.dumps(message).encode('utf-8')
        req = Request(
            DISCORD_WEBHOOK_URL,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with urlopen(req, timeout=10) as response:
            return response.status == 204
    except URLError as e:
        print(f"Failed to send Discord alert: {e}")
        return False


def main():
    # Find the data file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    csv_path = os.path.join(repo_root, "data", "latest", "latest.csv")

    if not os.path.exists(csv_path):
        print(f"Data file not found: {csv_path}")
        return 1

    print(f"Loading odds from {csv_path}")
    odds = load_latest_odds(csv_path)
    print(f"Loaded {len(odds)} odds records")

    print(f"Checking for arbs in Illinois-legal books: {', '.join(sorted(ILLINOIS_BOOKS))}")
    opportunities = find_arbitrage_opportunities(odds, ILLINOIS_BOOKS)

    print(f"Found {len(opportunities)} arbitrage opportunities")

    if opportunities:
        for opp in opportunities:
            print(f"  {opp['roi_percent']}% - {opp['away_team']} @ {opp['home_team']} ({opp['market']})")
            for leg in opp['legs']:
                print(f"    {leg['side']} @ {leg['book'].upper()}: {leg['odds']} (${leg['stake']})")

        message = format_discord_message(opportunities)
        if message and DISCORD_WEBHOOK_URL:
            print("Sending Discord alert...")
            if send_discord_alert(message):
                print("Alert sent successfully!")
            else:
                print("Failed to send alert")
    else:
        print("No arbitrage opportunities found")

    return 0


if __name__ == "__main__":
    sys.exit(main())
