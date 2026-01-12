import { NewsItem } from "./news";

const ESPN_API_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const ESPN_NOW_BASE = "https://now.core.api.espn.com/v1/sports/news";

interface ESPNNewsArticle {
  headline: string;
  description?: string;
  published: string;
  links: {
    web: {
      href: string;
    };
  };
  categories?: Array<{
    description?: string;
    type?: string;
  }>;
  images?: Array<{
    url: string;
  }>;
}

interface ESPNNewsResponse {
  articles: ESPNNewsArticle[];
}

type SportType = "NFL" | "NBA" | "NCAAB" | "MLB" | "NHL" | "MMA" | "Soccer";

const SPORT_ENDPOINTS: Record<SportType, string> = {
  NFL: `${ESPN_API_BASE}/football/nfl/news`,
  NBA: `${ESPN_API_BASE}/basketball/nba/news`,
  NCAAB: `${ESPN_API_BASE}/basketball/mens-college-basketball/news`,
  MLB: `${ESPN_API_BASE}/baseball/mlb/news`,
  NHL: `${ESPN_API_BASE}/hockey/nhl/news`,
  MMA: `${ESPN_API_BASE}/mma/ufc/news`,
  Soccer: `${ESPN_API_BASE}/soccer/eng.1/news`,  // EPL as default
};

export async function fetchESPNNews(sport: SportType): Promise<NewsItem[]> {
  const endpoint = SPORT_ENDPOINTS[sport];

  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`ESPN API error for ${sport}:`, response.status);
      return [];
    }

    const data: ESPNNewsResponse = await response.json();

    return data.articles.map((article, index) => {
      // Detect category from ESPN categories
      const category = detectCategory(article);

      // Detect sentiment from headline
      const sentiment = detectSentiment(article.headline, article.description);

      // Extract team names from headline/description
      const teams = extractTeams(article.headline + " " + (article.description || ""), sport);

      // Check if breaking news
      const isBreaking = isBreakingNews(article);

      return {
        id: `espn-${sport.toLowerCase()}-${index}-${Date.now()}`,
        title: article.headline,
        summary: article.description || "",
        url: article.links.web.href,
        source: "ESPN",
        sourceIcon: "E",
        publishedAt: article.published,
        sport,
        teams,
        category,
        sentiment,
        isBreaking,
        imageUrl: article.images?.[0]?.url,
      };
    });
  } catch (error) {
    console.error(`Error fetching ${sport} news from ESPN:`, error);
    return [];
  }
}

