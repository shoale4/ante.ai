export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  sourceIcon: string;
  publishedAt: string;
  sport: "NFL" | "NBA" | "MLB" | "NHL" | "General";
  teams: string[]; // Affected teams
  sentiment: "positive" | "negative" | "neutral";
  isBreaking: boolean;
  category: "injury" | "trade" | "lineup" | "weather" | "general";
}

// RSS Feed URLs for sports news
const NEWS_SOURCES = {
  espn_nfl: "https://www.espn.com/espn/rss/nfl/news",
  espn_nba: "https://www.espn.com/espn/rss/nba/news",
  bleacher_nfl: "https://bleacherreport.com/articles/feed?tag_id=16",
  bleacher_nba: "https://bleacherreport.com/articles/feed?tag_id=19",
};

// Team name variations for matching
const NFL_TEAM_KEYWORDS: Record<string, string[]> = {
  "Arizona Cardinals": ["cardinals", "arizona", "kyler murray"],
  "Atlanta Falcons": ["falcons", "atlanta"],
  "Baltimore Ravens": ["ravens", "baltimore", "lamar jackson"],
  "Buffalo Bills": ["bills", "buffalo", "josh allen"],
  "Carolina Panthers": ["panthers", "carolina"],
  "Chicago Bears": ["bears", "chicago"],
  "Cincinnati Bengals": ["bengals", "cincinnati", "joe burrow"],
  "Cleveland Browns": ["browns", "cleveland"],
  "Dallas Cowboys": ["cowboys", "dallas", "dak prescott"],
  "Denver Broncos": ["broncos", "denver"],
  "Detroit Lions": ["lions", "detroit", "jared goff"],
  "Green Bay Packers": ["packers", "green bay", "jordan love"],
  "Houston Texans": ["texans", "houston", "c.j. stroud"],
  "Indianapolis Colts": ["colts", "indianapolis"],
  "Jacksonville Jaguars": ["jaguars", "jacksonville", "trevor lawrence"],
  "Kansas City Chiefs": ["chiefs", "kansas city", "patrick mahomes"],
  "Las Vegas Raiders": ["raiders", "las vegas"],
  "Los Angeles Chargers": ["chargers", "justin herbert"],
  "Los Angeles Rams": ["rams", "matthew stafford"],
  "Miami Dolphins": ["dolphins", "miami", "tua tagovailoa"],
  "Minnesota Vikings": ["vikings", "minnesota"],
  "New England Patriots": ["patriots", "new england"],
  "New Orleans Saints": ["saints", "new orleans"],
  "New York Giants": ["giants", "daniel jones"],
  "New York Jets": ["jets", "aaron rodgers"],
  "Philadelphia Eagles": ["eagles", "philadelphia", "jalen hurts"],
  "Pittsburgh Steelers": ["steelers", "pittsburgh"],
  "San Francisco 49ers": ["49ers", "san francisco", "brock purdy"],
  "Seattle Seahawks": ["seahawks", "seattle", "geno smith"],
  "Tampa Bay Buccaneers": ["buccaneers", "tampa bay", "baker mayfield"],
  "Tennessee Titans": ["titans", "tennessee"],
  "Washington Commanders": ["commanders", "washington"],
};

const NBA_TEAM_KEYWORDS: Record<string, string[]> = {
  "Atlanta Hawks": ["hawks", "trae young"],
  "Boston Celtics": ["celtics", "boston", "jayson tatum"],
  "Brooklyn Nets": ["nets", "brooklyn"],
  "Charlotte Hornets": ["hornets", "charlotte"],
  "Chicago Bulls": ["bulls", "chicago"],
  "Cleveland Cavaliers": ["cavaliers", "cleveland", "cavs"],
  "Dallas Mavericks": ["mavericks", "dallas", "mavs", "luka doncic"],
  "Denver Nuggets": ["nuggets", "denver", "nikola jokic"],
  "Detroit Pistons": ["pistons", "detroit"],
  "Golden State Warriors": ["warriors", "golden state", "stephen curry"],
  "Houston Rockets": ["rockets", "houston"],
  "Indiana Pacers": ["pacers", "indiana"],
  "LA Clippers": ["clippers"],
  "Los Angeles Lakers": ["lakers", "lebron james"],
  "Memphis Grizzlies": ["grizzlies", "memphis", "ja morant"],
  "Miami Heat": ["heat", "miami", "jimmy butler"],
  "Milwaukee Bucks": ["bucks", "milwaukee", "giannis"],
  "Minnesota Timberwolves": ["timberwolves", "minnesota", "wolves", "anthony edwards"],
  "New Orleans Pelicans": ["pelicans", "new orleans", "zion"],
  "New York Knicks": ["knicks", "new york"],
  "Oklahoma City Thunder": ["thunder", "oklahoma city", "shai gilgeous"],
  "Orlando Magic": ["magic", "orlando"],
  "Philadelphia 76ers": ["76ers", "sixers", "philadelphia", "joel embiid"],
  "Phoenix Suns": ["suns", "phoenix", "kevin durant"],
  "Portland Trail Blazers": ["blazers", "portland"],
  "Sacramento Kings": ["kings", "sacramento"],
  "San Antonio Spurs": ["spurs", "san antonio", "victor wembanyama"],
  "Toronto Raptors": ["raptors", "toronto"],
  "Utah Jazz": ["jazz", "utah"],
  "Washington Wizards": ["wizards", "washington"],
};

