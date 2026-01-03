# Ante AI Roadmap

## Phase 1: Core Improvements (Current Sprint)
- [x] Filter out yesterday's games (only show today + future)
- [ ] Weather data for NFL games
- [ ] Player news aggregation

## Phase 2: Weather Integration (NFL)
**Goal:** Show weather conditions that affect betting (wind, rain, snow, temperature)

### Data Sources (Free):
1. **Open-Meteo API** (free, no API key needed)
   - Hourly forecasts
   - Wind speed, precipitation, temperature

### Implementation:
- Create `weather.ts` service to fetch weather by stadium location
- Map NFL teams to stadium coordinates
- Show weather widget on game cards (outdoor stadiums only)
- Alert when weather conditions change significantly

### Weather Impact Indicators:
- 🌧️ Rain/Snow > 50% chance
- 💨 Wind > 15mph (affects passing games)
- 🥶 Temp < 32°F (affects kicking)
- ☀️ Clear conditions

---

## Phase 3: Player News Aggregation
**Goal:** Surface breaking news that affects betting lines

### Data Sources:
1. **Twitter/X** (via our existing API)
   - Follow: @AdamSchefter, @RapSheet, @ShamsCharania, @wojespn
   - Search for injury/trade keywords

2. **ESPN API** (free, unofficial)
   - Injury reports
   - Team news

3. **Google News RSS** (free)
   - Search: "[team name] injury" OR "[team name] trade"

4. **Reddit API** (free)
   - r/nfl, r/nba for breaking news

### Implementation:
- Create news aggregation service
- NLP to detect sentiment (positive/negative for team)
- Link news to affected games
- Show news feed on dashboard
- Tweet alerts for major breaking news

---

## Phase 4: Additional Sports
**Priority order:**
1. **MLB** (Spring Training → Regular Season)
2. **NHL**
3. **College Football** (CFB)
4. **College Basketball** (CBB)
5. **Soccer** (EPL, MLS)

### Notes:
- The Odds API supports all these sports
- Each sport = ~2 API calls per update
- Budget: Stay under 500 calls/month

---

## Phase 5: Player Props
**Goal:** Track player prop odds across books

### Markets:
- Points (NBA)
- Passing/Rushing/Receiving yards (NFL)
- Strikeouts, Hits (MLB)

### Challenges:
- Player props = many more API calls
- May need to upgrade API tier
- Start with featured players only

---

## Technical Debt
- [ ] Set up proper Vercel + GitHub integration (auto-deploy)
- [ ] Add error handling for failed API calls
- [ ] Add loading states to UI
- [ ] Mobile responsiveness improvements
- [ ] Add caching layer for API responses

---

## API Budget Planning
Current: Free tier (500 requests/month)

| Feature | Calls/Update | Updates/Day | Monthly |
|---------|-------------|-------------|---------|
| NFL + NBA odds | 8 | 4 | 960 ❌ |
| Reduce to 3x/day | 8 | 3 | 720 ❌ |
| Reduce to 2x/day | 8 | 2 | 480 ✅ |

**Recommendation:** Upgrade to Basic tier ($20/mo, 10k requests) when adding more sports
