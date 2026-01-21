# Hedj - Claude Code Context Document

## What is Hedj?
Hedj is a sports betting arbitrage and line tracking tool. It compares odds across 12+ sportsbooks to find:
1. **Arbitrage opportunities** - Guaranteed profit by betting both sides at different books
2. **Line movements** - Track how odds change over time to spot sharp money
3. **Best odds** - Find the best price for any bet across all books

## Tech Stack

### Backend (Python)
- **Location:** `/hedj/`
- **Entry point:** `python -m hedj.cli --config config.json`
- **Key files:**
  - `cli.py` - Main CLI, orchestrates fetching and storage
  - `providers/example_provider.py` - The Odds API integration
  - `storage.py` - CSV read/write, history management
  - `models.py` - Data structures (EventOdds, OddsRow, etc.)

### Frontend (Next.js)
- **Location:** `/web/`
- **Framework:** Next.js 16.1.1 + React 19 + TypeScript
- **Styling:** Tailwind CSS 4
- **Deployment:** Vercel
- **Key pages:**
  - `/` - Dashboard with games, arbs, line movements
  - `/arbitrage` - Dedicated arbitrage scanner
  - `/feed` - Unified activity feed

### Data Storage
- **CSV-based** (no database)
- `data/history/odds_history.csv` - Append-only historical snapshots
- `data/latest/latest.csv` - Computed latest with movement calculations
- `data/raw/*.json` - Raw API response backups
- **Vercel KV** - Promo codes, waitlist emails (runtime data)

### External APIs
- **The Odds API** - Primary odds data source (paid, credits-based)
- **Anthropic Claude** - AI game analysis (`/api/analyze`)
- **ESPN News API** - Sports news integration

## Data Flow

```
The Odds API → Python CLI → CSV files → GitHub → Next.js frontend (via raw GitHub URLs)
```

GitHub Actions runs hourly to fetch fresh odds and commit to repo.

## Critical Files for Arbitrage

### `web/lib/arbitrage.ts`
Core arbitrage detection algorithm. Key functions:
- `findAllArbitrage(games)` - Main entry, returns all arb opportunities
- `findArbitrageOpportunities(game)` - Per-game arb detection
- `checkTwoWayArbitrage()` - Compares two odds for arb (moneyline, spread, total)
- `checkThreeWayArbitrage()` - Three-way markets (soccer with draw)

**IMPORTANT BUG FIX (Jan 2026):** The spread arbitrage matching was fixed to correctly match complementary lines. Home spread at line X must match with away spread at line -X (e.g., home -3.5 matches away +3.5). Previously it was incorrectly matching same-line odds from different books.

### `web/lib/data.ts`
Data fetching and parsing:
- `getLatestOdds()` - Fetches latest.csv from GitHub
- `getGameOdds()` - Parses CSV into GameOdds objects
- `getLineMovements()` - Calculates price/line movements from history

## API Cost Management

**The Odds API pricing:** Credits based on regions × markets
- Current config: 1 region (us) × 3 markets (h2h, spreads, totals) = 3 credits per sport
- 8 sports × 3 credits = 24 credits per API run
- Hourly updates = 576 credits/day
- $25/mo plan = 20,000 credits

**Cost optimizations implemented:**
1. Changed from 30-min to hourly updates
2. Added configurable markets in `config.json`
3. Added API quota tracking (logs remaining credits)
4. Added `--cleanup` flag to remove old history data

## Config File (`config.json`)

```json
{
  "provider": {
    "api_key": "YOUR_KEY",
    "regions": ["us"],
    "markets": ["h2h", "spreads", "totals"],
    "sports": ["americanfootball_nfl", "basketball_nba", ...],
    "books": ["fanduel", "draftkings", "betmgm", ...]
  },
  "storage": {
    "history_path": "data/history/odds_history.csv",
    "latest_path": "data/latest/latest.csv"
  }
}
```

**Note:** `config.json` contains the real API key. `config.example.json` is the template.

## GitHub Actions Workflows

- `.github/workflows/update_odds_feed.yml` - Hourly odds fetch
- `.github/workflows/cleanup_history.yml` - Weekly data cleanup (keeps 7 days)

## Monetization

- **Free tier:** See top 4 arbs, basic features
- **Pro tier:** All arbs, AI analysis
- **Promo codes:** Stored in Vercel KV, admin API at `/api/admin/codes`
- **Admin secret:** Check `ADMIN_SECRET` env var (default: "da-bears")

## Common Issues & Fixes

### Fake/Impossible Arbitrage (50%+ profit)
**Cause:** Data quality issues or incorrect spread matching
**Fix:**
1. Spread matching now uses complementary lines (home X with away -X)
2. Added 15% max profit filter in `findAllArbitrage()`

### History CSV Too Large (>2MB)
**Cause:** Unbounded append-only history
**Fix:** Weekly cleanup workflow, `--cleanup` CLI flag

### API Quota Running Out
**Cause:** Too frequent updates or too many markets
**Fix:** Reduced to hourly, made markets configurable

## Testing Locally

```bash
# Fetch fresh odds
python3 -m hedj.cli --config config.json --verbose

# Run web dev server
cd web && npm run dev

# Cleanup old data
python3 -m hedj.cli --config config.json --cleanup --cleanup-days 7
```

## Key Type Definitions (`web/lib/types.ts`)

```typescript
interface GameOdds {
  eventId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  eventStartTime: string;
  markets: {
    moneyline: BookOdds[];
    spread: BookOdds[];
    total: BookOdds[];
  };
}

interface BookOdds {
  book: string;
  outcome: "home" | "away" | "draw" | "over" | "under";
  currentPrice: number;      // American odds (-110, +150, etc.)
  currentLine: number | null; // Spread/total line (e.g., -3.5, 45.5)
  // ... movement fields
}
```

## Vercel Environment Variables

Required for production:
- `KV_REST_API_URL` - Vercel KV connection
- `KV_REST_API_TOKEN` - Vercel KV auth
- `ANTHROPIC_API_KEY` - For AI analysis
- `ADMIN_SECRET` - Admin API authentication

## Recent Changes (Jan 2026)

1. **Fixed spread arbitrage bug** - Was comparing wrong lines
2. **Added 15% profit cap** - Filters data errors
3. **Hourly updates** - Was every 30 min
4. **API quota logging** - Tracks remaining credits
5. **Weekly cleanup** - Prevents CSV bloat

## Sports Covered

NFL, NBA, NCAAB, NHL, MMA, Soccer (EPL, La Liga, UCL)

MLB disabled (offseason) - re-enable in late March.
