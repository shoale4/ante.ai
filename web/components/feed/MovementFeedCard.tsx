"use client";

import { LineMovement } from "@/lib/types";

interface Props {
  movement: LineMovement;
  compact?: boolean;
}

const BOOK_SHORT: Record<string, string> = {
  draftkings: "DK",
  fanduel: "FD",
  betmgm: "MGM",
  caesars: "CZR",
  pointsbet: "PB",
  betonline: "BOL",
  bovada: "BOV",
  mybookie: "MyB",
};

export function MovementFeedCard({ movement, compact = false }: Props) {
  const isSignificant = Math.abs(movement.priceMovement) >= 15;
  const direction = movement.priceMovement > 0 ? "up" : "down";
  const timeAgo = getTimeAgo(movement.lastUpdated);

  const formatLine = (line: number | null) => {
    if (line === null) return "";
    if (movement.marketType === "spread") {
      return line > 0 ? `+${line}` : `${line}`;
    }
    if (movement.marketType === "total") {
      return `${line}`;
    }
    return "";
  };

  const formatPrice = (price: number) => {
    return price > 0 ? `+${price}` : `${price}`;
  };

  const marketLabel =
    movement.marketType === "moneyline"
      ? "ML"
      : movement.marketType === "spread"
      ? "SPR"
      : "O/U";

  // Smart team name shortening
  const awayShort = shortenTeamName(movement.awayTeam, movement.sport);
  const homeShort = shortenTeamName(movement.homeTeam, movement.sport);

  const getSideShort = () => {
    if (movement.outcome === "home") return homeShort;
    if (movement.outcome === "away") return awayShort;
    if (movement.outcome === "over") return "Over";
    if (movement.outcome === "under") return "Under";
    return movement.outcome;
  };

  const bookShort = BOOK_SHORT[movement.book.toLowerCase()] || movement.book.slice(0, 3).toUpperCase();

  // Compact version for grouped display
  if (compact) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 transition-colors">
        {/* Left: Side, Market, Book */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-medium text-gray-700">{getSideShort()}</span>
          <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{marketLabel}</span>
          <span className="text-[10px] text-gray-400">{bookShort}</span>
        </div>

        {/* Right: Movement */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-gray-400">{formatPrice(movement.openingPrice)}</span>
            <svg
              className={`w-3 h-3 ${direction === "up" ? "text-green-500" : "text-red-500"} ${direction === "down" ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className={`font-semibold ${direction === "up" ? "text-green-600" : "text-red-600"}`}>
              {formatPrice(movement.currentPrice)}
            </span>
          </div>
          <div
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold tabular-nums ${
              direction === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            }`}
          >
            {direction === "up" ? "+" : ""}{movement.priceMovement}
          </div>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div
      className={`bg-white rounded-xl border p-3 cursor-pointer active:scale-[0.99] transition-all ${
        isSignificant ? "border-orange-200 ring-1 ring-orange-100" : "border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">📊</span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
              isSignificant
                ? "bg-orange-50 text-orange-600"
                : "bg-purple-50 text-purple-600"
            }`}
          >
            {isSignificant ? "Sharp" : "Move"}
          </span>
          <span className="text-[10px] text-gray-400">{movement.sport}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400">{timeAgo}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-between">
        {/* Game Info */}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-gray-900 truncate">
            {awayShort} @ {homeShort}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] font-medium text-gray-600">{getSideShort()}</span>
            <span className="text-[10px] text-gray-400 bg-gray-50 px-1 py-0.5 rounded">{marketLabel}</span>
            <span className="text-[10px] text-gray-400">{bookShort}</span>
          </div>
        </div>

        {/* Movement Visual */}
        <div className="flex items-center gap-2">
          {/* Old → New */}
          <div className="flex items-center gap-1.5">
            {/* Old Values */}
            <div className="text-right">
              {movement.openingLine !== null && (
                <div className="text-[10px] text-gray-400">{formatLine(movement.openingLine)}</div>
              )}
              <div className="text-[11px] text-gray-400">{formatPrice(movement.openingPrice)}</div>
            </div>

            {/* Arrow */}
            <div
              className={`flex items-center justify-center w-5 h-5 rounded-full ${
                direction === "up" ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"
              }`}
            >
              <svg
                className={`w-3 h-3 ${direction === "down" ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>

            {/* New Values */}
            <div className="text-right">
              {movement.currentLine !== null && (
                <div className="text-[10px] font-medium text-gray-900">{formatLine(movement.currentLine)}</div>
              )}
              <div
                className={`text-[11px] font-bold ${direction === "up" ? "text-green-600" : "text-red-600"}`}
              >
                {formatPrice(movement.currentPrice)}
              </div>
            </div>
          </div>

          {/* Movement Badge */}
          <div
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums ${
              direction === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            }`}
          >
            {direction === "up" ? "+" : ""}
            {movement.priceMovement}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  if (!dateString) return "";

  const now = new Date();
  const date = new Date(dateString);

  // Handle invalid dates
  if (isNaN(date.getTime())) return "";

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

// Smart team name shortening - handles soccer teams properly
function shortenTeamName(team: string, sport: string): string {
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
    "Inter Milan": "Inter",
    "AC Milan": "Milan",
    "AS Roma": "Roma",
    "Juventus FC": "Juventus",
    "LA Galaxy": "Galaxy",
    "New York Red Bulls": "Red Bulls",
    "New York City FC": "NYCFC",
    "Atlanta United": "Atlanta",
    "DC United": "DC United",
    "Minnesota United": "Minnesota",
    "Seattle Sounders": "Seattle",
    "Portland Timbers": "Portland",
    "Sporting Kansas City": "SKC",
  };

  if (sport === "Soccer" || sport === "soccer") {
    if (soccerAbbreviations[team]) {
      return soccerAbbreviations[team];
    }
    if (team.startsWith("FC ")) return team.slice(3);
    if (team.endsWith(" FC")) return team.slice(0, -3);

    const genericLastWords = ["United", "City", "FC", "SC", "CF", "Athletic", "Sporting"];
    const words = team.split(" ");
    const lastWord = words[words.length - 1];

    if (genericLastWords.includes(lastWord) && words.length > 1) {
      if (words[0].length > 6) {
        return words[0].slice(0, 3) + " " + lastWord;
      }
      return words[0] + " " + lastWord;
    }
    return words[0];
  }

  const words = team.split(" ");
  return words[words.length - 1] || team;
}
