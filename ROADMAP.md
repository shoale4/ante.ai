# Hedj Roadmap

## Completed Features
- [x] Filter out yesterday's games (only show today + future)
- [x] Weather data for NFL games (Open-Meteo API)
- [x] ESPN news aggregation with sentiment analysis
- [x] Player props display
- [x] Arbitrage detection across sportsbooks
- [x] Line movement tracking & charts
- [x] AI analysis with Claude (game picks)
- [x] Twitter bot for line movement alerts
- [x] Sportsbook affiliate links (ready for referral IDs)
- [x] Pro feature teasers (waitlist capture)

---

## Phase 1: Monetization Infrastructure (PRIORITY)

### 1.1 Upgrade Odds API ($30/mo for 20k requests)
**Why:** Enables real-time updates (every 15 min vs 6 hours) - this is the core value prop for paid users.

### 1.2 Authentication System
- [ ] Add Clerk or NextAuth.js
- [ ] User registration/login
- [ ] User profile page
- [ ] Session management

### 1.3 Stripe Integration
- [ ] Create Stripe account & products
- [ ] Implement checkout flow
- [ ] Subscription management (upgrade/cancel)
- [ ] Webhook handlers for payment events

### 1.4 Paywall Middleware
- [ ] Protect premium API routes
- [ ] Rate limiting for free tier
- [ ] Feature flags per tier

### Pricing Tiers
| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | View odds (6hr delay), 2 sports, no alerts |
| **Pro** | $19/mo | Real-time odds, arb alerts (email), all sports |
| **Premium** | $49/mo | Everything + SMS alerts, AI picks, player props alerts, priority support |

---

## Phase 2: Premium Features

### 2.1 Real-Time Arbitrage Alerts
- [ ] Email notifications (Resend or SendGrid)
- [ ] SMS notifications (Twilio)
- [ ] Configurable thresholds (e.g., alert if >1.5% profit)
- [ ] Alert preferences page

### 2.2 Increase Update Frequency
- [ ] Update GitHub Actions to run every 15-30 min
- [ ] Add WebSocket or polling for live updates
- [ ] Show "last updated" timestamp

### 2.3 All Sports Support
- [ ] MLB (April - October)
- [ ] NHL (October - June)
- [ ] College Football (August - January)
- [ ] College Basketball (November - April)
- [ ] Soccer (EPL, La Liga, MLS)
- [ ] MMA/UFC

---

## Phase 3: Growth & Revenue

### 3.1 Affiliate Revenue (Passive Income)
- [ ] Sign up for sportsbook affiliate programs:
  - FanDuel: https://www.fanduel.com/affiliates
  - DraftKings: https://www.draftkings.com/affiliates
  - BetMGM: https://promo.betmgm.com/en/affiliates
  - Caesars: https://www.caesars.com/sportsbook/affiliates
- [ ] Add referral IDs to `lib/sportsbooks.ts`
- [ ] Track clicks/conversions

### 3.2 Discord Community
- [ ] Create Discord server
- [ ] Bot to post arb alerts to free channel
- [ ] Private channel for Pro/Premium members
- [ ] Community engagement

### 3.3 Content & SEO
- [ ] Blog with betting insights
- [ ] "How arbitrage works" guide
- [ ] Twitter/X content strategy
- [ ] Email newsletter

---

## Phase 4: Scale & Polish

### 4.1 Database Migration
- [ ] Move from CSV to PostgreSQL (Supabase or Neon)
- [ ] Faster queries for historical data
- [ ] User data storage
- [ ] Analytics tracking

### 4.2 Mobile Experience
- [ ] PWA (Progressive Web App)
- [ ] Push notifications
- [ ] Mobile-optimized UI
- [ ] Consider React Native app later

### 4.3 Advanced Features
- [ ] Bet tracking (log your bets, see P/L)
- [ ] Bankroll management tools
- [ ] Historical performance analytics
- [ ] Custom alerts builder

---

## Technical Debt
- [ ] Set up proper Vercel + GitHub integration (auto-deploy)
- [ ] Add error handling for failed API calls
- [ ] Add loading states to UI
- [ ] Mobile responsiveness improvements
- [ ] Add caching layer for API responses
- [ ] Unit tests for core logic
- [ ] E2E tests with Playwright

---

## API Budget Planning

### Current: Free tier (500 requests/month)
Barely sufficient for 2 sports, 2x/day updates.

### Recommended: Mega tier ($30/mo, 20k requests)

| Feature | Calls/Update | Updates/Day | Monthly |
|---------|-------------|-------------|---------|
| NFL + NBA | 8 | 96 (every 15 min) | 2,880 |
| + MLB + NHL | 8 | 96 | 5,760 |
| + Player Props | 16 | 48 | 8,640 |
| **Total** | - | - | ~17,280 ✅ |

With 20k requests, you can update all sports every 15 minutes during game days.

---

## Revenue Projections

### Conservative (Month 6)
- 100 Pro users @ $19 = $1,900
- 20 Premium users @ $49 = $980
- Affiliate revenue = $500
- **Total: $3,380/mo**

### Costs
- Odds API: $30
- Vercel Pro: $20
- Clerk: $25
- Stripe fees: ~3%
- Twilio/Resend: $20
- **Total: ~$100/mo**

### Net: ~$3,280/mo profit

---

## Quick Reference

### File Locations
- Affiliate links: `web/lib/sportsbooks.ts`
- Pro teasers: `web/components/ProTeaser.tsx`
- Main page: `web/app/page.tsx`
- Arbitrage logic: `web/lib/arbitrage.ts`
- Twitter bot: `hedj/twitter_bot.py`
- GitHub Actions: `.github/workflows/`

### Environment Variables Needed
```
# Already set
ODDS_API_KEY=xxx
TWITTER_CLIENT_ID=xxx
TWITTER_CLIENT_SECRET=xxx
TWITTER_REFRESH_TOKEN=xxx
ANTHROPIC_API_KEY=xxx

# TODO: Add for monetization
CLERK_SECRET_KEY=xxx
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
RESEND_API_KEY=xxx
```
