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
  onWaitlist?: () => void;
}

export function ArbitrageFinder({ games, onWaitlist }: Props) {
  const allOpportunities = useMemo(() => {
    const opps = findAllArbitrage(games);
    return opps.sort((a, b) => b.profit - a.profit);
  }, [games]);

  const topProfit = allOpportunities[0]?.profit || 0;
  const previewOpps = allOpportunities.slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
            allOpportunities.length > 0
              ? "bg-gradient-to-br from-green-400 to-emerald-500"
              : "bg-gradient-to-br from-gray-300 to-gray-400"
          }`}>
            <span className="text-sm">💰</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm text-gray-900">Arbitrage</h3>
              <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-[8px] font-bold text-black uppercase">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-gray-500">Guaranteed profit opportunities</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {allOpportunities.length > 0 && (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              +{topProfit.toFixed(1)}% best
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
            allOpportunities.length > 0
              ? "text-gray-500 bg-gray-100"
              : "text-gray-400 bg-gray-50"
          }`}>
            {allOpportunities.length} found
          </span>
        </div>
      </div>

      {/* Locked Preview */}
      <div className="relative rounded-xl overflow-hidden border border-gray-100">
        {/* Blurred Preview */}
        <div className="blur-[6px] pointer-events-none select-none opacity-50 p-3">
          <div className="space-y-2">
            {previewOpps.length > 0 ? (
              previewOpps.map((opp, idx) => (
                <PreviewArbCard key={idx} opportunity={opp} rank={idx + 1} />
              ))
            ) : (
              <>
                <PlaceholderArbCard profit={2.4} rank={1} />
                <PlaceholderArbCard profit={1.8} rank={2} />
                <PlaceholderArbCard profit={1.2} rank={3} />
              </>
            )}
          </div>
        </div>

        {/* Lock Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/80 via-white/90 to-white/80">
          <div className="text-center px-4 py-4 sm:py-6">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-2.5 sm:mb-3 shadow-lg shadow-green-500/25">
              <span className="text-lg sm:text-xl">💰</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">
              {allOpportunities.length > 0
                ? `${allOpportunities.length} Arb Opportunities Found`
                : "Arbitrage Scanner"
              }
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-500 mb-3 sm:mb-4 max-w-[220px] sm:max-w-[240px] mx-auto leading-relaxed">
              {allOpportunities.length > 0
                ? `Up to +${topProfit.toFixed(1)}% guaranteed profit. Unlock to see exact bets.`
                : "Get notified instantly when risk-free profit opportunities appear."
              }
            </p>
            <button
              onClick={onWaitlist}
              className="px-4 sm:px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold text-xs sm:text-[13px] shadow-md shadow-orange-500/25 hover:shadow-orange-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Unlock with Pro
            </button>
            <p className="text-[9px] sm:text-[10px] text-gray-400 mt-2">
              Join 2,400+ bettors on the waitlist
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preview card (blurred)
function PreviewArbCard({ opportunity, rank }: { opportunity: ArbitrageOpportunity; rank: number }) {
  const rankColors = [
    "from-amber-400 to-orange-500",
    "from-gray-300 to-gray-400",
    "from-amber-600 to-amber-700",
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${rankColors[rank - 1]} flex items-center justify-center`}>
          <span className="text-xs font-bold text-white">#{rank}</span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <span className="text-base">{SPORT_EMOJI[opportunity.sport as Sport] || "🏆"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {opportunity.awayTeam.split(" ").pop()} @ {opportunity.homeTeam.split(" ").pop()}
          </div>
          <div className="text-[11px] text-gray-500 capitalize">{opportunity.market}</div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
          <span className="text-sm font-bold text-white">+${(opportunity.profit).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// Placeholder when no real arbs
function PlaceholderArbCard({ profit, rank }: { profit: number; rank: number }) {
  const rankColors = [
    "from-amber-400 to-orange-500",
    "from-gray-300 to-gray-400",
    "from-amber-600 to-amber-700",
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${rankColors[rank - 1]} flex items-center justify-center`}>
          <span className="text-xs font-bold text-white">#{rank}</span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <span className="text-base">🏈</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900">Team A @ Team B</div>
          <div className="text-[11px] text-gray-500">spread</div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
          <span className="text-sm font-bold text-white">+${profit.toFixed(2)}</span>
        </div>
      </div>
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