export async function fetchAllESPNNews(): Promise<NewsItem[]> {
  const [nflNews, nbaNews, ncaabNews, mlbNews, nhlNews, mmaNews, soccerNews] = await Promise.all([
    fetchESPNNews("NFL"),
    fetchESPNNews("NBA"),
    fetchESPNNews("NCAAB"),
    fetchESPNNews("MLB"),
    fetchESPNNews("NHL"),
    fetchESPNNews("MMA"),
    fetchESPNNews("Soccer"),
  ]);

  // Combine and sort by published date (most recent first)
  return [...nflNews, ...nbaNews, ...ncaabNews, ...mlbNews, ...nhlNews, ...mmaNews, ...soccerNews].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function detectCategory(
  article: ESPNNewsArticle
): "injury" | "trade" | "lineup" | "weather" | "general" {
  const text = (article.headline + " " + (article.description || "")).toLowerCase();
  const categories = article.categories?.map((c) => c.description?.toLowerCase() || "") || [];

  // Check for injury keywords
  if (
    text.includes("injury") ||
    text.includes("injured") ||
    text.includes("out for") ||
    text.includes("sidelined") ||
    text.includes("questionable") ||
    text.includes("doubtful") ||
    text.includes("ruled out") ||
    text.includes("day-to-day") ||
    text.includes("surgery") ||
    text.includes("concussion") ||
    text.includes("sprain") ||
    text.includes("strain") ||
    text.includes("torn") ||
    text.includes("fracture") ||
    categories.includes("injuries")
  ) {
    return "injury";
  }

  // Check for trade/transaction keywords
  if (
    text.includes("trade") ||
    text.includes("traded") ||
    text.includes("signs") ||
    text.includes("signed") ||
    text.includes("free agent") ||
    text.includes("waived") ||
    text.includes("released") ||
    text.includes("acquired") ||
    text.includes("deal") ||
    categories.includes("transactions")
  ) {
    return "trade";
  }

  // Check for lineup keywords
  if (
    text.includes("starting") ||
    text.includes("lineup") ||
    text.includes("benched") ||
    text.includes("promoted") ||
    text.includes("depth chart")
  ) {
    return "lineup";
  }

  // Check for weather keywords
  if (
    text.includes("weather") ||
    text.includes("postponed") ||
    text.includes("delayed") ||
    text.includes("snow") ||
    text.includes("rain")
  ) {
    return "weather";
  }

  return "general";
}

function detectSentiment(
  headline: string,
  description?: string
): "positive" | "negative" | "neutral" {
  const text = (headline + " " + (description || "")).toLowerCase();

  const negativeWords = [
    "injury", "injured", "out", "miss", "missed", "sidelined",
    "ruled out", "doubtful", "questionable", "surgery", "torn",
    "loss", "lost", "defeat", "struggle", "struggling", "concern",
    "disappointing", "suspended", "fine", "fined", "ejected"
  ];

  const positiveWords = [
    "win", "wins", "victory", "returns", "returning", "cleared",
    "signed", "extended", "career-high", "record", "breakout",
    "dominant", "impressive", "spectacular", "clutch", "comeback"
  ];

  const negativeCount = negativeWords.filter((word) => text.includes(word)).length;
  const positiveCount = positiveWords.filter((word) => text.includes(word)).length;

  if (negativeCount > positiveCount) return "negative";
  if (positiveCount > negativeCount) return "positive";
  return "neutral";
}

function extractTeams(text: string, sport: SportType): string[] {
  const teams: string[] = [];

  const nflTeams = [
    "Cardinals", "Falcons", "Ravens", "Bills", "Panthers", "Bears",
    "Bengals", "Browns", "Cowboys", "Broncos", "Lions", "Packers",
    "Texans", "Colts", "Jaguars", "Chiefs", "Raiders", "Chargers",
    "Rams", "Dolphins", "Vikings", "Patriots", "Saints", "Giants",
    "Jets", "Eagles", "Steelers", "49ers", "Seahawks", "Buccaneers",
    "Titans", "Commanders"
  ];

  const nbaTeams = [
    "Hawks", "Celtics", "Nets", "Hornets", "Bulls", "Cavaliers",
    "Mavericks", "Nuggets", "Pistons", "Warriors", "Rockets", "Pacers",
    "Clippers", "Lakers", "Grizzlies", "Heat", "Bucks", "Timberwolves",
    "Pelicans", "Knicks", "Thunder", "Magic", "76ers", "Suns",
    "Trail Blazers", "Kings", "Spurs", "Raptors", "Jazz", "Wizards"
  ];

  // Top NCAAB teams (power conferences + historically strong programs)
  const ncaabTeams = [
    "Duke", "North Carolina", "Kentucky", "Kansas", "UCLA", "Gonzaga",
    "UConn", "Houston", "Purdue", "Tennessee", "Arizona", "Alabama",
    "Auburn", "Baylor", "Texas", "Michigan", "Michigan State", "Indiana",
    "Illinois", "Iowa State", "Iowa", "Wisconsin", "Ohio State", "Villanova",
    "Creighton", "Marquette", "Xavier", "Butler", "Cincinnati", "Louisville",
    "Florida", "Arkansas", "LSU", "Missouri", "Oklahoma", "Texas Tech",
    "Virginia", "NC State", "Syracuse", "Georgetown", "St. John's",
    "Providence", "Seton Hall", "San Diego State", "Nevada", "BYU",
    "Colorado", "Oregon", "Stanford", "USC", "Arizona State", "Utah"
  ];

  const mlbTeams = [
    "Diamondbacks", "Braves", "Orioles", "Red Sox", "Cubs", "White Sox",
    "Reds", "Guardians", "Rockies", "Tigers", "Astros", "Royals",
    "Angels", "Dodgers", "Marlins", "Brewers", "Twins", "Mets",
    "Yankees", "Athletics", "Phillies", "Pirates", "Padres", "Giants",
    "Mariners", "Cardinals", "Rays", "Rangers", "Blue Jays", "Nationals"
  ];

  const nhlTeams = [
    "Ducks", "Coyotes", "Bruins", "Sabres", "Flames", "Hurricanes",
    "Blackhawks", "Avalanche", "Blue Jackets", "Stars", "Red Wings",
    "Oilers", "Panthers", "Kings", "Wild", "Canadiens", "Predators",
    "Devils", "Islanders", "Rangers", "Senators", "Flyers", "Penguins",
    "Sharks", "Kraken", "Blues", "Lightning", "Maple Leafs", "Canucks",
    "Golden Knights", "Capitals", "Jets"
  ];

  const mmaFighters = [
    "Jones", "Miocic", "Makhachev", "Oliveira", "Adesanya", "Pereira",
    "Volkanovski", "Holloway", "O'Malley", "Sterling", "Edwards",
    "Covington", "Chimaev", "Shavkat", "Pantoja", "Moreno", "Ngannou",
    "Aspinall", "Strickland", "Du Plessis", "Ankalaev"
  ];

  const soccerTeams = [
    "Arsenal", "Chelsea", "Liverpool", "Manchester City", "Manchester United",
    "Tottenham", "Newcastle", "Brighton", "Aston Villa", "West Ham",
    "Crystal Palace", "Fulham", "Brentford", "Everton", "Nottingham Forest",
    "Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla", "Valencia",
    "Bayern Munich", "Dortmund", "PSG", "Juventus", "Inter Milan", "AC Milan"
  ];

  const teamLists: Record<SportType, string[]> = {
    NFL: nflTeams,
    NBA: nbaTeams,
    NCAAB: ncaabTeams,
    MLB: mlbTeams,
    NHL: nhlTeams,
    MMA: mmaFighters,
    Soccer: soccerTeams,
  };

  const teamList = teamLists[sport] || [];

  for (const team of teamList) {
    if (text.toLowerCase().includes(team.toLowerCase())) {
      teams.push(team);
    }
  }

  return teams.slice(0, 2); // Return max 2 teams
}

function isBreakingNews(article: ESPNNewsArticle): boolean {
  const headline = article.headline.toLowerCase();
  const publishedTime = new Date(article.published).getTime();
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;

  // Breaking if published within last hour and contains urgent keywords
  const urgentKeywords = [
    "breaking", "just in", "report:", "sources:", "update:",
    "ruled out", "traded", "signs", "injury update"
  ];

  const isRecent = publishedTime > hourAgo;
  const hasUrgentKeyword = urgentKeywords.some((kw) => headline.includes(kw));

  return isRecent && hasUrgentKeyword;
}
