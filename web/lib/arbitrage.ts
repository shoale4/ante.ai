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
export function americanToDecimal(american: number): number {
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

// Check if there's an arbitrage opportunity in a three-way market (home/draw/away)
function checkThreeWayArbitrage(
  odds1: { book: string; price: number; side: string },
  odds2: { book: string; price: number; side: string },
  odds3: { book: string; price: number; side: string }
): ArbitrageOpportunity["legs"] | null {
  const decimal1 = americanToDecimal(odds1.price);
  const decimal2 = americanToDecimal(odds2.price);
  const decimal3 = americanToDecimal(odds3.price);

  const prob1 = decimalToImpliedProb(decimal1);
  const prob2 = decimalToImpliedProb(decimal2);
  const prob3 = decimalToImpliedProb(decimal3);

  const totalProb = prob1 + prob2 + prob3;

  // If total probability < 1, there's an arbitrage opportunity
  if (totalProb < 1) {
    const totalStake = 100;
    const stake1 = (prob1 / totalProb) * totalStake;
    const stake2 = (prob2 / totalProb) * totalStake;
    const stake3 = (prob3 / totalProb) * totalStake;
    const payout = stake1 * decimal1; // All payouts should be equal

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
      {
        side: odds3.side,
        book: odds3.book,
        odds: odds3.price,
        impliedProb: prob3 * 100,
        stake: Math.round(stake3 * 100) / 100,
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
  const bestDrawML = findBestOdds(game.markets.moneyline, "draw");

  // Check for three-way arbitrage (Soccer, NHL regulation, etc.) if draw odds exist
  if (bestHomeML && bestAwayML && bestDrawML) {
    const legs = checkThreeWayArbitrage(
      { ...bestHomeML, side: game.homeTeam },
      { ...bestDrawML, side: "Draw" },
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
        type: "three-way",
        market: "moneyline",
        profit: Math.round(profit * 100) / 100,
        totalStake: 100,
        legs,
      });
    }
  } else if (bestHomeML && bestAwayML) {
    // Fallback to two-way for sports without draws
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

// Calculate hold/vig percentage for a two-way market
// Returns the percentage over 100% (e.g., 4.5 means 4.5% hold)
export function calculateHold(odds1: number, odds2: number): number {
  const decimal1 = americanToDecimal(odds1);
  const decimal2 = americanToDecimal(odds2);
  const impliedProb1 = 1 / decimal1;
  const impliedProb2 = 1 / decimal2;
  const totalProb = impliedProb1 + impliedProb2;
  // Hold is how much over 100% the total implied probability is
  return Math.round((totalProb - 1) * 1000) / 10; // Return as percentage with 1 decimal
}

// Find the best (lowest) hold across all books for a market
export function findBestHold(
  odds1Array: Array<{ book: string; price: number }>,
  odds2Array: Array<{ book: string; price: number }>
): { book: string; hold: number } | null {
  let bestHold = Infinity;
  let bestBook = "";

  // Check same-book hold first
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

  // Also check cross-book best hold (for display purposes)
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
