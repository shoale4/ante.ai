"use client";

import { useMemo, useState } from "react";
import { GameOdds, Sport } from "@/lib/types";
import { calculateBookRankings, BOOK_NAMES, BOOK_COLORS, BookStats } from "@/lib/book-rankings";

interface Props {
  games: GameOdds[];
}

const SPORTS: Sport[] = ["NFL", "NBA", "NCAAB", "WNBA", "MLB", "NHL", "MMA", "Soccer"];

export function BookLeaderboard({ games }: Props) {
  const [selectedSport, setSelectedSport] = useState<Sport | "all">("all");

  const rankings = useMemo(() => calculateBookRankings(games), [games]);

  const displayStats = useMemo(() => {
    if (selectedSport === "all") {
      return rankings.overall;
    }
    return rankings.bySport[selectedSport] || [];
  }, [rankings, selectedSport]);

  // Get medal emoji for top 3
  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  // Get available sports (ones with data)
  const availableSports = useMemo(() => {
    return SPORTS.filter(sport => rankings.bySport[sport]?.length > 0);
  }, [rankings]);

  if (displayStats.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-sm text-gray-500">No book data available</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h2 className="text-sm font-semibold text-gray-900">Best Odds Leaderboard</h2>
          </div>
          <span className="text-[10px] text-gray-400">
            Based on {games.length} games
          </span>
        </div>

        {/* Sport Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => setSelectedSport("all")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
              selectedSport === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Sports
          </button>
          {availableSports.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                selectedSport === sport
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="divide-y divide-gray-50">
        {displayStats.slice(0, 7).map((stats, index) => {
          const bookName = BOOK_NAMES[stats.book] || stats.book;
          const bookColor = BOOK_COLORS[stats.book] || "#6b7280";
          const medal = getMedal(index);

          return (
            <div
              key={stats.book}
              className={`flex items-center gap-3 px-4 py-3 ${
                index === 0 ? "bg-gradient-to-r from-amber-50/50 to-transparent" : ""
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-6 text-center">
                {medal ? (
                  <span className="text-base">{medal}</span>
                ) : (
                  <span className="text-xs font-medium text-gray-400">#{index + 1}</span>
                )}
              </div>

              {/* Book Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: bookColor }}
                  />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {bookName}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400">
                    {stats.bestOddsCount} of {stats.totalMarkets} markets
                  </span>
                  {stats.avgEdgeOverMarket > 0 && (
                    <>
                      <span className="text-gray-200">•</span>
                      <span className="text-[10px] text-green-600">
                        +{stats.avgEdgeOverMarket} avg edge
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Percentage with mini progress bar */}
              <div className="flex-shrink-0 w-16">
                <div
                  className={`text-sm font-bold text-right ${
                    index === 0
                      ? "text-amber-600"
                      : index === 1
                      ? "text-gray-500"
                      : index === 2
                      ? "text-amber-700"
                      : "text-gray-700"
                  }`}
                >
                  {stats.bestOddsPercent}%
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full transition-all ${
                      index === 0
                        ? "bg-amber-500"
                        : index === 1
                        ? "bg-gray-400"
                        : index === 2
                        ? "bg-amber-600"
                        : "bg-gray-300"
                    }`}
                    style={{ width: `${Math.min(stats.bestOddsPercent * 2, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-gray-50/50 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">
          Shows which sportsbook has the best price most often
        </p>
      </div>
    </div>
  );
}
