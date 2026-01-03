import { GameOdds, BookOdds } from "./types";

export interface ArbitrageOpportunity {
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  eventStartTime: string;
  type: "two-way" | "three-way";
  market: "moneyline" | "spread" | "total";
  profit: number; // Percentage profit (e.g., 2.5 = 2.5% guaranteed profit)
  totalStake: number; // For $100 total stake
  legs: ArbitrageLeg[];
}

export interface ArbitrageLeg {
  side: string;
  book: string;
  odds: number;
  impliedProb: number;
  stake: number; // Amount to bet for $100 total stake
  payout: number;
}

// Convert American odds to decimal odds
function americanToDecimal(american: number): number {
  if (american > 0) {
    return 1 + american / 100;
  } else {
    return 1 + 100 / Math.abs(american);
  }
}

// Convert decimal odds to implied probability
function decimalToImpliedProb(decimal: number): number {
  return 1 / decimal;
}

// Check if there's an arbitrage opportunity in a two-way market
function checkTwoWayArbitrage(
  odds1: { book: string; price: number; side: string },
  odds2: { book: string; price: number; side: string }
): ArbitrageOpportunity["legs"] | null {
  const decimal1 = americanToDecimal(odds1.price);
  const decimal2 = americanToDecimal(odds2.price);

  const prob1 = decimalToImpliedProb(decimal1);
  const prob2 = decimalToImpliedProb(decimal2);

  const totalProb = prob1 + prob2;

  // If total probability < 1, there's an arbitrage opportunity
  if (totalProb < 1) {
    const totalStake = 100;
    const stake1 = (prob1 / totalProb) * totalStake;
    const stake2 = (prob2 / totalProb) * totalStake;
    const payout = stake1 * decimal1; // Both payouts should be equal

    return [
      {
        side: odds1.side,
        book: odds1.book,
        odds: odds1.price,
        impliedProb: prob1 * 100,
        stake: Math.round(stake1 * 100) / 100,
        payout: Math.round(payout * 100) / 100,
      },
      {
        side: odds2.side,
        book: odds2.book,
        odds: odds2.price,
        impliedProb: prob2 * 100,
        stake: Math.round(stake2 * 100) / 100,
        payout: Math.round(payout * 100) / 100,
      },
    ];
  }

  return null;
}

// Find best odds for each side across all books
function findBestOdds(
  oddsArray: BookOdds[],
  side: string
): { book: string; price: number } | null {
  const filtered = oddsArray.filter((o) => o.outcome === side);
  if (filtered.length === 0) return null;

  return filtered.reduce(
    (best, current) =>
      current.currentPrice > best.price
        ? { book: current.book, price: current.currentPrice }
        : best,
    { book: filtered[0].book, price: filtered[0].currentPrice }
  );
}

