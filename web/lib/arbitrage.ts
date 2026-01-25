/**
 * Arbitrage Detection Module - Production Hardened
 *
 * This module handles all arbitrage math, stake sizing, and validation.
 * CRITICAL: This code handles real money calculations. All math must be verified.
 */

import { GameOdds, BookOdds } from "./types";

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ArbitrageConfig {
  /** Maximum seconds since last update for odds to be considered fresh */
  freshnessSeconds: number;
  /** Minimum ROI percentage to surface an arb (after rounding) */
  minRoiPercent: number;
  /** Maximum ROI percentage (above this is likely data error) */
  maxRoiPercent: number;
  /** Rounding buffer in cents to ensure profit survives rounding */
  roundingBufferCents: number;
  /** Books to exclude from arb detection */
  blockedBooks: string[];
  /** If true, only include books that support online betting */
  onlineOnly: boolean;
  /** Book metadata for filtering */
  bookMetadata: Record<string, BookMetadata>;
}

export interface BookMetadata {
  supportsOnline: boolean;
  notes?: string;
}

const DEFAULT_CONFIG: ArbitrageConfig = {
  freshnessSeconds: 300, // 5 minutes (match data refresh interval)
  minRoiPercent: 0.1,    // Minimum 0.1% ROI after rounding
  maxRoiPercent: 15,     // Above 15% is almost certainly bad data
  roundingBufferCents: 2, // $0.02 buffer for rounding safety
  blockedBooks: [],
  onlineOnly: false,
  bookMetadata: {},
};

let currentConfig: ArbitrageConfig = { ...DEFAULT_CONFIG };

