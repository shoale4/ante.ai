import { GameOdds, Sport } from "./types";

export interface BookStats {
  book: string;
  totalMarkets: number;
  bestOddsCount: number;
  bestOddsPercent: number;
  avgEdgeOverMarket: number; // How much better than average when they have best odds
  bySport: Record<string, { total: number; best: number; percent: number }>;
  byMarket: Record<string, { total: number; best: number; percent: number }>;
}

export interface BookLeaderboard {
  overall: BookStats[];
  bySport: Record<string, BookStats[]>;
  lastUpdated: string;
}

// Calculate which book has the best odds for each market
export function calculateBookRankings(games: GameOdds[]): BookLeaderboard {
  const bookData = new Map<string, {
    totalMarkets: number;
    bestOddsCount: number;
    totalEdge: number;
    edgeCount: number;
    bySport: Map<string, { total: number; best: number }>;
    byMarket: Map<string, { total: number; best: number }>;
  }>();

  // Initialize book data for all books we see
  const initBook = (book: string) => {
    if (!bookData.has(book)) {
      bookData.set(book, {
        totalMarkets: 0,
        bestOddsCount: 0,
        totalEdge: 0,
        edgeCount: 0,
        bySport: new Map(),
        byMarket: new Map(),
      });
    }
  };

  // Process each game
  for (const game of games) {
    const sport = game.sport;

    // Process each market type
    const markets = [
      { type: "moneyline", data: game.markets.moneyline },
      { type: "spread", data: game.markets.spread },
      { type: "total", data: game.markets.total },
    ];

    for (const market of markets) {
      if (market.data.length === 0) continue;

      // Group by outcome (and line for spread/total)
      const outcomeGroups = new Map<string, typeof market.data>();

      for (const odds of market.data) {
        const key = market.type === "moneyline"
          ? odds.outcome
          : `${odds.outcome}_${odds.currentLine}`;

        if (!outcomeGroups.has(key)) {
          outcomeGroups.set(key, []);
        }
        outcomeGroups.get(key)!.push(odds);
      }

      // For each outcome group, find the best odds
      for (const [, oddsGroup] of outcomeGroups) {
        if (oddsGroup.length < 2) continue; // Need at least 2 books to compare

        // Find best price (highest is best for American odds)
        let bestPrice = -Infinity;
        let bestBook = "";
        let totalPrice = 0;

        for (const odds of oddsGroup) {
          initBook(odds.book);
          const data = bookData.get(odds.book)!;

          // Increment total markets for this book
          data.totalMarkets++;

          // Track by sport
          if (!data.bySport.has(sport)) {
            data.bySport.set(sport, { total: 0, best: 0 });
          }
          data.bySport.get(sport)!.total++;

          // Track by market type
          if (!data.byMarket.has(market.type)) {
            data.byMarket.set(market.type, { total: 0, best: 0 });
          }
          data.byMarket.get(market.type)!.total++;

          totalPrice += odds.currentPrice;
          if (odds.currentPrice > bestPrice) {
            bestPrice = odds.currentPrice;
            bestBook = odds.book;
          }
        }

        // Credit the winner
        if (bestBook) {
          const data = bookData.get(bestBook)!;
          data.bestOddsCount++;
          data.bySport.get(sport)!.best++;
          data.byMarket.get(market.type)!.best++;

          // Calculate edge over average
          const avgPrice = totalPrice / oddsGroup.length;
          const edge = bestPrice - avgPrice;
          data.totalEdge += edge;
          data.edgeCount++;
        }
      }
    }
  }

  // Convert to sorted leaderboard
  const overall: BookStats[] = [];
  const bySportMap = new Map<string, BookStats[]>();

  for (const [book, data] of bookData) {
    if (data.totalMarkets === 0) continue;

    const stats: BookStats = {
      book,
      totalMarkets: data.totalMarkets,
      bestOddsCount: data.bestOddsCount,
      bestOddsPercent: Math.round((data.bestOddsCount / data.totalMarkets) * 1000) / 10,
      avgEdgeOverMarket: data.edgeCount > 0
        ? Math.round((data.totalEdge / data.edgeCount) * 10) / 10
        : 0,
      bySport: {},
      byMarket: {},
    };

    // Convert sport map
    for (const [sport, sportData] of data.bySport) {
      stats.bySport[sport] = {
        total: sportData.total,
        best: sportData.best,
        percent: Math.round((sportData.best / sportData.total) * 1000) / 10,
      };

      // Add to by-sport leaderboard
      if (!bySportMap.has(sport)) {
        bySportMap.set(sport, []);
      }
      bySportMap.get(sport)!.push({
        ...stats,
        // Override with sport-specific stats for sorting
        bestOddsPercent: Math.round((sportData.best / sportData.total) * 1000) / 10,
      });
    }

    // Convert market map
    for (const [marketType, marketData] of data.byMarket) {
      stats.byMarket[marketType] = {
        total: marketData.total,
        best: marketData.best,
        percent: Math.round((marketData.best / marketData.total) * 1000) / 10,
      };
    }

    overall.push(stats);
  }

  // Sort by best odds percentage
  overall.sort((a, b) => b.bestOddsPercent - a.bestOddsPercent);

  // Sort each sport's leaderboard
  const bySport: Record<string, BookStats[]> = {};
  for (const [sport, stats] of bySportMap) {
    stats.sort((a, b) => b.bestOddsPercent - a.bestOddsPercent);
    bySport[sport] = stats;
  }

  return {
    overall,
    bySport,
    lastUpdated: new Date().toISOString(),
  };
}

// Book display names
export const BOOK_NAMES: Record<string, string> = {
  fanduel: "FanDuel",
  draftkings: "DraftKings",
  betmgm: "BetMGM",
  caesars: "Caesars",
  pointsbetus: "PointsBet",
  bet365: "bet365",
  betonlineag: "BetOnline",
};

// Book colors for UI
export const BOOK_COLORS: Record<string, string> = {
  fanduel: "#1493ff",
  draftkings: "#53d337",
  betmgm: "#c4a44a",
  caesars: "#0a4d3c",
  pointsbetus: "#e91c23",
  bet365: "#027b5b",
  betonlineag: "#ff6b00",
};