// Find all arbitrage opportunities in a game
export function findArbitrageOpportunities(
  game: GameOdds
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  // Check moneyline market
  const bestHomeML = findBestOdds(game.markets.moneyline, "home");
  const bestAwayML = findBestOdds(game.markets.moneyline, "away");

  if (bestHomeML && bestAwayML) {
    const legs = checkTwoWayArbitrage(
      { ...bestHomeML, side: game.homeTeam },
      { ...bestAwayML, side: game.awayTeam }
    );

    if (legs) {
      const profit = (legs[0].payout - 100) / 100 * 100;
      opportunities.push({
        gameId: game.eventId,
        sport: game.sport,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        eventStartTime: game.eventStartTime,
        type: "two-way",
        market: "moneyline",
        profit: Math.round(profit * 100) / 100,
        totalStake: 100,
        legs,
      });
    }
  }

  // Check total market
  const bestOver = findBestOdds(game.markets.total, "over");
  const bestUnder = findBestOdds(game.markets.total, "under");

  if (bestOver && bestUnder) {
    const overOdds = game.markets.total.find(o => o.book === bestOver.book && o.outcome === "over");
    const underOdds = game.markets.total.find(o => o.book === bestUnder.book && o.outcome === "under");
    const line = overOdds?.currentLine ?? underOdds?.currentLine;

    const legs = checkTwoWayArbitrage(
      { ...bestOver, side: `Over ${line}` },
      { ...bestUnder, side: `Under ${line}` }
    );

    if (legs) {
      const profit = (legs[0].payout - 100) / 100 * 100;
      opportunities.push({
        gameId: game.eventId,
        sport: game.sport,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        eventStartTime: game.eventStartTime,
        type: "two-way",
        market: "total",
        profit: Math.round(profit * 100) / 100,
        totalStake: 100,
        legs,
      });
    }
  }

  // Check spread market (need to match same line)
  const spreadLines = new Map<number, { home: BookOdds[]; away: BookOdds[] }>();

  game.markets.spread.forEach((odds) => {
    const line = odds.currentLine ?? 0;
    if (!spreadLines.has(line)) {
      spreadLines.set(line, { home: [], away: [] });
    }
    const group = spreadLines.get(line)!;
    if (odds.outcome === "home") {
      group.home.push(odds);
    } else {
      group.away.push(odds);
    }
  });

  spreadLines.forEach((group, line) => {
    if (group.home.length > 0 && group.away.length > 0) {
      const bestHome = group.home.reduce((best, curr) =>
        curr.currentPrice > best.currentPrice ? curr : best
      );
      const bestAway = group.away.reduce((best, curr) =>
        curr.currentPrice > best.currentPrice ? curr : best
      );

      const legs = checkTwoWayArbitrage(
        { book: bestHome.book, price: bestHome.currentPrice, side: `${game.homeTeam} ${line > 0 ? '+' : ''}${line}` },
        { book: bestAway.book, price: bestAway.currentPrice, side: `${game.awayTeam} ${-line > 0 ? '+' : ''}${-line}` }
      );

      if (legs) {
        const profit = (legs[0].payout - 100) / 100 * 100;
        opportunities.push({
          gameId: game.eventId,
          sport: game.sport,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          eventStartTime: game.eventStartTime,
          type: "two-way",
          market: "spread",
          profit: Math.round(profit * 100) / 100,
          totalStake: 100,
          legs,
        });
      }
    }
  });

  return opportunities.sort((a, b) => b.profit - a.profit);
}

// Find all arbitrage opportunities across all games
export function findAllArbitrage(games: GameOdds[]): ArbitrageOpportunity[] {
  const allOpportunities: ArbitrageOpportunity[] = [];

  games.forEach((game) => {
    const gameOpps = findArbitrageOpportunities(game);
    allOpportunities.push(...gameOpps);
  });

  // Sort by profit descending
  return allOpportunities.sort((a, b) => b.profit - a.profit);
}

// Calculate expected value of a bet
export function calculateEV(
  odds: number,
  trueProbability: number // 0-1
): number {
  const decimal = americanToDecimal(odds);
  const impliedProb = decimalToImpliedProb(decimal);

  // EV = (True Prob * Payout) - (1 - True Prob) * Stake
  // Simplified for $1 stake: EV = (True Prob * (Decimal - 1)) - (1 - True Prob)
  const ev = trueProbability * (decimal - 1) - (1 - trueProbability);
  return ev * 100; // Return as percentage
}

// Find positive EV opportunities (comparing to closing line value)
export function findPositiveEV(
  game: GameOdds,
  closingOdds?: { home: number; away: number }
): { side: string; book: string; odds: number; ev: number }[] {
  const positiveEV: { side: string; book: string; odds: number; ev: number }[] = [];

  if (!closingOdds) return positiveEV;

  // Calculate true probabilities from closing line (removing vig)
  const homeDecimal = americanToDecimal(closingOdds.home);
  const awayDecimal = americanToDecimal(closingOdds.away);
  const homeImplied = 1 / homeDecimal;
  const awayImplied = 1 / awayDecimal;
  const totalImplied = homeImplied + awayImplied;

  const homeTrueProb = homeImplied / totalImplied;
  const awayTrueProb = awayImplied / totalImplied;

  // Check all books for +EV
  game.markets.moneyline.forEach((odds) => {
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
