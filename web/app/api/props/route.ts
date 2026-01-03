import { NextRequest, NextResponse } from "next/server";

// Player props from GitHub
const GITHUB_PROPS_URL =
  "https://raw.githubusercontent.com/shoale4/ante.ai/main/data/latest/props_latest.csv";

interface RawPropData {
  timestamp_utc: string;
  book: string;
  sport: string;
  event_id: string;
  event_start_time: string;
  home_team: string;
  away_team: string;
  player_name: string;
  prop_type: string;
  outcome: string;
  line: number;
  price: number;
}

interface PlayerProp {
  eventId: string;
  playerName: string;
  propType: string;
  line: number;
  books: {
    book: string;
    overPrice: number;
    underPrice: number;
  }[];
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

function formatPropType(propType: string): string {
  const mapping: Record<string, string> = {
    player_points: "Points",
    player_rebounds: "Rebounds",
    player_assists: "Assists",
    player_threes: "3-Pointers",
    player_pass_yds: "Pass Yards",
    player_pass_tds: "Pass TDs",
    player_rush_yds: "Rush Yards",
    player_receptions: "Receptions",
    player_reception_yds: "Receiving Yards",
  };
  return mapping[propType] || propType.replace("player_", "").replace(/_/g, " ");
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventId = searchParams.get("eventId");

  try {
    const response = await fetch(GITHUB_PROPS_URL, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      // No props data yet - return empty
      return NextResponse.json({ data: [], meta: {} });
    }

    const content = await response.text();
    const lines = content.trim().split("\n");

    if (lines.length < 2) {
      return NextResponse.json({ data: [], meta: {} });
    }

    // Parse CSV - Schema: timestamp_utc,book,sport,event_id,event_start_time,home_team,away_team,player_name,prop_type,outcome,line,price
    const allData: RawPropData[] = lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      return {
        timestamp_utc: values[0],
        book: values[1],
        sport: values[2],
        event_id: values[3],
        event_start_time: values[4],
        home_team: values[5],
        away_team: values[6],
        player_name: values[7],
        prop_type: values[8],
        outcome: values[9],
        line: parseFloat(values[10]) || 0,
        price: parseInt(values[11]) || 0,
      };
    });

    // Filter by eventId if provided
    let filtered = eventId
      ? allData.filter((d) => d.event_id === eventId)
      : allData;

    // Group by player + prop type + line to create unified prop objects
    const propMap = new Map<string, PlayerProp>();

    for (const item of filtered) {
      const key = `${item.event_id}_${item.player_name}_${item.prop_type}_${item.line}`;

      if (!propMap.has(key)) {
        propMap.set(key, {
          eventId: item.event_id,
          playerName: item.player_name,
          propType: item.prop_type,
          line: item.line,
          books: [],
        });
      }

      const prop = propMap.get(key)!;
      let bookEntry = prop.books.find((b) => b.book === item.book);

      if (!bookEntry) {
        bookEntry = { book: item.book, overPrice: 0, underPrice: 0 };
        prop.books.push(bookEntry);
      }

      if (item.outcome === "over") {
        bookEntry.overPrice = item.price;
      } else if (item.outcome === "under") {
        bookEntry.underPrice = item.price;
      }
    }

    const props = Array.from(propMap.values());

    // Sort by player name, then prop type
    props.sort((a, b) => {
      const nameCompare = a.playerName.localeCompare(b.playerName);
      if (nameCompare !== 0) return nameCompare;
      return a.propType.localeCompare(b.propType);
    });

    // Get unique players and prop types for filtering
    const players = [...new Set(props.map((p) => p.playerName))];
    const propTypes = [...new Set(props.map((p) => p.propType))];

    return NextResponse.json({
      data: props,
      meta: {
        eventId,
        totalProps: props.length,
        players,
        propTypes: propTypes.map((t) => ({
          key: t,
          label: formatPropType(t),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching player props:", error);
    // Return empty data instead of error - props may not be available yet
    return NextResponse.json({ data: [], meta: {} });
  }
}
