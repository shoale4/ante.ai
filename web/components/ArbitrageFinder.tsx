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
}

export function ArbitrageFinder({ games }: Props) {
  const allOpportunities = useMemo(() => {
    const opps = findAllArbitrage(games);
    // Sort by profit descending
    return opps.sort((a, b) => b.profit - a.profit);
  }, [games]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport | "all">("all");

  // Get unique sports from opportunities
  const availableSports = useMemo(() => {
    const sports = new Set(allOpportunities.map(o => o.sport as Sport));
    return Array.from(sports).sort();
  }, [allOpportunities]);

  // Filter by selected sport
  const opportunities = useMemo(() => {
    if (selectedSport === "all") return allOpportunities;
    return allOpportunities.filter(o => o.sport === selectedSport);
  }, [allOpportunities, selectedSport]);

  if (allOpportunities.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="font-semibold mb-1">No Arbitrage Found</h3>
        <p className="text-sm text-[--text-secondary]">
          No guaranteed profit opportunities detected right now. Check back soon!
        </p>
      </div>
    );
  }

  // Show only top 10 by default
  const displayedOpps = showAll ? opportunities : opportunities.slice(0, 10);
  const hasMore = opportunities.length > 10;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <div>
            <h3 className="font-bold text-sm">Arbitrage Opportunities</h3>
            <p className="text-xs text-[--text-secondary]">
              Click row for details
            </p>
          </div>
        </div>
        <span className="pill pill-green text-xs">{opportunities.length} found</span>
      </div>

      {/* Sport Filter */}
      {availableSports.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedSport("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedSport === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({allOpportunities.length})
          </button>
          {availableSports.map((sport) => {
            const count = allOpportunities.filter(o => o.sport === sport).length;
            return (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  selectedSport === sport
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{SPORT_EMOJI[sport]}</span>
                <span>{sport} ({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Compact Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-[--text-secondary]">
              <th className="text-left py-2 px-3 font-medium">Game</th>
              <th className="text-left py-2 px-2 font-medium">Type</th>
              <th className="text-right py-2 px-2 font-medium">Profit</th>
              <th className="text-right py-2 px-3 font-medium">Books</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedOpps.map((opp, idx) => {
              const id = `${opp.gameId}-${opp.market}-${idx}`;
              const isExpanded = expandedId === id;
              return (
                <CompactArbitrageRow
                  key={id}
                  opportunity={opp}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedId(isExpanded ? null : id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show More/Less */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-xs font-medium text-[--accent] hover:bg-gray-50 rounded-lg transition-colors"
        >
          {showAll ? `Show less` : `Show ${opportunities.length - 10} more`}
        </button>
      )}
    </div>
  );
}

function CompactArbitrageRow({
  opportunity,
  isExpanded,
  onToggle
}: {
  opportunity: ArbitrageOpportunity;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const books = opportunity.legs.map(l => l.book).join(" / ");

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="py-2 px-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{SPORT_EMOJI[opportunity.sport as Sport] || "🏆"}</span>
            <span className="font-medium truncate max-w-[140px]" title={`${opportunity.awayTeam} @ ${opportunity.homeTeam}`}>
              {opportunity.awayTeam.split(" ").pop()} @ {opportunity.homeTeam.split(" ").pop()}
            </span>
          </div>
        </td>
        <td className="py-2 px-2 capitalize text-xs text-[--text-secondary]">
          {opportunity.market}
        </td>
        <td className="py-2 px-2 text-right">
          <span className="font-bold text-green-600">+{opportunity.profit.toFixed(2)}%</span>
        </td>
        <td className="py-2 px-3 text-right">
          <span className="text-xs text-[--text-secondary] capitalize">{books}</span>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={4} className="bg-gray-50 px-3 py-3">
            <div className="space-y-2">
              <div className="text-xs font-medium text-[--text-secondary]">
                {opportunity.awayTeam} @ {opportunity.homeTeam}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {opportunity.legs.map((leg, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2 border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">{leg.side}</span>
                      <span className={`text-sm font-bold ${leg.odds > 0 ? "text-green-600" : ""}`}>
                        {leg.odds > 0 ? "+" : ""}{leg.odds}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs text-[--text-secondary]">
                      <BookLink book={leg.book} showIcon />
                      <span>Bet ${leg.stake.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-xs">
                <span className="text-[--text-secondary]">Total: ${opportunity.totalStake.toFixed(2)}</span>
                <span className="font-semibold text-green-600">
                  Profit: ${((opportunity.profit / 100) * opportunity.totalStake).toFixed(2)}
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Compact version for sidebar/header
export function ArbitrageBadge({ games }: Props) {
  const opportunities = useMemo(() => findAllArbitrage(games), [games]);

  if (opportunities.length === 0) {
    return null;
  }

  const totalProfit = opportunities.reduce((sum, o) => sum + o.profit, 0);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
      <span>💰</span>
      <span>{opportunities.length} arb{opportunities.length > 1 ? "s" : ""}</span>
    </div>
  );
}
