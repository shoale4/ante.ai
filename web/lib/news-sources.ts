import { NewsItem } from "./news";
import { fetchAllESPNNews } from "./espn-news";

type SportType = "NFL" | "NBA" | "NCAAB" | "WNBA" | "MLB" | "NHL" | "MMA" | "Soccer" | "General";

// CBS Sports RSS endpoints
const CBS_RSS_FEEDS: Record<string, string> = {
  NFL: "https://www.cbssports.com/rss/headlines/nfl/",
  NBA: "https://www.cbssports.com/rss/headlines/nba/",
  NCAAB: "https://www.cbssports.com/rss/headlines/college-basketball/",
  MLB: "https://www.cbssports.com/rss/headlines/mlb/",
  NHL: "https://www.cbssports.com/rss/headlines/nhl/",
};

// Yahoo Sports RSS
const YAHOO_RSS_FEEDS: Record<string, string> = {
  NFL: "https://sports.yahoo.com/nfl/rss",
  NBA: "https://sports.yahoo.com/nba/rss",
};


interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  "media:thumbnail"?: { $: { url: string } };
  enclosure?: { $: { url: string } };
}

// Simple RSS XML parser (no external dependencies)
function parseRSSXML(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Match all <item> elements
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const getTagContent = (tag: string): string => {
      // Handle CDATA
      const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
      const cdataMatch = itemXml.match(cdataRegex);
      if (cdataMatch) return cdataMatch[1].trim();

      // Handle regular content
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const tagMatch = itemXml.match(regex);
      return tagMatch ? tagMatch[1].trim() : "";
    };

    const title = getTagContent("title");
    const link = getTagContent("link");
    const description = getTagContent("description");
    const pubDate = getTagContent("pubDate");

    // Extract media thumbnail if present
    const mediaMatch = itemXml.match(/url="([^"]+)"/);
    const imageUrl = mediaMatch ? mediaMatch[1] : undefined;

    if (title && link) {
      items.push({
        title: decodeHTMLEntities(title),
        link,
        description: description ? decodeHTMLEntities(description).slice(0, 200) : undefined,
        pubDate,
        "media:thumbnail": imageUrl ? { $: { url: imageUrl } } : undefined,
      });
    }
  }

  return items;
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, ""); // Strip HTML tags
}

async function fetchRSSFeed(url: string, source: string, sport: SportType): Promise<NewsItem[]> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 600 }, // Cache for 10 minutes
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HedgBot/1.0)",
      },
    });

    if (!response.ok) {
      console.error(`RSS fetch failed for ${source} ${sport}:`, response.status);
      return [];
    }

    const xml = await response.text();
    const items = parseRSSXML(xml);

    return items.slice(0, 5).map((item, index) => {
      const sentiment = detectSentiment(item.title, item.description);
      const category = detectCategory(item.title + " " + (item.description || ""));
      const isBreaking = detectBreaking(item.title);
      const teams = extractTeams(item.title + " " + (item.description || ""), sport);

      return {
        id: `${source.toLowerCase().replace(/\s/g, "-")}-${sport.toLowerCase()}-${index}-${Date.now()}`,
        title: item.title,
        summary: item.description || "",
        url: item.link,
        source,
        sourceIcon: getSourceIcon(source),
        publishedAt: item.pubDate || new Date().toISOString(),
        sport,
        teams,
        category,
        sentiment,
        isBreaking,
        imageUrl: item["media:thumbnail"]?.$?.url,
      };
    });
  } catch (error) {
    console.error(`Error fetching ${source} ${sport} RSS:`, error);
    return [];
  }
}

function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    "ESPN": "E",
    "Bleacher Report": "B",
    "CBS Sports": "C",
    "Yahoo Sports": "Y",
    "Action Network": "A",
    "Barstool Sports": "BS",
    "The Athletic": "TA",
  };
  return icons[source] || source[0];
}

function detectSentiment(title: string, description?: string): "positive" | "negative" | "neutral" {
  const text = (title + " " + (description || "")).toLowerCase();

  const negativeWords = [
    "injury", "injured", "out", "miss", "sidelined", "ruled out",
    "doubtful", "questionable", "surgery", "torn", "loss", "lost",
    "defeat", "struggle", "concern", "suspended", "fine", "fined"
  ];

  const positiveWords = [
    "win", "wins", "victory", "returns", "returning", "cleared",
    "signed", "extended", "career-high", "record", "breakout",
    "dominant", "impressive", "clutch", "comeback", "healthy"
  ];

  const negCount = negativeWords.filter(w => text.includes(w)).length;
  const posCount = positiveWords.filter(w => text.includes(w)).length;

  if (negCount > posCount) return "negative";
  if (posCount > negCount) return "positive";
  return "neutral";
}

function detectCategory(text: string): "injury" | "trade" | "lineup" | "weather" | "general" {
  const lower = text.toLowerCase();

  if (/injury|injured|out for|sidelined|surgery|torn|sprain|strain|concussion/.test(lower)) {
    return "injury";
  }
  if (/trade|traded|signs|signed|free agent|waived|released|acquired|deal/.test(lower)) {
    return "trade";
  }
  if (/starting|lineup|benched|promoted|depth chart/.test(lower)) {
    return "lineup";
  }
  if (/weather|postponed|delayed|snow|rain/.test(lower)) {
    return "weather";
  }
  return "general";
}

