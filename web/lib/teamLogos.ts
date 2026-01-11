// Team name to ESPN abbreviation mapping
const NFL_TEAMS: Record<string, string> = {
  "Arizona Cardinals": "ari",
  "Atlanta Falcons": "atl",
  "Baltimore Ravens": "bal",
  "Buffalo Bills": "buf",
  "Carolina Panthers": "car",
  "Chicago Bears": "chi",
  "Cincinnati Bengals": "cin",
  "Cleveland Browns": "cle",
  "Dallas Cowboys": "dal",
  "Denver Broncos": "den",
  "Detroit Lions": "det",
  "Green Bay Packers": "gb",
  "Houston Texans": "hou",
  "Indianapolis Colts": "ind",
  "Jacksonville Jaguars": "jax",
  "Kansas City Chiefs": "kc",
  "Las Vegas Raiders": "lv",
  "Los Angeles Chargers": "lac",
  "Los Angeles Rams": "lar",
  "Miami Dolphins": "mia",
  "Minnesota Vikings": "min",
  "New England Patriots": "ne",
  "New Orleans Saints": "no",
  "New York Giants": "nyg",
  "New York Jets": "nyj",
  "Philadelphia Eagles": "phi",
  "Pittsburgh Steelers": "pit",
  "San Francisco 49ers": "sf",
  "Seattle Seahawks": "sea",
  "Tampa Bay Buccaneers": "tb",
  "Tennessee Titans": "ten",
  "Washington Commanders": "wsh",
};

const NBA_TEAMS: Record<string, string> = {
  "Atlanta Hawks": "atl",
  "Boston Celtics": "bos",
  "Brooklyn Nets": "bkn",
  "Charlotte Hornets": "cha",
  "Chicago Bulls": "chi",
  "Cleveland Cavaliers": "cle",
  "Dallas Mavericks": "dal",
  "Denver Nuggets": "den",
  "Detroit Pistons": "det",
  "Golden State Warriors": "gs",
  "Houston Rockets": "hou",
  "Indiana Pacers": "ind",
  "Los Angeles Clippers": "lac",
  "Los Angeles Lakers": "lal",
  "LA Clippers": "lac",
  "LA Lakers": "lal",
  "Memphis Grizzlies": "mem",
  "Miami Heat": "mia",
  "Milwaukee Bucks": "mil",
  "Minnesota Timberwolves": "min",
  "New Orleans Pelicans": "no",
  "New York Knicks": "ny",
  "Oklahoma City Thunder": "okc",
  "Orlando Magic": "orl",
  "Philadelphia 76ers": "phi",
  "Phoenix Suns": "phx",
  "Portland Trail Blazers": "por",
  "Sacramento Kings": "sac",
  "San Antonio Spurs": "sa",
  "Toronto Raptors": "tor",
  "Utah Jazz": "utah",
  "Washington Wizards": "wsh",
};

const MLB_TEAMS: Record<string, string> = {
  "Arizona Diamondbacks": "ari",
  "Atlanta Braves": "atl",
  "Baltimore Orioles": "bal",
  "Boston Red Sox": "bos",
  "Chicago Cubs": "chc",
  "Chicago White Sox": "chw",
  "Cincinnati Reds": "cin",
  "Cleveland Guardians": "cle",
  "Colorado Rockies": "col",
  "Detroit Tigers": "det",
  "Houston Astros": "hou",
  "Kansas City Royals": "kc",
  "Los Angeles Angels": "laa",
  "Los Angeles Dodgers": "lad",
  "Miami Marlins": "mia",
  "Milwaukee Brewers": "mil",
  "Minnesota Twins": "min",
  "New York Mets": "nym",
  "New York Yankees": "nyy",
  "Oakland Athletics": "oak",
  "Philadelphia Phillies": "phi",
  "Pittsburgh Pirates": "pit",
  "San Diego Padres": "sd",
  "San Francisco Giants": "sf",
  "Seattle Mariners": "sea",
  "St. Louis Cardinals": "stl",
  "Tampa Bay Rays": "tb",
  "Texas Rangers": "tex",
  "Toronto Blue Jays": "tor",
  "Washington Nationals": "wsh",
};

