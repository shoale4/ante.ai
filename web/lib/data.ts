import { OddsSnapshot, GameOdds, LineMovement } from "./types";

// Fetch CSV from GitHub raw URL
const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/shoale4/hedj/main/data/latest/latest.csv";

export async function getLatestOdds(): Promise<OddsSnapshot[]> {
  try {
    const response = await fetch(GITHUB_RAW_URL, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error("Failed to fetch CSV:", response.status);
      return [];
    }

    const content = await response.text();
    const lines = content.trim().split("\n");

    if (lines.length < 2) {
      return [];
    }

    return lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      return {
        book: values[0],
        sport: values[1],
        eventId: values[2],
        eventStartTime: values[3],
        homeTeam: values[4],
        awayTeam: values[5],
        marketType: values[6] as "moneyline" | "spread" | "total",
        outcome: values[7] as "home" | "away" | "over" | "under",
        openingPrice: parseInt(values[8]) || 0,
        currentPrice: parseInt(values[9]) || 0,
        priceMovement: parseInt(values[10]) || 0,
        openingLine: values[11] ? parseFloat(values[11]) : null,
        currentLine: values[12] ? parseFloat(values[12]) : null,
        lineMovement: values[13] ? parseFloat(values[13]) : null,
        lastUpdated: values[14],
      };
    });
  } catch (error) {
    console.error("Error fetching latest.csv:", error);
    return [];
  }
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

export async function getGameOdds(): Promise<GameOdds[]> {
  const odds = await getLatestOdds();

  // Group by event
  const gamesMap = new Map<string, GameOdds>();

  for (const snapshot of odds) {
    if (!gamesMap.has(snapshot.eventId)) {
      gamesMap.set(snapshot.eventId, {
        eventId: snapshot.eventId,
        sport: snapshot.sport,
        homeTeam: snapshot.homeTeam,
        awayTeam: snapshot.awayTeam,
        eventStartTime: snapshot.eventStartTime,
        markets: {
          moneyline: [],
          spread: [],
          total: [],
        },
      });
    }

    const game = gamesMap.get(snapshot.eventId)!;
    const bookOdds = {
      book: snapshot.book,
      outcome: snapshot.outcome,
      openingPrice: snapshot.openingPrice,
      currentPrice: snapshot.currentPrice,
      priceMovement: snapshot.priceMovement,
      openingLine: snapshot.openingLine,
      currentLine: snapshot.currentLine,
      lineMovement: snapshot.lineMovement,
      lastUpdated: snapshot.lastUpdated,
    };

    game.markets[snapshot.marketType].push(bookOdds);
  }

  // Filter to only today's games and future games (exclude past games)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const filteredGames = Array.from(gamesMap.values()).filter((game) => {
    const gameTime = new Date(game.eventStartTime);
    // Show games from today onwards (game start time >= start of today)
    return gameTime >= todayStart;
  });

  // Sort by event start time
  return filteredGames.sort(
    (a, b) =>
      new Date(a.eventStartTime).getTime() -
      new Date(b.eventStartTime).getTime()
  );
}

export async function getLineMovements(): Promise<LineMovement[]> {
  const odds = await getLatestOdds();

  // Filter to only rows with significant movement
  const movements = odds
    .filter((o) => {
      const hasLineMove = o.lineMovement !== null && o.lineMovement !== 0;
      const hasPriceMove = Math.abs(o.priceMovement) >= 5;
      return hasLineMove || hasPriceMove;
    })
    .map((o) => ({
      eventId: o.eventId,
      sport: o.sport,
      homeTeam: o.homeTeam,
      awayTeam: o.awayTeam,
      eventStartTime: o.eventStartTime,
      marketType: o.marketType,
      outcome: o.outcome,
      book: o.book,
      openingPrice: o.openingPrice,
      currentPrice: o.currentPrice,
      priceMovement: o.priceMovement,
      openingLine: o.openingLine,
      currentLine: o.currentLine,
      lineMovement: o.lineMovement,
      lastUpdated: o.lastUpdated,
    }));

  // Sort by absolute movement (most significant first)
  return movements.sort((a, b) => {
    const aMove = Math.abs(a.lineMovement || 0) + Math.abs(a.priceMovement) / 10;
    const bMove = Math.abs(b.lineMovement || 0) + Math.abs(b.priceMovement) / 10;
    return bMove - aMove;
  });
}

export function findBestOdds(
  bookOdds: { book: string; currentPrice: number; outcome: string }[]
): { book: string; price: number } | null {
  if (bookOdds.length === 0) return null;

  // Higher price is always better (for both + and - odds)
  return bookOdds.reduce(
    (best, current) => {
      return current.currentPrice > best.price
        ? { book: current.book, price: current.currentPrice }
        : best;
    },
    { book: bookOdds[0].book, price: bookOdds[0].currentPrice }
  );
}
