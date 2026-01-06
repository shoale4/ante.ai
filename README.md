# Hedj

Sports betting odds movement tracking feed.

## Overview

Hedj automatically collects sports betting odds, tracks line and price movements over time, and generates machine-readable data feeds. This helps bettors and analysts identify sharp money, steam moves, and value opportunities.

## Features

- Fetches odds from configurable providers
- Tracks historical odds snapshots
- Computes opening vs. current line/price movement
- Generates `latest.csv` snapshot with movement data
- Automated updates via GitHub Actions

## Supported Sports (MVP)

- NFL
- NBA

## Supported Markets

- Moneyline
- Spread
- Total (Over/Under)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/hedj.git
cd hedj
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure

Copy the example config and update with your API key:

```bash
cp config.example.json config.json
```

Edit `config.json` to add your API key (or leave as `"STUB"` for test data).

### 4. Run

```bash
python -m hedj.cli --config config.json
```

This will:
- Fetch odds from the configured provider
- Append to `data/history/odds_history.csv`
- Generate `data/latest/latest.csv` with movement calculations

## Configuration

```json
{
  "provider": {
    "type": "example",
    "base_url": "https://api.the-odds-api.com/v4/sports",
    "api_key": "YOUR_API_KEY",
    "regions": ["us"],
    "books": ["fanduel"],
    "sports": ["americanfootball_nfl", "basketball_nba"]
  },
  "storage": {
    "history_path": "data/history/odds_history.csv",
    "latest_path": "data/latest/latest.csv",
    "raw_directory": "data/raw"
  }
}
```

### Provider Options

- `type`: Provider type (currently only `"example"`)
- `base_url`: API base URL
- `api_key`: Your API key (use `"STUB"` for test data)
- `regions`: Regions to fetch odds for
- `books`: Sportsbooks to include
- `sports`: Sports to track

## Data Output

### History CSV (`data/history/odds_history.csv`)

Append-only log of all odds snapshots:

| Column | Description |
|--------|-------------|
| timestamp_utc | ISO 8601 timestamp of the snapshot |
| book | Sportsbook identifier |
| sport | Sport (NFL, NBA, etc.) |
| event_id | Unique event identifier |
| event_start_time | Game start time |
| home_team | Home team name |
| away_team | Away team name |
| market_type | moneyline, spread, or total |
| outcome | home, away, over, or under |
| price | American odds |
| line | Spread/total line (empty for moneyline) |

### Latest CSV (`data/latest/latest.csv`)

Latest snapshot per unique key with computed movements:

| Column | Description |
|--------|-------------|
| book | Sportsbook identifier |
| sport | Sport |
| event_id | Unique event identifier |
| home_team | Home team name |
| away_team | Away team name |
| market_type | Market type |
| outcome | Betting outcome |
| opening_price | First observed price |
| current_price | Most recent price |
| price_movement | current_price - opening_price |
| opening_line | First observed line |
| current_line | Most recent line |
| line_movement | current_line - opening_line |
| last_updated | Timestamp of last update |

## GitHub Actions Automation

The workflow runs every 30 minutes and:
1. Fetches latest odds
2. Updates history and latest CSVs
3. Commits and pushes changes

To enable:
1. Add `ODDS_API_KEY` secret to your repository
2. Enable GitHub Actions

## Project Structure

```
hedj/
├── hedj/
│   ├── __init__.py
│   ├── __main__.py
│   ├── cli.py           # Command-line interface
│   ├── models.py        # Data models
│   ├── storage.py       # CSV storage logic
│   └── providers/
│       ├── __init__.py
│       ├── base.py      # Provider interface
│       └── example_provider.py
├── scripts/
│   └── update_feed.py   # Convenience script
├── data/
│   ├── history/         # Historical snapshots
│   ├── latest/          # Latest snapshot
│   └── raw/             # Raw API responses
├── .github/
│   └── workflows/
│       └── update_odds_feed.yml
├── config.example.json
├── requirements.txt
└── README.md
```

## Development

### Running with verbose output

```bash
python -m hedj.cli --config config.json --verbose
```

### Using stub data

Set `api_key` to `"STUB"` in your config to use built-in test data without making API calls.

## License

MIT
