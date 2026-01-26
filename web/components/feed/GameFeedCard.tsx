"use client";

import { useState } from "react";
import Image from "next/image";
import { GameOdds, Sport } from "@/lib/types";
import { GameWeather } from "@/lib/weather";
import { NewsItem } from "@/lib/news";
import { GameDetailModal } from "../GameDetailModal";
import { WeatherBadge } from "../WeatherBadge";
import { getTeamLogo } from "@/lib/teamLogos";
import { useUserState } from "../StateSelector";
import { isBookAvailable } from "@/lib/state-legality";

const SPORT_EMOJI: Record<Sport, string> = {
  NFL: "🏈",
  NBA: "🏀",
  NCAAB: "🏀",
  WNBA: "🏀",
  MLB: "⚾",
  NHL: "🏒",
  MMA: "🥊",
  Soccer: "⚽",
};

interface Props {
  game: GameOdds;
  weather?: GameWeather;
  relatedNews?: NewsItem[];
  onWaitlist?: () => void;
}

export function GameFeedCard({ game, weather, relatedNews = [], onWaitlist }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { userState } = useUserState();

  // Filter function to check if book is available in user's state
  const filterByState = <T extends { book: string }>(odds: T[]): T[] => {
    if (!userState) return odds;
    return odds.filter(o => isBookAvailable(userState, o.book));
  };

  const gameTime = new Date(game.eventStartTime);
  const isToday = isSameDay(gameTime, new Date());
  const isTomorrow = isSameDay(gameTime, new Date(Date.now() + 24 * 60 * 60 * 1000));

  const dateLabel = isToday ? "Today" : isTomorrow ? "Tmrw" : gameTime.toLocaleDateString("en-US", { weekday: "short" });
  const timeLabel = gameTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  // Get best moneyline odds (filtered by state)
  const homeML = filterByState(game.markets.moneyline.filter((o) => o.outcome === "home"));
  const awayML = filterByState(game.markets.moneyline.filter((o) => o.outcome === "away"));
  const bestHomeML = findBest(homeML);
  const bestAwayML = findBest(awayML);

  // Get spread (filtered by state)
  const homeSpread = filterByState(game.markets.spread.filter((o) => o.outcome === "home"))[0];
  const awaySpread = filterByState(game.markets.spread.filter((o) => o.outcome === "away"))[0];

  // Smart team name shortening
  const awayShort = shortenTeamName(game.awayTeam, game.sport);
  const homeShort = shortenTeamName(game.homeTeam, game.sport);

  // Check for significant line movement (sharp money indicator)
  const sharpMove = detectSharpMove(game);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md p-3 cursor-pointer transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{SPORT_EMOJI[game.sport as Sport] || "🏆"}</span>
            <span className="text-[10px] text-gray-400 font-medium">{game.sport}</span>
            {weather && <WeatherBadge weather={weather} compact />}
            {sharpMove && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                {sharpMove.direction === "up" ? "📈" : "📉"} {sharpMove.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isToday ? "bg-green-50 text-green-600" : "text-gray-400"
            }`}>
              {dateLabel} {timeLabel}
            </span>
            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Matchup Grid */}
        <div className="space-y-1.5">
          {/* Away Team Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <TeamIcon team={game.awayTeam} sport={game.sport as Sport} />
              <span className="text-[13px] font-medium text-gray-900 truncate">{awayShort}</span>
              {awaySpread?.currentLine && (
                <span className="text-[11px] text-gray-400">
                  {awaySpread.currentLine > 0 ? `+${awaySpread.currentLine}` : awaySpread.currentLine}
                </span>
              )}
            </div>
            {bestAwayML && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-gray-400 bg-gray-50 px-1 py-0.5 rounded">
                  {formatBookName(bestAwayML.book)}
                </span>
                <span className={`text-[13px] font-bold tabular-nums ${
                  bestAwayML.price > 0 ? "text-green-600" : "text-gray-900"
                }`}>
                  {bestAwayML.price > 0 ? `+${bestAwayML.price}` : bestAwayML.price}
                </span>
              </div>
            )}
          </div>

          {/* Home Team Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <TeamIcon team={game.homeTeam} sport={game.sport as Sport} />
              <span className="text-[13px] font-medium text-gray-900 truncate">{homeShort}</span>
              {homeSpread?.currentLine && (
                <span className="text-[11px] text-gray-400">
                  {homeSpread.currentLine > 0 ? `+${homeSpread.currentLine}` : homeSpread.currentLine}
                </span>
              )}
            </div>
            {bestHomeML && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-gray-400 bg-gray-50 px-1 py-0.5 rounded">
                  {formatBookName(bestHomeML.book)}
                </span>
                <span className={`text-[13px] font-bold tabular-nums ${
                  bestHomeML.price > 0 ? "text-green-600" : "text-gray-900"
                }`}>
                  {bestHomeML.price > 0 ? `+${bestHomeML.price}` : bestHomeML.price}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Book count */}
        <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            {new Set([...homeML.map(o => o.book), ...awayML.map(o => o.book)]).size} books
          </span>
          <span className="text-[10px] text-purple-500 font-medium">Compare odds →</span>
        </div>
      </div>

      <GameDetailModal game={game} isOpen={isOpen} onClose={() => setIsOpen(false)} onWaitlist={onWaitlist} />
    </>
  );
}

// Team logo with ESPN images and fallback
function TeamIcon({ team, sport }: { team: string; sport: Sport }) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getTeamLogo(team, sport);

  const letter = team.split(" ").pop()?.[0] || team[0];
  const colors = [
    "from-blue-400 to-blue-600",
    "from-red-400 to-red-600",
    "from-green-400 to-green-600",
    "from-purple-400 to-purple-600",
    "from-orange-400 to-orange-600",
    "from-pink-400 to-pink-600",
  ];
  const colorIndex = team.length % colors.length;

  if (!logoUrl || hasError) {
    return (
      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center flex-shrink-0`}>
        <span className="text-[11px] font-bold text-white">{letter}</span>
      </div>
    );
  }

  return (
    <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
      <Image
        src={logoUrl}
        alt={team}
        width={24}
        height={24}
        className="object-contain"
        onError={() => setHasError(true)}
        unoptimized
      />
    </div>
  );
}