// Keywords that indicate breaking/important news
const BREAKING_KEYWORDS = [
  "breaking",
  "just in",
  "report",
  "sources",
  "out for",
  "ruled out",
  "will not play",
  "traded",
  "signs",
  "released",
  "injured",
  "surgery",
  "tear",
  "fracture",
];

const INJURY_KEYWORDS = [
  "injury",
  "injured",
  "out",
  "questionable",
  "doubtful",
  "ruled out",
  "surgery",
  "tear",
  "sprain",
  "strain",
  "concussion",
  "hamstring",
  "ankle",
  "knee",
  "shoulder",
];

const NEGATIVE_KEYWORDS = [
  "out",
  "miss",
  "injury",
  "injured",
  "surgery",
  "tear",
  "ruled out",
  "doubtful",
  "suspended",
  "released",
  "cut",
];

const POSITIVE_KEYWORDS = [
  "return",
  "returns",
  "cleared",
  "activated",
  "signs",
  "extension",
  "deal",
  "healthy",
  "practice",
];

export function parseNewsItem(
  title: string,
  summary: string,
  url: string,
  source: string,
  publishedAt: string
): NewsItem {
  const lowerTitle = title.toLowerCase();
  const lowerSummary = summary.toLowerCase();
  const combined = `${lowerTitle} ${lowerSummary}`;

  // Detect sport and teams
  let sport: NewsItem["sport"] = "General";
  const teams: string[] = [];

  // Check NFL teams
  for (const [team, keywords] of Object.entries(NFL_TEAM_KEYWORDS)) {
    if (keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
      sport = "NFL";
      teams.push(team);
    }
  }

  // Check NBA teams
  for (const [team, keywords] of Object.entries(NBA_TEAM_KEYWORDS)) {
    if (keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
      sport = "NBA";
      teams.push(team);
    }
  }

  // Detect if breaking news
  const isBreaking = BREAKING_KEYWORDS.some((kw) => combined.includes(kw));

  // Detect category
  let category: NewsItem["category"] = "general";
  if (INJURY_KEYWORDS.some((kw) => combined.includes(kw))) {
    category = "injury";
  } else if (combined.includes("trade") || combined.includes("traded")) {
    category = "trade";
  } else if (combined.includes("lineup") || combined.includes("starting")) {
    category = "lineup";
  }

  // Detect sentiment
  let sentiment: NewsItem["sentiment"] = "neutral";
  const negCount = NEGATIVE_KEYWORDS.filter((kw) => combined.includes(kw)).length;
  const posCount = POSITIVE_KEYWORDS.filter((kw) => combined.includes(kw)).length;

  if (negCount > posCount) {
    sentiment = "negative";
  } else if (posCount > negCount) {
    sentiment = "positive";
  }

  // Source icons
  const sourceIcons: Record<string, string> = {
    espn: "📺",
    bleacher: "📰",
    yahoo: "🟣",
    twitter: "𝕏",
    default: "📢",
  };

  const sourceIcon =
    Object.entries(sourceIcons).find(([key]) =>
      source.toLowerCase().includes(key)
    )?.[1] || sourceIcons.default;

  return {
    id: Buffer.from(url).toString("base64").slice(0, 16),
    title,
    summary: summary.slice(0, 200) + (summary.length > 200 ? "..." : ""),
    url,
    source,
    sourceIcon,
    publishedAt,
    sport,
    teams,
    sentiment,
    isBreaking,
    category,
  };
}

// Fetch news from RSS feeds (server-side only)
export async function fetchNewsFromRSS(): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  // This would be called from an API route or server action
  // For now, return mock data for the UI

  return allNews;
}

// Get mock news for development/demo
export function getMockNews(): NewsItem[] {
  return [
    {
      id: "1",
      title: "Patrick Mahomes questionable with ankle injury",
      summary:
        "Chiefs QB Patrick Mahomes is listed as questionable for Sunday's game against the Raiders after tweaking his ankle in practice.",
      url: "https://espn.com/nfl/story",
      source: "ESPN",
      sourceIcon: "📺",
      publishedAt: new Date().toISOString(),
      sport: "NFL",
      teams: ["Kansas City Chiefs"],
      sentiment: "negative",
      isBreaking: true,
      category: "injury",
    },
    {
      id: "2",
      title: "Joel Embiid returns to practice, expected to play Friday",
      summary:
        "76ers star Joel Embiid participated in full practice and is expected to return against the Celtics on Friday night.",
      url: "https://espn.com/nba/story",
      source: "ESPN",
      sourceIcon: "📺",
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      sport: "NBA",
      teams: ["Philadelphia 76ers"],
      sentiment: "positive",
      isBreaking: false,
      category: "injury",
    },
    {
      id: "3",
      title: "Bills vs Dolphins moved due to weather concerns",
      summary:
        "Sunday's Bills-Dolphins game has been moved to Monday night due to expected heavy snow in Buffalo.",
      url: "https://bleacherreport.com/articles",
      source: "Bleacher Report",
      sourceIcon: "📰",
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      sport: "NFL",
      teams: ["Buffalo Bills", "Miami Dolphins"],
      sentiment: "neutral",
      isBreaking: true,
      category: "weather",
    },
  ];
}
