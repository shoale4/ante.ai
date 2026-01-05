"use client";

import { useMemo, useState } from "react";
import { GameOdds, Sport } from "@/lib/types";
import { findAllArbitrage, ArbitrageOpportunity } from "@/lib/arbitrage";
import { BookLink } from "./BookLink";

const SPORT_EMOJI: Record<Sport, string> = {
  NFL: "🏈",
  NBA: "🏀",
  MLB: "⚾",
  NHL: "🏒",
  MMA: "🥊",
  Soccer: "⚽",
};

interface Props {
  games: GameOdds[];
  globalSportFilter?: Sport | "all";
}

export function ArbitrageFinder({ games, globalSportFilter }: Props) {
  const allOpportunities = useMemo(() => {
    const opps = findAllArbitrage(games);
    return opps.sort((a, b) => b.profit - a.profit);
  }, [games]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [localSport, setLocalSport] = useState<Sport | "all">("all");

  const selectedSport = globalSportFilter ?? localSport;
  const setSelectedSport = globalSportFilter ? () => {} : setLocalSport;

  const availableSports = useMemo(() => {
    const sports = new Set(allOpportunities.map(o => o.sport as Sport));
    return Array.from(sports).sort();
  }, [allOpportunities]);

  const opportunities = useMemo(() => {
    if (selectedSport === "all") return allOpportunities;
    return allOpportunities.filter(o => o.sport === selectedSport);
  }, [allOpportunities, selectedSport]);

  if (allOpportunities.length === 0) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-5 text-center border border-gray-200/50">
        <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center mx-auto mb-2">
          <span className="text-lg">🔍</span>
        </div>
        <p className="text-sm font-medium text-gray-600">No arbitrage found</p>
        <p className="text-xs text-gray-400 mt-0.5">Check back soon</p>
      </div>
    );
  }

  const displayedOpps = showAll ? opportunities : opportunities.slice(0, 8);
  const hasMore = opportunities.length > 8;
  const topProfit = opportunities[0]?.profit || 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
            <span className="text-sm">💰</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">Arbitrage</h3>
            <p className="text-[11px] text-gray-500">Guaranteed profit</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
            +{topProfit.toFixed(1)}% best
          </span>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
            {opportunities.length}
          </span>
        </div>
      </div>

      {/* Sport Filter Pills - only on mobile when no global filter */}
      {availableSports.length > 1 && !globalSportFilter && (
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide sm:hidden">
          <div className="flex gap-1.5 pb-1">
            <button
              onClick={() => setSelectedSport("all")}
              className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                selectedSport === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              All
            </button>
            {availableSports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-1 ${
                  selectedSport === sport
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span className="text-[10px]">{SPORT_EMOJI[sport]}</span>
                <span>{sport}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Arb Cards */}
      <div className="space-y-2">
        {displayedOpps.map((opp, idx) => {
          const id = `${opp.gameId}-${opp.market}-${idx}`;
          const isExpanded = expandedId === id;
          return (
            <ArbCard
              key={id}
              opportunity={opp}
              isExpanded={isExpanded}
              onToggle={() => setExpandedId(isExpanded ? null : id)}
              rank={idx + 1}
            />
          );
        })}
      </div>

      {/* Show More */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-xs font-medium text-gray-500 hover:text-gray-700 active:scale-[0.99] transition-all"
        >
          {showAll ? "Show less" : `+${opportunities.length - 8} more`}
        </button>
      )}
    </div>
  );
}

function ArbCard({
  opportunity,
  isExpanded,
  onToggle,
  rank,
}: {
  opportunity: ArbitrageOpportunity;
  isExpanded: boolean;
  onToggle: () => void;
  rank: number;
}) {
  const isPremium = opportunity.profit >= 5;
  const isGood = opportunity.profit >= 2;

  return (
    <div
      onClick={onToggle}
      className={`rounded-xl border transition-all cursor-pointer active:scale-[0.99] ${
        isExpanded
          ? "bg-white border-gray-200 shadow-sm"
          : "bg-white border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* Main Row */}
      <div className="flex items-center gap-2 p-2.5">
        {/* Sport Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isPremium ? "bg-gradient-to-br from-amber-100 to-orange-100" :
          isGood ? "bg-gradient-to-br from-green-50 to-emerald-100" :
          "bg-gray-50"
        }`}>
          <span className="text-sm">{SPORT_EMOJI[opportunity.sport as Sport] || "🏆"}</span>
        </div>

        {/* Game Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-gray-900 truncate">
              {shortenTeamName(opportunity.awayTeam, opportunity.sport)}
            </span>
            <span className="text-[10px] text-gray-400">@</span>
            <span className="text-[13px] font-medium text-gray-900 truncate">
              {shortenTeamName(opportunity.homeTeam, opportunity.sport)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400 capitalize">{opportunity.market}</span>
            <span className="text-[10px] text-gray-300">·</span>
            <span className="text-[10px] text-gray-400">
              {opportunity.legs.map(l => formatBook(l.book)).join(" × ")}
            </span>
          </div>
        </div>

        {/* Profit Badge */}
        <div className={`px-2.5 py-1 rounded-full flex-shrink-0 ${
          isPremium ? "bg-amber-500 text-white" :
          isGood ? "bg-green-500 text-white" :
          "bg-green-100 text-green-700"
        }`}>
          <span className="text-[11px] font-bold tabular-nums">+{opportunity.profit.toFixed(1)}%</span>
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-300 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5 pt-0">
          <div className="bg-gray-50 rounded-lg p-2.5 space-y-2">
            {/* Legs */}
            <div className="grid grid-cols-2 gap-2">
              {opportunity.legs.map((leg, idx) => (
                <div key={idx} className="bg-white rounded-lg p-2 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-700 truncate">{leg.side}</span>
                    <span className={`text-sm font-bold ${leg.odds > 0 ? "text-green-600" : "text-gray-900"}`}>
                      {leg.odds > 0 ? "+" : ""}{leg.odds}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <BookLink book={leg.book} showIcon className="text-[10px]" />
                    <span className="text-[11px] font-medium text-gray-500">${leg.stake.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-[11px] text-gray-500">
                Stake ${opportunity.totalStake.toFixed(0)}
              </span>
              <span className="text-xs font-bold text-green-600">
                Return ${(opportunity.totalStake * (1 + opportunity.profit / 100)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact badge for header
export function ArbitrageBadge({ games }: { games: GameOdds[] }) {
  const opportunities = useMemo(() => findAllArbitrage(games), [games]);

  if (opportunities.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[11px] font-semibold">
      <span>💰</span>
      <span>{opportunities.length}</span>
    </div>
  );
}

// Book name abbreviations
function formatBook(book: string): string {
  const map: Record<string, string> = {
    draftkings: "DK",
    fanduel: "FD",
    betmgm: "MGM",
    caesars: "CZR",
    pointsbet: "PB",
    betonline: "BOL",
    bovada: "BOV",
    mybookie: "MyB",
  };
  return map[book.toLowerCase()] || book.slice(0, 3).toUpperCase();
}

// Smart team name shortening
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