function detectBreaking(title: string): boolean {
  const lower = title.toLowerCase();
  return /breaking|just in|report:|sources:|update:|ruled out|traded/.test(lower);
}

function extractTeams(text: string, sport: SportType): string[] {
  const teams: string[] = [];
  const lower = text.toLowerCase();

  const teamLists: Record<SportType, string[]> = {
    NFL: ["Cardinals", "Falcons", "Ravens", "Bills", "Panthers", "Bears", "Bengals", "Browns", "Cowboys", "Broncos", "Lions", "Packers", "Texans", "Colts", "Jaguars", "Chiefs", "Raiders", "Chargers", "Rams", "Dolphins", "Vikings", "Patriots", "Saints", "Giants", "Jets", "Eagles", "Steelers", "49ers", "Seahawks", "Buccaneers", "Titans", "Commanders"],
    NBA: ["Hawks", "Celtics", "Nets", "Hornets", "Bulls", "Cavaliers", "Mavericks", "Nuggets", "Pistons", "Warriors", "Rockets", "Pacers", "Clippers", "Lakers", "Grizzlies", "Heat", "Bucks", "Timberwolves", "Pelicans", "Knicks", "Thunder", "Magic", "76ers", "Suns", "Trail Blazers", "Kings", "Spurs", "Raptors", "Jazz", "Wizards"],
    NCAAB: ["Duke", "North Carolina", "Kentucky", "Kansas", "UCLA", "Gonzaga", "UConn", "Houston", "Purdue", "Tennessee", "Arizona", "Alabama", "Auburn", "Baylor", "Texas", "Michigan", "Michigan State", "Indiana", "Illinois", "Iowa State", "Iowa", "Wisconsin", "Ohio State", "Villanova", "Creighton", "Marquette"],
    WNBA: ["Dream", "Sky", "Sun", "Wings", "Fever", "Aces", "Sparks", "Lynx", "Liberty", "Mercury", "Storm", "Mystics"],
    MLB: ["Diamondbacks", "Braves", "Orioles", "Red Sox", "Cubs", "White Sox", "Reds", "Guardians", "Rockies", "Tigers", "Astros", "Royals", "Angels", "Dodgers", "Marlins", "Brewers", "Twins", "Mets", "Yankees", "Athletics", "Phillies", "Pirates", "Padres", "Giants", "Mariners", "Cardinals", "Rays", "Rangers", "Blue Jays", "Nationals"],
    NHL: ["Ducks", "Coyotes", "Bruins", "Sabres", "Flames", "Hurricanes", "Blackhawks", "Avalanche", "Blue Jackets", "Stars", "Red Wings", "Oilers", "Panthers", "Kings", "Wild", "Canadiens", "Predators", "Devils", "Islanders", "Rangers", "Senators", "Flyers", "Penguins", "Sharks", "Kraken", "Blues", "Lightning", "Maple Leafs", "Canucks", "Golden Knights", "Capitals", "Jets"],
    MMA: ["UFC", "Jones", "Makhachev", "Adesanya", "Volkanovski", "Edwards", "Strickland"],
    Soccer: ["Arsenal", "Chelsea", "Liverpool", "Man City", "Man United", "Tottenham", "Newcastle", "Real Madrid", "Barcelona", "Bayern", "PSG", "Juventus", "Inter", "Milan"],
    General: [],
  };

  for (const team of teamLists[sport] || []) {
    if (lower.includes(team.toLowerCase())) {
      teams.push(team);
    }
  }

  return teams.slice(0, 2);
}


// Fetch from CBS Sports
async function fetchCBSSportsNews(): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  const sports: SportType[] = ["NFL", "NBA", "NCAAB", "NHL"];

  await Promise.all(
    sports.map(async (sport) => {
      const feed = CBS_RSS_FEEDS[sport];
      if (feed) {
        const news = await fetchRSSFeed(feed, "CBS Sports", sport);
        allNews.push(...news);
      }
    })
  );

  return allNews;
}

// Fetch from Yahoo Sports
async function fetchYahooSportsNews(): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  const sports: SportType[] = ["NFL", "NBA"];

  await Promise.all(
    sports.map(async (sport) => {
      const feed = YAHOO_RSS_FEEDS[sport];
      if (feed) {
        const news = await fetchRSSFeed(feed, "Yahoo Sports", sport);
        allNews.push(...news);
      }
    })
  );

  return allNews;
}

// Main function to fetch all news from all sources
export async function fetchAllNews(): Promise<NewsItem[]> {
  // Note: Yahoo RSS feeds are returning 404, disabled for now
  const [espnNews, cbsNews] = await Promise.all([
    fetchAllESPNNews(),
    fetchCBSSportsNews(),
  ]);

  // Combine all news
  const allNews = [...espnNews, ...cbsNews];

  // Sort by published date (most recent first)
  allNews.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    // Handle invalid dates
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateB - dateA;
  });

  // Deduplicate by similar titles
  const seen = new Set<string>();
  const deduped = allNews.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped;
}