const NHL_TEAMS: Record<string, string> = {
  "Anaheim Ducks": "ana",
  "Arizona Coyotes": "ari",
  "Boston Bruins": "bos",
  "Buffalo Sabres": "buf",
  "Calgary Flames": "cgy",
  "Carolina Hurricanes": "car",
  "Chicago Blackhawks": "chi",
  "Colorado Avalanche": "col",
  "Columbus Blue Jackets": "cbj",
  "Dallas Stars": "dal",
  "Detroit Red Wings": "det",
  "Edmonton Oilers": "edm",
  "Florida Panthers": "fla",
  "Los Angeles Kings": "la",
  "Minnesota Wild": "min",
  "Montreal Canadiens": "mtl",
  "Nashville Predators": "nsh",
  "New Jersey Devils": "nj",
  "New York Islanders": "nyi",
  "New York Rangers": "nyr",
  "Ottawa Senators": "ott",
  "Philadelphia Flyers": "phi",
  "Pittsburgh Penguins": "pit",
  "San Jose Sharks": "sj",
  "Seattle Kraken": "sea",
  "St. Louis Blues": "stl",
  "Tampa Bay Lightning": "tb",
  "Toronto Maple Leafs": "tor",
  "Utah Hockey Club": "uta",
  "Vancouver Canucks": "van",
  "Vegas Golden Knights": "vgk",
  "Washington Capitals": "wsh",
  "Winnipeg Jets": "wpg",
};

// Major soccer teams (EPL, La Liga, Champions League)
const SOCCER_TEAMS: Record<string, string> = {
  // EPL
  "Arsenal": "ars",
  "Aston Villa": "avl",
  "Bournemouth": "bou",
  "Brentford": "bre",
  "Brighton": "bha",
  "Brighton & Hove Albion": "bha",
  "Chelsea": "che",
  "Crystal Palace": "cry",
  "Everton": "eve",
  "Fulham": "ful",
  "Ipswich": "ips",
  "Ipswich Town": "ips",
  "Leicester": "lei",
  "Leicester City": "lei",
  "Liverpool": "liv",
  "Manchester City": "mci",
  "Manchester United": "mun",
  "Newcastle": "new",
  "Newcastle United": "new",
  "Nottingham Forest": "nfo",
  "Southampton": "sou",
  "Tottenham": "tot",
  "Tottenham Hotspur": "tot",
  "West Ham": "whu",
  "West Ham United": "whu",
  "Wolverhampton": "wol",
  "Wolves": "wol",
  // La Liga
  "Real Madrid": "rma",
  "Barcelona": "bar",
  "Atletico Madrid": "atm",
  "Sevilla": "sev",
  "Valencia": "val",
  "Villarreal": "vil",
  "Athletic Bilbao": "ath",
  "Real Sociedad": "rso",
  "Real Betis": "bet",
  // Other major clubs
  "Bayern Munich": "bay",
  "Borussia Dortmund": "bvb",
  "Paris Saint-Germain": "psg",
  "PSG": "psg",
  "Juventus": "juv",
  "Inter Milan": "int",
  "AC Milan": "mil",
  "Napoli": "nap",
  "Roma": "rom",
  "AS Roma": "rom",
};

// MMA fighters don't have team logos - they'll use initials
const MMA_FIGHTERS: Record<string, string> = {};

type Sport = "NFL" | "NBA" | "NCAAB" | "MLB" | "NHL" | "MMA" | "Soccer";

// NCAAB teams - will be populated as needed
const NCAAB_TEAMS: Record<string, string> = {};

const TEAMS_BY_SPORT: Record<Sport, Record<string, string>> = {
  NFL: NFL_TEAMS,
  NBA: NBA_TEAMS,
  NCAAB: NCAAB_TEAMS,
  MLB: MLB_TEAMS,
  NHL: NHL_TEAMS,
  MMA: MMA_FIGHTERS,
  Soccer: SOCCER_TEAMS,
};

export function getTeamLogo(teamName: string, sport: Sport): string | null {
  const teams = TEAMS_BY_SPORT[sport];
  if (!teams) return null;

  const abbr = teams[teamName];
  if (!abbr) return null;

  // Different URL patterns for different sports
  if (sport === "Soccer") {
    // ESPN's soccer logo URLs are inconsistent/broken for many teams
    // Fall back to initials display instead
    return null;
  }

  if (sport === "MMA") {
    // MMA fighters don't have logos
    return null;
  }

  const sportPath = sport.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/${sportPath}/500/${abbr}.png`;
}

export function getTeamAbbr(teamName: string, sport: Sport): string {
  const teams = TEAMS_BY_SPORT[sport];
  if (!teams) return teamName.charAt(0);
  return teams[teamName]?.toUpperCase() || teamName.charAt(0);
}
