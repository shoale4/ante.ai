"use client";

import { useMemo } from "react";
import { GameOdds, Sport } from "@/lib/types";
import { findAllArbitrage, ArbitrageOpportunity } from "@/lib/arbitrage";

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
  const opportunities = useMemo(() => findAllArbitrage(games), [games]);

  if (opportunities.length === 0) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div>
            <h3 className="font-bold">Arbitrage Opportunities</h3>
            <p className="text-xs text-[--text-secondary]">
              Guaranteed profit by betting both sides
            </p>
          </div>
        </div>
        <span className="pill pill-green">{opportunities.length} found</span>
      </div>

      <div className="space-y-3">
        {opportunities.map((opp, idx) => (
          <ArbitrageCard key={`${opp.gameId}-${opp.market}-${idx}`} opportunity={opp} />
        ))}
      </div>
    </div>
  );
}

function ArbitrageCard({ opportunity }: { opportunity: ArbitrageOpportunity }) {
  const profitColor =
    opportunity.profit >= 3
      ? "text-green-600 bg-green-100"
      : opportunity.profit >= 1
      ? "text-yellow-600 bg-yellow-100"
      : "text-blue-600 bg-blue-100";

  return (
    <div className="glass-card p-4 border-l-4 border-green-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{SPORT_EMOJI[opportunity.sport as Sport] || "🏆"}</span>
          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            +{opportunity.profit.toFixed(2)}% PROFIT
          </span>
          <span className="text-xs text-[--text-secondary] capitalize">
            {opportunity.market}
          </span>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${profitColor}`}>
          ${((opportunity.profit / 100) * opportunity.totalStake).toFixed(2)} guaranteed
        </span>
      </div>

      {/* Game Info */}
      <div className="text-sm font-semibold mb-3">
        {opportunity.awayTeam} @ {opportunity.homeTeam}
      </div>

      {/* Legs */}
      <div className="space-y-2">
        {opportunity.legs.map((leg, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500">#{idx + 1}</span>
              <div>
                <div className="font-medium text-sm">{leg.side}</div>
                <div className="text-xs text-[--text-secondary]">@ {leg.book}</div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`font-bold text-sm ${
                  leg.odds > 0 ? "text-green-600" : ""
                }`}
              >
                {leg.odds > 0 ? "+" : ""}
                {leg.odds}
              </div>
              <div className="text-xs text-[--text-secondary]">
                Bet ${leg.stake.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="text-[--text-secondary]">
          Total stake: ${opportunity.totalStake.toFixed(2)}
        </span>
        <span className="font-semibold text-green-600">
          Guaranteed payout: ${opportunity.legs[0].payout.toFixed(2)}
        </span>
      </div>
    </div>
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