function findBest(odds: Array<{ book: string; currentPrice: number }>): { book: string; price: number } | null {
  if (odds.length === 0) return null;
  return odds.reduce(
    (best, current) => current.currentPrice > best.price ? { book: current.book, price: current.currentPrice } : best,
    { book: odds[0].book, price: odds[0].currentPrice }
  );
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

// Format book name for display
function formatBookName(book: string): string {
  const bookNames: Record<string, string> = {
    fanduel: "FD",
    draftkings: "DK",
    betmgm: "MGM",
    caesars: "CZR",
    pointsbet: "PB",
    bet365: "365",
    betonlineag: "BOL",
    bovada: "BOV",
    williamhill: "WH",
    unibet: "UNI",
  };
  return bookNames[book.toLowerCase()] || book.slice(0, 3).toUpperCase();
}

// Detect significant line movement (sharp money indicator)
function detectSharpMove(game: GameOdds): { direction: "up" | "down"; label: string } | null {
  // Check spread movement (significant if moved 1+ points)
  for (const odds of game.markets.spread) {
    if (odds.lineMovement && Math.abs(odds.lineMovement) >= 1) {
      const team = odds.outcome === "home" ? game.homeTeam.split(" ").pop() : game.awayTeam.split(" ").pop();
      return {
        direction: odds.lineMovement > 0 ? "up" : "down",
        label: `${team} ${odds.lineMovement > 0 ? "+" : ""}${odds.lineMovement}`,
      };
    }
  }

  // Check total movement (significant if moved 1+ points)
  for (const odds of game.markets.total) {
    if (odds.lineMovement && Math.abs(odds.lineMovement) >= 1) {
      return {
        direction: odds.lineMovement > 0 ? "up" : "down",
        label: `Total ${odds.lineMovement > 0 ? "+" : ""}${odds.lineMovement}`,
      };
    }
  }

  // Check moneyline movement (significant if moved 15+ cents)
  for (const odds of game.markets.moneyline) {
    if (Math.abs(odds.priceMovement) >= 15) {
      const team = odds.outcome === "home" ? game.homeTeam.split(" ").pop() : game.awayTeam.split(" ").pop();
      return {
        direction: odds.priceMovement > 0 ? "up" : "down",
        label: `${team} ML`,
      };
    }
  }

  return null;
}

// Smart team name shortening - handles soccer teams properly
function shortenTeamName(team: string, sport: string): string {
  // Soccer-specific abbreviations
  const soccerAbbreviations: Record<string, string> = {
    "Manchester United": "Man Utd",
    "Manchester City": "Man City",
    "Newcastle United": "Newcastle",
    "West Ham United": "West Ham",
    "Leeds United": "Leeds",
    "Sheffield United": "Sheffield",
    "Tottenham Hotspur": "Spurs",
    "Wolverhampton Wanderers": "Wolves",
    "Brighton & Hove Albion": "Brighton",
    "Nottingham Forest": "Forest",
    "Crystal Palace": "Palace",
    "AFC Bournemouth": "Bournemouth",
    "Leicester City": "Leicester",
    "Aston Villa": "Villa",
    "Real Madrid": "Real Madrid",
    "Atletico Madrid": "Atletico",
    "Athletic Bilbao": "Bilbao",
    "Real Sociedad": "Sociedad",
    "Real Betis": "Betis",
    "Borussia Dortmund": "Dortmund",
    "Bayern Munich": "Bayern",
    "RB Leipzig": "Leipzig",
    "Bayer Leverkusen": "Leverkusen",
    "Paris Saint-Germain": "PSG",
    "Olympique Marseille": "Marseille",
    "Olympique Lyon": "Lyon",
    "Inter Milan": "Inter",
    "AC Milan": "Milan",
    "AS Roma": "Roma",
    "Juventus FC": "Juventus",
    "SSC Napoli": "Napoli",
    "LA Galaxy": "Galaxy",
    "LAFC": "LAFC",
    "New York Red Bulls": "Red Bulls",
    "New York City FC": "NYCFC",
    "Atlanta United": "Atlanta",
    "DC United": "DC United",
    "Minnesota United": "Minnesota",
    "Philadelphia Union": "Philly",
    "Portland Timbers": "Portland",
    "Seattle Sounders": "Seattle",
    "Sporting Kansas City": "SKC",
    "FC Dallas": "Dallas",
    "Houston Dynamo": "Houston",
    "Orlando City": "Orlando",
    "Chicago Fire": "Chicago",
    "Columbus Crew": "Columbus",
    "CF Montreal": "Montreal",
    "Toronto FC": "Toronto",
    "Vancouver Whitecaps": "Vancouver",
  };

  // Check for exact soccer match first
  if (sport === "Soccer" || sport === "soccer") {
    if (soccerAbbreviations[team]) {
      return soccerAbbreviations[team];
    }

    // Handle FC prefix/suffix teams
    if (team.startsWith("FC ")) {
      return team.slice(3); // "FC Barcelona" -> "Barcelona"
    }
    if (team.endsWith(" FC")) {
      return team.slice(0, -3); // "Chelsea FC" -> "Chelsea"
    }

    // For unknown soccer teams, try to be smart
    // Don't just take last word if it's generic
    const genericLastWords = ["United", "City", "FC", "SC", "CF", "Athletic", "Sporting"];
    const words = team.split(" ");
    const lastWord = words[words.length - 1];

    if (genericLastWords.includes(lastWord) && words.length > 1) {
      // Take first word + last word for context: "Manchester United" -> "Man United"
      if (words[0].length > 6) {
        return words[0].slice(0, 3) + " " + lastWord;
      }
      return words[0] + " " + lastWord;
    }

    // Default: return first meaningful word
    return words[0];
  }

  // For US sports, last word usually works well
  const words = team.split(" ");
  return words[words.length - 1] || team;
}
