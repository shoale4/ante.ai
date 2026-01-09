import { OddsSnapshot, GameOdds, LineMovement } from "./types";
import { readFileSync } from "fs";
import { join } from "path";

// Fetch CSV from GitHub raw URL (production) or local file (development)
const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/shoale4/hedj/main/data/latest/latest.csv";
const GITHUB_HISTORY_URL =
  "https://raw.githubusercontent.com/shoale4/hedj/main/data/history/odds_history.csv";

const isDev = process.env.NODE_ENV === "development";

// Historical odds record for movement calculation
interface HistoricalOdds {
  timestamp: string;
  book: string;
  sport: string;
  eventId: string;
  eventStartTime: string;
  homeTeam: string;
  awayTeam: string;
  marketType: "moneyline" | "spread" | "total";
  outcome: "home" | "away" | "draw" | "over" | "under";
  price: number;
  line: number | null;
}

export async function getLatestOdds(): Promise<OddsSnapshot[]> {
  try {
    let content: string;

    if (isDev) {
      // In development, read from local file for fresh data
      const localPath = join(process.cwd(), "..", "data", "latest", "latest.csv");
      content = readFileSync(localPath, "utf-8");
    } else {
      // In production, fetch from GitHub
      const response = await fetch(GITHUB_RAW_URL, {
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (!response.ok) {
        console.error("Failed to fetch CSV:", response.status);
        return [];
      }

      content = await response.text();
    }
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
        outcome: values[7] as "home" | "away" | "draw" | "over" | "under",
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

// Get the most recent update timestamp from the data
export async function getLastUpdated(): Promise<string | null> {
  const odds = await getLatestOdds();
  if (odds.length === 0) return null;

  // Find the most recent lastUpdated timestamp
  let mostRecent: Date | null = null;
  for (const snapshot of odds) {
    if (snapshot.lastUpdated) {
      try {
        const date = new Date(snapshot.lastUpdated);
        // Validate the date is valid
        if (!isNaN(date.getTime()) && (!mostRecent || date > mostRecent)) {
          mostRecent = date;
        }
      } catch {
        // Skip invalid dates
      }
    }
  }

  if (!mostRecent) return null;

  try {
    return mostRecent.toISOString();
  } catch {
    return null;
  }
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

  // Filter to only upcoming games (exclude games that have already started and stub data)
  const now = new Date();

  const filteredGames = Array.from(gamesMap.values()).filter((game) => {
    // Exclude stub/test data
    if (game.eventId.includes("stub")) return false;

    const gameTime = new Date(game.eventStartTime);
    // Only show games that haven't started yet
    return gameTime > now;
  });

  // Sort by event start time
  return filteredGames.sort(
    (a, b) =>
      new Date(a.eventStartTime).getTime() -
      new Date(b.eventStartTime).getTime()
  );
}

// Fetch historical odds data
async function getHistoricalOdds(): Promise<HistoricalOdds[]> {
  try {
    let content: string;

    if (isDev) {
      const localPath = join(process.cwd(), "..", "data", "history", "odds_history.csv");
      content = readFileSync(localPath, "utf-8");
    } else {
      const response = await fetch(GITHUB_HISTORY_URL, {
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        console.error("Failed to fetch history CSV:", response.status);
        return [];
      }

      content = await response.text();
    }

    const lines = content.trim().split("\n");
    if (lines.length < 2) return [];

    // Parse: timestamp_utc,book,sport,event_id,event_start_time,home_team,away_team,market_type,outcome,price,line
    return lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      return {
        timestamp: values[0],
        book: values[1],
        sport: values[2],
        eventId: values[3],
        eventStartTime: values[4],
        homeTeam: values[5],
        awayTeam: values[6],
        marketType: values[7] as "moneyline" | "spread" | "total",
        outcome: values[8] as "home" | "away" | "draw" | "over" | "under",
        price: parseInt(values[9]) || 0,
        line: values[10] ? parseFloat(values[10]) : null,
      };
    });
  } catch (error) {
    console.error("Error fetching odds_history.csv:", error);
    return [];
  }
}

export async function getLineMovements(): Promise<LineMovement[]> {
  const historicalOdds = await getHistoricalOdds();

  if (historicalOdds.length === 0) {
    return [];
  }

  // Group by event+book+market+outcome, track earliest and latest prices
  const priceHistory = new Map<string, {
    earliest: HistoricalOdds;
    latest: HistoricalOdds;
  }>();

  for (const odds of historicalOdds) {
    const key = `${odds.eventId}|${odds.book}|${odds.marketType}|${odds.outcome}`;

    if (!priceHistory.has(key)) {
      priceHistory.set(key, { earliest: odds, latest: odds });
    } else {
      const existing = priceHistory.get(key)!;
      // Update earliest if this timestamp is older
      if (odds.timestamp < existing.earliest.timestamp) {
        existing.earliest = odds;
      }
      // Update latest if this timestamp is newer
      if (odds.timestamp > existing.latest.timestamp) {
        existing.latest = odds;
      }
    }
  }

  // Calculate movements comparing earliest to latest
  const now = new Date();
  const movements: LineMovement[] = [];

  for (const [, { earliest, latest }] of priceHistory) {
    // Only show future games
    const gameTime = new Date(latest.eventStartTime);
    if (gameTime < now) continue;

    // Exclude stub data
    if (latest.eventId.includes("stub")) continue;

    const priceMovement = latest.price - earliest.price;
    const lineMovement = (latest.line !== null && earliest.line !== null)
      ? latest.line - earliest.line
      : null;

    // Only include if there's meaningful movement
    const hasLineMove = lineMovement !== null && Math.abs(lineMovement) >= 0.5;
    const hasPriceMove = Math.abs(priceMovement) >= 5;

    if (!hasLineMove && !hasPriceMove) continue;

    movements.push({
      eventId: latest.eventId,
      sport: latest.sport,
      homeTeam: latest.homeTeam,
      awayTeam: latest.awayTeam,
      eventStartTime: latest.eventStartTime,
      marketType: latest.marketType,
      outcome: latest.outcome,
      book: latest.book,
      openingPrice: earliest.price,
      currentPrice: latest.price,
      priceMovement,
      openingLine: earliest.line,
      currentLine: latest.line,
      lineMovement,
      lastUpdated: latest.timestamp,
    });
  }

  // Sort by absolute movement (most significant first)
  return movements.sort((a, b) => {
    const aMove = Math.abs(a.lineMovement || 0) * 10 + Math.abs(a.priceMovement);
    const bMove = Math.abs(b.lineMovement || 0) * 10 + Math.abs(b.priceMovement);
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
