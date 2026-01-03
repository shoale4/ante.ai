import { NextRequest, NextResponse } from "next/server";

// Historical odds from GitHub
const GITHUB_HISTORY_URL =
  "https://raw.githubusercontent.com/shoale4/ante.ai/main/data/history/odds_history.csv";

interface HistoricalOdds {
  timestamp: string;
  book: string;
  sport: string;
  eventId: string;
  eventStartTime: string;
  homeTeam: string;
  awayTeam: string;
  marketType: string;
  outcome: string;
  price: number;
  line: number | null;
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventId = searchParams.get("eventId");
  const marketType = searchParams.get("marketType");
  const book = searchParams.get("book");

  if (!eventId) {
    return NextResponse.json(
      { error: "eventId is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(GITHUB_HISTORY_URL, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch historical data" },
        { status: 500 }
      );
    }

    const content = await response.text();
    const lines = content.trim().split("\n");

    if (lines.length < 2) {
      return NextResponse.json({ data: [] });
    }

    // Parse CSV - Schema: timestamp_utc,book,sport,event_id,event_start_time,home_team,away_team,market_type,outcome,price,line
    const allData: HistoricalOdds[] = lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      return {
        timestamp: values[0],
        book: values[1],
        sport: values[2],
        eventId: values[3],
        eventStartTime: values[4],
        homeTeam: values[5],
        awayTeam: values[6],
        marketType: values[7],
        outcome: values[8],
        price: parseInt(values[9]) || 0,
        line: values[10] ? parseFloat(values[10]) : null,
      };
    });

    // Filter by eventId
    let filtered = allData.filter((d) => d.eventId === eventId);

    // Filter by marketType if provided
    if (marketType) {
      filtered = filtered.filter((d) => d.marketType === marketType);
    }

    // Filter by book if provided
    if (book) {
      filtered = filtered.filter((d) => d.book === book);
    }

    // Sort by timestamp
    filtered.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Group by book and outcome for charting
    const groupedData: Record<string, HistoricalOdds[]> = {};
    for (const item of filtered) {
      const key = `${item.book}_${item.outcome}`;
      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(item);
    }

    return NextResponse.json({
      data: filtered,
      grouped: groupedData,
      meta: {
        eventId,
        totalPoints: filtered.length,
        books: [...new Set(filtered.map((d) => d.book))],
        outcomes: [...new Set(filtered.map((d) => d.outcome))],
      },
    });
  } catch (error) {
    console.error("Error fetching historical odds:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
