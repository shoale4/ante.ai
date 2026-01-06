"use client";

import { useMemo, useState } from "react";
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

export function ArbitrageFinder({ games }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const allOpportunities = useMemo(() => {
    const opps = findAllArbitrage(games);
    return opps.sort((a, b) => b.profit - a.profit);
  }, [games]);

  const topProfit = allOpportunities[0]?.profit || 0;
  const featured = allOpportunities.slice(0, 3);
  const remaining = allOpportunities.slice(3);

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
            <h3 className="font-semibold text-sm text-gray-900">Arbitrage Scanner</h3>
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

      {/* Warning Banner - Compact */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <span className="text-amber-500 text-xs">⚠️</span>
        <p className="text-[10px] text-amber-700">
          <strong>Preview:</strong> Data may be stale. Do not place real bets.
        </p>
      </div>

      {/* Content */}
      {allOpportunities.length > 0 ? (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          {/* Featured opportunities */}
          <div className="divide-y divide-gray-100">
            {featured.map((opp, idx) => (
              <FeaturedArbRow
                key={`${opp.gameId}-${opp.market}`}
                opportunity={opp}
                rank={idx + 1}
                isExpanded={expandedId === `${opp.gameId}-${opp.market}`}
                onToggle={() => setExpandedId(
                  expandedId === `${opp.gameId}-${opp.market}` ? null : `${opp.gameId}-${opp.market}`
                )}
              />
            ))}
          </div>

          {/* More opportunities section */}
          {remaining.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowMore(!showMore)}
                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <span className="text-xs font-medium text-gray-600">
                  {remaining.length} more opportunities
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${showMore ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMore && (
                <div className="px-3 pb-3 space-y-1.5">
                  {remaining.map((opp) => (
                    <CompactArbRow
                      key={`${opp.gameId}-${opp.market}`}
                      opportunity={opp}
                      isExpanded={expandedId === `${opp.gameId}-${opp.market}`}
                      onToggle={() => setExpandedId(
                        expandedId === `${opp.gameId}-${opp.market}` ? null : `${opp.gameId}-${opp.market}`
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🔍</span>
          </div>
          <p className="text-sm font-medium text-gray-600">No arbitrage opportunities</p>
          <p className="text-xs text-gray-400 mt-1">Check back soon</p>
        </div>
      )}
    </div>
  );
}

// Format game time
function formatGameTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (isToday) return `Today ${timeStr}`;
  if (isTomorrow) return `Tomorrow ${timeStr}`;

  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + ` ${timeStr}`;
}

// Featured row with medal ranking
function FeaturedArbRow({
  opportunity,
  rank,
  isExpanded,
  onToggle
}: {
  opportunity: ArbitrageOpportunity;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg">{medals[rank - 1]}</span>
        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs">{SPORT_EMOJI[opportunity.sport as Sport] || "🏆"}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[13px] font-semibold text-gray-900 truncate">
            {opportunity.awayTeam.split(" ").pop()} @ {opportunity.homeTeam.split(" ").pop()}
          </div>
          <div className="text-[10px] text-gray-500">
            <span className="capitalize">{opportunity.market}</span>
            <span className="mx-1">·</span>
            <span>{formatGameTime(opportunity.eventStartTime)}</span>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
          <span className="text-xs font-bold text-white">+{opportunity.profit.toFixed(1)}%</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && <BetDetails opportunity={opportunity} />}
    </div>
  );
}

// Compact row for additional opportunities
function CompactArbRow({
  opportunity,
  isExpanded,
  onToggle
}: {
  opportunity: ArbitrageOpportunity;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-2.5 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs">{SPORT_EMOJI[opportunity.sport as Sport] || "🏆"}</span>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-xs text-gray-900 truncate">
            {opportunity.awayTeam.split(" ").pop()} @ {opportunity.homeTeam.split(" ").pop()}
          </div>
          <div className="text-[9px] text-gray-400">{formatGameTime(opportunity.eventStartTime)}</div>
        </div>
        <span className="text-xs font-bold text-green-600">+{opportunity.profit.toFixed(1)}%</span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && <BetDetails opportunity={opportunity} compact />}
    </div>
  );
}

// Shared bet details component
function BetDetails({ opportunity, compact }: { opportunity: ArbitrageOpportunity; compact?: boolean }) {
  return (
    <div className={`border-t border-gray-100 bg-gray-50 ${compact ? 'p-2' : 'p-3'}`}>
      <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-medium text-gray-500 uppercase mb-1.5`}>
        Bets for $100
      </div>
      <div className={`${compact ? 'space-y-1' : 'space-y-1.5'}`}>
        {opportunity.legs.map((leg, idx) => (
          <div key={idx} className={`flex items-center justify-between bg-white rounded ${compact ? 'px-2 py-1.5' : 'p-2'} border border-gray-100`}>
            <div>
              <div className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-900`}>{leg.side}</div>
              <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500`}>{leg.book}</div>
            </div>
            <div className="text-right">
              <div className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-gray-900`}>${leg.stake.toFixed(2)}</div>
              <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500`}>@ {leg.odds > 0 ? `+${leg.odds}` : leg.odds}</div>
            </div>
          </div>
        ))}
      </div>
      <div className={`${compact ? 'mt-1.5 pt-1.5' : 'mt-2 pt-2'} border-t border-gray-200 flex items-center justify-between`}>
        <span className={`${compact ? 'text-[9px]' : 'text-[11px]'} text-gray-500`}>Return</span>
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-green-600`}>${(100 + opportunity.profit).toFixed(2)}</span>
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