export function setArbitrageConfig(config: Partial<ArbitrageConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

export function getArbitrageConfig(): ArbitrageConfig {
  return { ...currentConfig };
}

// ============================================================================
// CORE TYPES
// ============================================================================

export interface ArbitrageLeg {
  side: string;
  book: string;
  odds: number;           // American odds
  decimalOdds: number;    // Decimal odds
  impliedProb: number;    // As decimal (0-1)
  stake: number;          // Rounded stake in dollars
  rawStake: number;       // Pre-rounding stake
  payout: number;         // Payout if this leg wins
  lastUpdated: string;    // ISO timestamp
}

export interface ArbitrageOpportunity {
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  eventStartTime: string;
  type: "two-way" | "three-way";
  market: "moneyline" | "spread" | "total";

  // Core math outputs
  impliedProbSum: number;     // Sum of implied probabilities (< 1 = arb exists)
  roiPercent: number;         // ROI as percentage (e.g., 2.5 = 2.5%)
  totalStake: number;         // Total amount staked
  guaranteedProfit: number;   // Guaranteed profit in dollars
  guaranteedPayout: number;   // Guaranteed payout in dollars

  // Legs with full details
  legs: ArbitrageLeg[];

  // Risk flags
  isStale: boolean;           // Any leg has stale odds
  stalestLegSeconds: number;  // Age of oldest leg in seconds
  timestampDivergence: number; // Max difference between leg timestamps
  riskTier: "low" | "medium" | "high";
  riskNotes: string[];

  // Validation
  isValid: boolean;           // Passes all validation checks
  validationErrors: string[];

  // For backwards compatibility
  profit: number;             // Same as roiPercent
}

// ============================================================================
// ODDS CONVERSION - VERIFIED MATH
// ============================================================================

/**
 * Convert American odds to decimal odds.
 *
 * American odds:
 *   Positive (+150): How much you win on a $100 bet
 *   Negative (-150): How much you need to bet to win $100
 *
 * Decimal odds:
 *   Total payout per $1 bet (includes stake)
 *
 * Formula:
 *   Positive: decimal = 1 + (american / 100)
 *   Negative: decimal = 1 + (100 / |american|)
 *
 * Examples:
 *   +100 → 2.00
 *   -100 → 2.00
 *   +150 → 2.50
 *   -150 → 1.667
 *   +200 → 3.00
 *   -200 → 1.50
 */
export function americanToDecimal(american: number): number {
  if (american >= 100) {
    return 1 + american / 100;
  } else if (american <= -100) {
    return 1 + 100 / Math.abs(american);
  } else {
    // Invalid American odds (between -100 and +100 exclusive)
    // This should never happen with valid data
    throw new Error(`Invalid American odds: ${american}. Must be >= 100 or <= -100.`);
  }
}

/**
 * Convert decimal odds to implied probability.
 *
 * Formula: impliedProb = 1 / decimalOdds
 *
 * Examples:
 *   2.00 → 0.50 (50%)
 *   1.50 → 0.667 (66.7%)
 *   3.00 → 0.333 (33.3%)
 */
export function decimalToImpliedProb(decimal: number): number {
  if (decimal <= 1) {
    throw new Error(`Invalid decimal odds: ${decimal}. Must be > 1.`);
  }
  return 1 / decimal;
}

/**
 * Validate American odds are in valid range.
 */
export function isValidAmericanOdds(odds: number): boolean {
  return odds >= 100 || odds <= -100;
}

// ============================================================================
// SANITY VALIDATION
// ============================================================================

/**
 * Sanity bounds for different bet types.
 * Values outside these ranges are almost certainly data errors.
 */
const SANITY_BOUNDS = {
  // American odds bounds (most extreme realistic odds)
  minOdds: -50000, // -50000 = bet $50000 to win $100
  maxOdds: 50000,  // +50000 = bet $100 to win $50000

  // Spread bounds by sport
  spreadBounds: {
    NFL: { min: -30, max: 30 },
    NBA: { min: -40, max: 40 },
    NCAAB: { min: -50, max: 50 },
    MLB: { min: -5, max: 5 },    // Run lines
    NHL: { min: -3, max: 3 },    // Puck lines
    MMA: { min: -10, max: 10 },
    Soccer: { min: -5, max: 5 },
    default: { min: -50, max: 50 },
  },

  // Total bounds by sport
  totalBounds: {
    NFL: { min: 25, max: 80 },
    NBA: { min: 180, max: 280 },
    NCAAB: { min: 100, max: 200 },
    MLB: { min: 5, max: 18 },
    NHL: { min: 3, max: 10 },
    MMA: { min: 0.5, max: 5 },   // Rounds
    Soccer: { min: 0.5, max: 6 },
    default: { min: 0, max: 300 },
  },
} as const;

export interface SanityCheckResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Check if American odds are within sanity bounds.
 */
export function checkOddsSanity(odds: number): SanityCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isValidAmericanOdds(odds)) {
    errors.push(`Invalid odds ${odds}: must be >= 100 or <= -100`);
  }

  if (odds > SANITY_BOUNDS.maxOdds) {
    errors.push(`Odds ${odds} exceed max sanity bound of +${SANITY_BOUNDS.maxOdds}`);
  }

  if (odds < SANITY_BOUNDS.minOdds) {
    errors.push(`Odds ${odds} below min sanity bound of ${SANITY_BOUNDS.minOdds}`);
  }

  // Warn on very extreme but not invalid odds
  if (odds > 10000 || odds < -10000) {
    warnings.push(`Extreme odds detected: ${odds}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a spread line is within sanity bounds for a sport.
 */
export function checkSpreadSanity(line: number, sport: string): SanityCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const bounds = SANITY_BOUNDS.spreadBounds[sport as keyof typeof SANITY_BOUNDS.spreadBounds]
    ?? SANITY_BOUNDS.spreadBounds.default;

  if (line < bounds.min || line > bounds.max) {
    errors.push(`Spread ${line} outside ${sport} bounds [${bounds.min}, ${bounds.max}]`);
  }

  // Warn on large but not invalid spreads
  if (Math.abs(line) > 20) {
    warnings.push(`Large spread detected: ${line > 0 ? '+' : ''}${line}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a total line is within sanity bounds for a sport.
 */
export function checkTotalSanity(line: number, sport: string): SanityCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const bounds = SANITY_BOUNDS.totalBounds[sport as keyof typeof SANITY_BOUNDS.totalBounds]
    ?? SANITY_BOUNDS.totalBounds.default;

  if (line < bounds.min || line > bounds.max) {
    errors.push(`Total ${line} outside ${sport} bounds [${bounds.min}, ${bounds.max}]`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Comprehensive sanity check for a market.
 */
export function checkMarketSanity(
  market: "moneyline" | "spread" | "total",
  sport: string,
  odds: number,
  line?: number | null
): SanityCheckResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Check odds
  const oddsCheck = checkOddsSanity(odds);
  allErrors.push(...oddsCheck.errors);
  allWarnings.push(...oddsCheck.warnings);

  // Check line based on market type
  if (line !== null && line !== undefined) {
    if (market === "spread") {
      const spreadCheck = checkSpreadSanity(line, sport);
      allErrors.push(...spreadCheck.errors);
      allWarnings.push(...spreadCheck.warnings);
    } else if (market === "total") {
      const totalCheck = checkTotalSanity(line, sport);
      allErrors.push(...totalCheck.errors);
      allWarnings.push(...totalCheck.warnings);
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

// ============================================================================
// STAKE SIZING - ROUNDING SAFE
// ============================================================================

interface StakeSizingResult {
  stakes: number[];           // Rounded stakes
  rawStakes: number[];        // Pre-rounding stakes
  guaranteedPayout: number;   // Minimum payout across all outcomes
  guaranteedProfit: number;   // Profit after rounding
  totalStake: number;
  roiPercent: number;
  isValidAfterRounding: boolean;
  roundingLoss: number;       // How much profit was lost to rounding
}

/**
 * Calculate optimal stakes for arbitrage with rounding safety.
 *
 * For an n-way arb with decimal odds d1, d2, ..., dn:
 *   impliedProbSum = 1/d1 + 1/d2 + ... + 1/dn
 *
 * If impliedProbSum < 1, arb exists.
 *
 * Optimal stake allocation (to equalize payouts):
 *   stake_i = (1/d_i) / impliedProbSum * totalStake
 *
 * This ensures: stake_1 * d_1 = stake_2 * d_2 = ... = guaranteed payout
 */
export function calculateStakes(
  decimalOdds: number[],
  totalStake: number
): StakeSizingResult {
  const impliedProbs = decimalOdds.map(d => 1 / d);
  const impliedProbSum = impliedProbs.reduce((a, b) => a + b, 0);

  // Calculate raw stakes (before rounding)
  const rawStakes = impliedProbs.map(p => (p / impliedProbSum) * totalStake);

  // Calculate theoretical payout (same for all outcomes)
  const theoreticalPayout = rawStakes[0] * decimalOdds[0];
  const theoreticalProfit = theoreticalPayout - totalStake;

  // Round stakes to cents
  const stakes = rawStakes.map(s => Math.round(s * 100) / 100);

  // After rounding, payouts may differ slightly - find the minimum
  const payouts = stakes.map((s, i) => s * decimalOdds[i]);
  const guaranteedPayout = Math.min(...payouts);

  // Actual total stake after rounding (may differ from target)
  const actualTotalStake = stakes.reduce((a, b) => a + b, 0);

  // Guaranteed profit after rounding
  const guaranteedProfit = guaranteedPayout - actualTotalStake;

  // ROI after rounding
  const roiPercent = (guaranteedProfit / actualTotalStake) * 100;

  // Check if rounding killed the arb
  const isValidAfterRounding = guaranteedProfit > currentConfig.roundingBufferCents / 100;

  // How much profit was lost to rounding
  const roundingLoss = theoreticalProfit - guaranteedProfit;

  return {
    stakes,
    rawStakes,
    guaranteedPayout: Math.round(guaranteedPayout * 100) / 100,
    guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
    totalStake: Math.round(actualTotalStake * 100) / 100,
    roiPercent: Math.round(roiPercent * 1000) / 1000,
    isValidAfterRounding,
    roundingLoss: Math.round(roundingLoss * 100) / 100,
  };
}

// ============================================================================
// FRESHNESS CHECKING
// ============================================================================

/**
 * Get age of odds in seconds from lastUpdated timestamp.
 */
export function getOddsAgeSeconds(lastUpdated: string): number {
  try {
    const updated = new Date(lastUpdated);
    // Check if the date is valid (NaN check)
    if (isNaN(updated.getTime())) {
      return Infinity;
    }
    const now = new Date();
    return Math.floor((now.getTime() - updated.getTime()) / 1000);
  } catch {
    return Infinity; // If we can't parse, treat as infinitely stale
  }
}

/**
 * Check if odds are fresh enough to be actionable.
 */
export function isOddsFresh(lastUpdated: string, maxAgeSeconds?: number): boolean {
  const maxAge = maxAgeSeconds ?? currentConfig.freshnessSeconds;
  return getOddsAgeSeconds(lastUpdated) <= maxAge;
}

// ============================================================================
// BOOK FILTERING
// ============================================================================

/**
 * Check if a book should be included in arb detection.
 */
export function isBookAllowed(book: string): boolean {
  // Check blocked list
  if (currentConfig.blockedBooks.includes(book.toLowerCase())) {
    return false;
  }

  // Check online-only filter
  if (currentConfig.onlineOnly) {
    const metadata = currentConfig.bookMetadata[book.toLowerCase()];
    if (!metadata || !metadata.supportsOnline) {
      return false;
    }
  }

  return true;
}

/**
 * Filter BookOdds array to only allowed books.
 */
export function filterAllowedBooks(oddsArray: BookOdds[]): BookOdds[] {
  return oddsArray.filter(o => isBookAllowed(o.book));
}

// ============================================================================
// ARBITRAGE DETECTION
// ============================================================================

interface OddsInput {
  book: string;
  price: number;
  side: string;
  lastUpdated: string;
}

/**
 * Check for two-way arbitrage opportunity.
 */
function checkTwoWayArbitrage(
  odds1: OddsInput,
  odds2: OddsInput,
  totalStake: number = 100
): ArbitrageOpportunity["legs"] | null {
  // Validate odds
  if (!isValidAmericanOdds(odds1.price) || !isValidAmericanOdds(odds2.price)) {
    return null;
  }

  const decimal1 = americanToDecimal(odds1.price);
  const decimal2 = americanToDecimal(odds2.price);

  const prob1 = decimalToImpliedProb(decimal1);
  const prob2 = decimalToImpliedProb(decimal2);
  const totalProb = prob1 + prob2;

  // No arb if implied probability sum >= 1
  if (totalProb >= 1) {
    return null;
  }

  // Calculate stakes
  const sizing = calculateStakes([decimal1, decimal2], totalStake);

  // Check if arb survives rounding
  if (!sizing.isValidAfterRounding) {
    return null;
  }

  return [
    {
      side: odds1.side,
      book: odds1.book,
      odds: odds1.price,
      decimalOdds: decimal1,
      impliedProb: prob1,
      stake: sizing.stakes[0],
      rawStake: sizing.rawStakes[0],
      payout: Math.round(sizing.stakes[0] * decimal1 * 100) / 100,
      lastUpdated: odds1.lastUpdated,
    },
    {
      side: odds2.side,
      book: odds2.book,
      odds: odds2.price,
      decimalOdds: decimal2,
      impliedProb: prob2,
      stake: sizing.stakes[1],
      rawStake: sizing.rawStakes[1],
      payout: Math.round(sizing.stakes[1] * decimal2 * 100) / 100,
      lastUpdated: odds2.lastUpdated,
    },
  ];
}

/**
 * Check for three-way arbitrage opportunity (e.g., soccer 1X2).
 */
function checkThreeWayArbitrage(
  odds1: OddsInput,
  odds2: OddsInput,
  odds3: OddsInput,
  totalStake: number = 100
): ArbitrageOpportunity["legs"] | null {
  // Validate odds
  if (!isValidAmericanOdds(odds1.price) ||
      !isValidAmericanOdds(odds2.price) ||
      !isValidAmericanOdds(odds3.price)) {
    return null;
  }

  const decimal1 = americanToDecimal(odds1.price);
  const decimal2 = americanToDecimal(odds2.price);
  const decimal3 = americanToDecimal(odds3.price);

  const prob1 = decimalToImpliedProb(decimal1);
  const prob2 = decimalToImpliedProb(decimal2);
  const prob3 = decimalToImpliedProb(decimal3);
  const totalProb = prob1 + prob2 + prob3;

  // No arb if implied probability sum >= 1
  if (totalProb >= 1) {
    return null;
  }

  // Calculate stakes
  const sizing = calculateStakes([decimal1, decimal2, decimal3], totalStake);

  // Check if arb survives rounding
  if (!sizing.isValidAfterRounding) {
    return null;
  }

  return [
    {
      side: odds1.side,
      book: odds1.book,
      odds: odds1.price,
      decimalOdds: decimal1,
      impliedProb: prob1,
      stake: sizing.stakes[0],
      rawStake: sizing.rawStakes[0],
      payout: Math.round(sizing.stakes[0] * decimal1 * 100) / 100,
      lastUpdated: odds1.lastUpdated,
    },
    {
      side: odds2.side,
      book: odds2.book,
      odds: odds2.price,
      decimalOdds: decimal2,
      impliedProb: prob2,
      stake: sizing.stakes[1],
      rawStake: sizing.rawStakes[1],
      payout: Math.round(sizing.stakes[1] * decimal2 * 100) / 100,
      lastUpdated: odds2.lastUpdated,
    },
    {
      side: odds3.side,
      book: odds3.book,
      odds: odds3.price,
      decimalOdds: decimal3,
      impliedProb: prob3,
      stake: sizing.stakes[2],
      rawStake: sizing.rawStakes[2],
      payout: Math.round(sizing.stakes[2] * decimal3 * 100) / 100,
      lastUpdated: odds3.lastUpdated,
    },
  ];
}

/**
 * Build ArbitrageOpportunity from legs with all metadata.
 */
function buildArbitrageOpportunity(
  game: GameOdds,
  type: "two-way" | "three-way",
  market: "moneyline" | "spread" | "total",
  legs: ArbitrageLeg[],
  totalStake: number
): ArbitrageOpportunity {
  // Calculate core metrics
  const impliedProbSum = legs.reduce((sum, leg) => sum + leg.impliedProb, 0);
  const actualTotalStake = legs.reduce((sum, leg) => sum + leg.stake, 0);
  const guaranteedPayout = Math.min(...legs.map(l => l.payout));
  const guaranteedProfit = guaranteedPayout - actualTotalStake;
  const roiPercent = (guaranteedProfit / actualTotalStake) * 100;

  // Freshness analysis
  const legAges = legs.map(l => getOddsAgeSeconds(l.lastUpdated));
  const stalestLegSeconds = Math.max(...legAges);
  const isStale = stalestLegSeconds > currentConfig.freshnessSeconds;

  // Timestamp divergence (difference between freshest and stalest)
  const freshestLegSeconds = Math.min(...legAges);
  const timestampDivergence = stalestLegSeconds - freshestLegSeconds;

  // Risk assessment
  const riskNotes: string[] = [];
  let riskTier: "low" | "medium" | "high" = "low";

  if (isStale) {
    riskNotes.push(`Stale odds: oldest leg is ${stalestLegSeconds}s old`);
    riskTier = "high";
  }

  if (timestampDivergence > 120) {
    riskNotes.push(`High timestamp divergence: ${timestampDivergence}s between legs`);
    if (riskTier === "low") riskTier = "medium";
  }

  if (roiPercent > 10) {
    riskNotes.push(`Unusually high ROI (${roiPercent.toFixed(2)}%) - verify odds manually`);
    riskTier = "high";
  }

  // Validation
  const validationErrors: string[] = [];

  if (roiPercent < currentConfig.minRoiPercent) {
    validationErrors.push(`ROI ${roiPercent.toFixed(3)}% below minimum ${currentConfig.minRoiPercent}%`);
  }

  if (roiPercent > currentConfig.maxRoiPercent) {
    validationErrors.push(`ROI ${roiPercent.toFixed(2)}% exceeds maximum ${currentConfig.maxRoiPercent}% (likely bad data)`);
  }

  if (guaranteedProfit <= 0) {
    validationErrors.push(`Non-positive profit after rounding: $${guaranteedProfit.toFixed(2)}`);
  }

  // Staleness is a warning, not a hard filter - user can decide whether to act
  const isValid = validationErrors.length === 0;

  return {
    gameId: game.eventId,
    sport: game.sport,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    eventStartTime: game.eventStartTime,
    type,
    market,
    impliedProbSum: Math.round(impliedProbSum * 10000) / 10000,
    roiPercent: Math.round(roiPercent * 1000) / 1000,
    totalStake: Math.round(actualTotalStake * 100) / 100,
    guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
    guaranteedPayout: Math.round(guaranteedPayout * 100) / 100,
    legs,
    isStale,
    stalestLegSeconds,
    timestampDivergence,
    riskTier,
    riskNotes,
    isValid,
    validationErrors,
    // Backwards compatibility
    profit: Math.round(roiPercent * 100) / 100,
  };
}

/**
 * Find best odds for a side, filtering by allowed books.
 */
function findBestOdds(
  oddsArray: BookOdds[],
  side: string
): { book: string; price: number; lastUpdated: string } | null {
  const filtered = filterAllowedBooks(oddsArray).filter(o => o.outcome === side);
  if (filtered.length === 0) return null;

  return filtered.reduce(
    (best, current) =>
      current.currentPrice > best.price
        ? { book: current.book, price: current.currentPrice, lastUpdated: current.lastUpdated }
        : best,
    { book: filtered[0].book, price: filtered[0].currentPrice, lastUpdated: filtered[0].lastUpdated }
  );
}

/**
 * Find all arbitrage opportunities in a single game.
 */
export function findArbitrageOpportunities(
  game: GameOdds,
  totalStake: number = 100
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  // === MONEYLINE MARKET ===
  const bestHomeML = findBestOdds(game.markets.moneyline, "home");
  const bestAwayML = findBestOdds(game.markets.moneyline, "away");
  const bestDrawML = findBestOdds(game.markets.moneyline, "draw");

  // Three-way (soccer, etc.)
  if (bestHomeML && bestAwayML && bestDrawML) {
    const legs = checkThreeWayArbitrage(
      { ...bestHomeML, side: game.homeTeam },
      { ...bestDrawML, side: "Draw" },
      { ...bestAwayML, side: game.awayTeam },
      totalStake
    );

    if (legs) {
      opportunities.push(buildArbitrageOpportunity(game, "three-way", "moneyline", legs, totalStake));
    }
  } else if (bestHomeML && bestAwayML) {
    // Two-way
    const legs = checkTwoWayArbitrage(
      { ...bestHomeML, side: game.homeTeam },
      { ...bestAwayML, side: game.awayTeam },
      totalStake
    );

    if (legs) {
      opportunities.push(buildArbitrageOpportunity(game, "two-way", "moneyline", legs, totalStake));
    }
  }

  // === TOTAL MARKET ===
  // Group by line value - over/under must be on the SAME line to be a valid arb!
  const overByLine = new Map<number, BookOdds[]>();
  const underByLine = new Map<number, BookOdds[]>();

  filterAllowedBooks(game.markets.total).forEach((odds) => {
    const line = odds.currentLine ?? 0;
    if (odds.outcome === "over") {
      if (!overByLine.has(line)) overByLine.set(line, []);
      overByLine.get(line)!.push(odds);
    } else if (odds.outcome === "under") {
      if (!underByLine.has(line)) underByLine.set(line, []);
      underByLine.get(line)!.push(odds);
    }
  });

  // Check for arbs within each line
  overByLine.forEach((overOdds, line) => {
    const underOdds = underByLine.get(line);

    if (underOdds && underOdds.length > 0) {
      const bestOver = overOdds.reduce((best, curr) =>
        curr.currentPrice > best.currentPrice ? curr : best
      );
      const bestUnder = underOdds.reduce((best, curr) =>
        curr.currentPrice > best.currentPrice ? curr : best
      );

      const legs = checkTwoWayArbitrage(
        {
          book: bestOver.book,
          price: bestOver.currentPrice,
          side: `Over ${line}`,
          lastUpdated: bestOver.lastUpdated,
        },
        {
          book: bestUnder.book,
          price: bestUnder.currentPrice,
          side: `Under ${line}`,
          lastUpdated: bestUnder.lastUpdated,
        },
        totalStake
      );

      if (legs) {
        opportunities.push(buildArbitrageOpportunity(game, "two-way", "total", legs, totalStake));
      }
    }
  });

  // === SPREAD MARKET ===
  // Group by line values (complementary lines: home +X matches away -X)
  const homeSpreadsByLine = new Map<number, BookOdds[]>();
  const awaySpreadsByLine = new Map<number, BookOdds[]>();

  filterAllowedBooks(game.markets.spread).forEach((odds) => {
    const line = odds.currentLine ?? 0;
    if (odds.outcome === "home") {
      if (!homeSpreadsByLine.has(line)) homeSpreadsByLine.set(line, []);
      homeSpreadsByLine.get(line)!.push(odds);
    } else if (odds.outcome === "away") {
      if (!awaySpreadsByLine.has(line)) awaySpreadsByLine.set(line, []);
      awaySpreadsByLine.get(line)!.push(odds);
    }
  });

  // Match complementary lines
  homeSpreadsByLine.forEach((homeOdds, homeLine) => {
    const complementaryAwayLine = -homeLine;
    const awayOdds = awaySpreadsByLine.get(complementaryAwayLine);

    if (awayOdds && awayOdds.length > 0) {
      const bestHome = homeOdds.reduce((best, curr) =>
        curr.currentPrice > best.currentPrice ? curr : best
      );
      const bestAway = awayOdds.reduce((best, curr) =>
        curr.currentPrice > best.currentPrice ? curr : best
      );

      const legs = checkTwoWayArbitrage(
        {
          book: bestHome.book,
          price: bestHome.currentPrice,
          side: `${game.homeTeam} ${homeLine > 0 ? '+' : ''}${homeLine}`,
          lastUpdated: bestHome.lastUpdated,
        },
        {
          book: bestAway.book,
          price: bestAway.currentPrice,
          side: `${game.awayTeam} ${complementaryAwayLine > 0 ? '+' : ''}${complementaryAwayLine}`,
          lastUpdated: bestAway.lastUpdated,
        },
        totalStake
      );

      if (legs) {
        opportunities.push(buildArbitrageOpportunity(game, "two-way", "spread", legs, totalStake));
      }
    }
  });

  return opportunities.sort((a, b) => b.roiPercent - a.roiPercent);
}

/**
 * Find all arbitrage opportunities across all games.
 *
 * @param includeInvalid - If true, includes invalid/stale arbs (marked as such)
 */
export function findAllArbitrage(
  games: GameOdds[],
  totalStake: number = 100,
  includeInvalid: boolean = false
): ArbitrageOpportunity[] {
  const allOpportunities: ArbitrageOpportunity[] = [];

  for (const game of games) {
    const gameOpps = findArbitrageOpportunities(game, totalStake);
    allOpportunities.push(...gameOpps);
  }

  // Filter based on validity
  const filtered = includeInvalid
    ? allOpportunities
    : allOpportunities.filter(opp => opp.isValid);

  // Sort by ROI descending
  return filtered.sort((a, b) => b.roiPercent - a.roiPercent);
}

// ============================================================================
// UTILITY FUNCTIONS (for display/analysis)
// ============================================================================

/**
 * Calculate expected value of a bet.
 */
export function calculateEV(odds: number, trueProbability: number): number {
  const decimal = americanToDecimal(odds);
  const ev = trueProbability * (decimal - 1) - (1 - trueProbability);
  return ev * 100;
}

/**
 * Calculate hold/vig percentage for a two-way market.
 */
export function calculateHold(odds1: number, odds2: number): number {
  const decimal1 = americanToDecimal(odds1);
  const decimal2 = americanToDecimal(odds2);
  const totalProb = (1 / decimal1) + (1 / decimal2);
  return Math.round((totalProb - 1) * 1000) / 10;
}

/**
 * Find positive EV opportunities compared to closing odds.
 */
export function findPositiveEV(
  game: GameOdds,
  closingOdds?: { home: number; away: number }
): { side: string; book: string; odds: number; ev: number }[] {
  if (!closingOdds) return [];

  const homeDecimal = americanToDecimal(closingOdds.home);
  const awayDecimal = americanToDecimal(closingOdds.away);
  const homeImplied = 1 / homeDecimal;
  const awayImplied = 1 / awayDecimal;
  const totalImplied = homeImplied + awayImplied;

  const homeTrueProb = homeImplied / totalImplied;
  const awayTrueProb = awayImplied / totalImplied;

  const positiveEV: { side: string; book: string; odds: number; ev: number }[] = [];

  filterAllowedBooks(game.markets.moneyline).forEach((odds) => {
    const trueProb = odds.outcome === "home" ? homeTrueProb : awayTrueProb;
    const ev = calculateEV(odds.currentPrice, trueProb);

    if (ev > 0) {
      positiveEV.push({
        side: odds.outcome === "home" ? game.homeTeam : game.awayTeam,
        book: odds.book,
        odds: odds.currentPrice,
        ev: Math.round(ev * 100) / 100,
      });
    }
  });

  return positiveEV.sort((a, b) => b.ev - a.ev);
}

/**
 * Find best hold across books for a market.
 */
export function findBestHold(
  odds1Array: Array<{ book: string; price: number }>,
  odds2Array: Array<{ book: string; price: number }>
): { book: string; hold: number } | null {
  let bestHold = Infinity;
  let bestBook = "";

  for (const o1 of odds1Array) {
    const o2 = odds2Array.find(o => o.book === o1.book);
    if (o2) {
      const hold = calculateHold(o1.price, o2.price);
      if (hold < bestHold) {
        bestHold = hold;
        bestBook = o1.book;
      }
    }
  }

  const best1 = odds1Array.reduce((best, curr) => curr.price > best.price ? curr : best, odds1Array[0]);
  const best2 = odds2Array.reduce((best, curr) => curr.price > best.price ? curr : best, odds2Array[0]);

  if (best1 && best2) {
    const crossHold = calculateHold(best1.price, best2.price);
    if (crossHold < bestHold) {
      bestHold = crossHold;
      bestBook = "Best combo";
    }
  }

  return bestBook ? { book: bestBook, hold: bestHold } : null;
}
