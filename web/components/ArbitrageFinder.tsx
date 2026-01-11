"use client";

import { useMemo, useState } from "react";
import { GameOdds, Sport } from "@/lib/types";
import { findAllArbitrage, ArbitrageOpportunity } from "@/lib/arbitrage";

const SPORT_EMOJI: Record<Sport, string> = {
  NFL: "🏈",
  NBA: "🏀",
  NCAAB: "🏀",
  MLB: "⚾",
  NHL: "🏒",
  MMA: "🥊",
  Soccer: "⚽",
};

const FREE_ARB_LIMIT = 4;

interface Props {
  games: GameOdds[];
  onWaitlist?: () => void;
  isPro?: boolean;
}

export function ArbitrageFinder({ games, onWaitlist, isPro = false }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allOpportunities = useMemo(() => {
    const opps = findAllArbitrage(games);
    return opps.sort((a, b) => b.profit - a.profit);
  }, [games]);

  const topProfit = allOpportunities[0]?.profit || 0;

  // Pro users see all arbs, free users see limited
  const freeArbs = isPro
    ? allOpportunities
    : allOpportunities.slice(-FREE_ARB_LIMIT).reverse();
  const lockedArbs = isPro
    ? []
    : allOpportunities.slice(0, Math.max(0, allOpportunities.length - FREE_ARB_LIMIT));
  const bestLockedProfit = lockedArbs[0]?.profit || 0;

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

      {/* Content */}
      {allOpportunities.length > 0 ? (
        <div className="space-y-3">
          {/* Locked/Pro section - Best opportunities */}
          {lockedArbs.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
              <div className="px-3 py-3 border-b border-amber-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-bold text-black uppercase">
                      Pro
                    </span>
                    <span className="text-xs font-semibold text-gray-900">
                      {lockedArbs.length} Better {lockedArbs.length === 1 ? "Opportunity" : "Opportunities"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-600">
                    up to +{bestLockedProfit.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Blurred preview of best arb */}
              <div className="relative">
                <div className="px-3 py-3 blur-[6px] select-none pointer-events-none">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🥇</span>
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-xs">{SPORT_EMOJI[lockedArbs[0].sport as Sport] || "🏆"}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-gray-900">
                        {lockedArbs[0].awayTeam.split(" ").pop()} @ {lockedArbs[0].homeTeam.split(" ").pop()}
                      </div>
                      <div className="text-[10px] text-gray-500 capitalize">{lockedArbs[0].market}</div>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
                      <span className="text-xs font-bold text-white">+{lockedArbs[0].profit.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Overlay CTA */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-amber-50/90 to-transparent">
                  <button
                    onClick={onWaitlist}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold text-xs hover:from-amber-300 hover:to-orange-400 active:scale-95 transition-all shadow-lg shadow-amber-500/25"
                  >
                    Unlock with Pro
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Free opportunities (or all for Pro) */}
          {freeArbs.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
              {!isPro && (
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-[10px] font-medium text-gray-500 uppercase">Free Opportunities</span>
                </div>
              )}
              <div className="divide-y divide-gray-100">
                {freeArbs.map((opp, idx) => (
                  <FreeArbRow
                    key={`${opp.gameId}-${opp.market}`}
                    opportunity={opp}
                    isExpanded={expandedId === `${opp.gameId}-${opp.market}`}
                    onToggle={() => setExpandedId(
                      expandedId === `${opp.gameId}-${opp.market}` ? null : `${opp.gameId}-${opp.market}`
                    )}
                  />
                ))}
              </div>
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

// Free arb row (no medal, full details)
function FreeArbRow({
  opportunity,
  isExpanded,
  onToggle
}: {
  opportunity: ArbitrageOpportunity;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
      >
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

// Shared bet details component
function BetDetails({ opportunity, compact }: { opportunity: ArbitrageOpportunity; compact?: boolean }) {
  const [stake, setStake] = useState(100);
  const multiplier = stake / 100;

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setStake(value);
    } else if (e.target.value === '') {
      setStake(0);
    }
  };

  const presets = compact ? [50, 100, 250] : [50, 100, 250, 500, 1000];
  const profit = (opportunity.profit / 100) * stake;
  const totalReturn = stake + profit;

  return (
    <div className={`border-t border-gray-100 bg-gray-50 ${compact ? 'p-2' : 'p-3'}`}>
      {/* Stake Input */}
      <div className={`${compact ? 'mb-2' : 'mb-3'}`}>
        <label className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-medium text-gray-500 uppercase block mb-1.5`}>
          Total Stake
        </label>
        <div className="relative">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${compact ? 'text-sm' : 'text-base'} text-gray-400 font-medium`}>$</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={stake || ''}
            onChange={handleStakeChange}
            placeholder="100"
            className={`w-full ${compact ? 'pl-6 pr-3 py-2.5 text-base' : 'pl-7 pr-3 py-3 text-lg'} bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-semibold text-gray-900`}
          />
        </div>
        {/* Quick presets */}
        <div className={`flex gap-1.5 ${compact ? 'mt-1.5' : 'mt-2'}`}>
          {presets.map((amount) => (
            <button
              key={amount}
              onClick={() => setStake(amount)}
              className={`flex-1 ${compact ? 'py-1.5 text-[10px]' : 'py-2 text-xs'} font-medium rounded-lg transition-colors ${
                stake === amount
                  ? 'bg-green-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>

      {/* Bet Breakdown */}
      <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-medium text-gray-500 uppercase mb-1.5`}>
        Bet Amounts
      </div>
      <div className={`${compact ? 'space-y-1' : 'space-y-1.5'}`}>
        {opportunity.legs.map((leg, idx) => (
          <div key={idx} className={`flex items-center justify-between bg-white rounded ${compact ? 'px-2 py-1.5' : 'p-2'} border border-gray-100`}>
            <div>
              <div className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-900`}>{leg.side}</div>
              <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500`}>{leg.book}</div>
            </div>
            <div className="text-right">
              <div className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-gray-900`}>${(leg.stake * multiplier).toFixed(2)}</div>
              <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500`}>@ {leg.odds > 0 ? `+${leg.odds}` : leg.odds}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Profit Summary */}
      <div className={`${compact ? 'mt-2 pt-2' : 'mt-3 pt-3'} border-t border-gray-200 space-y-1`}>
        <div className="flex items-center justify-between">
          <span className={`${compact ? 'text-[9px]' : 'text-[11px]'} text-gray-500`}>Profit</span>
          <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-green-600`}>+${profit.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`${compact ? 'text-[9px]' : 'text-[11px]'} text-gray-500`}>Total Return</span>
          <span className={`${compact ? 'text-[11px]' : 'text-sm'} font-bold text-green-600`}>${totalReturn.toFixed(2)}</span>
        </div>
      </div>

      {/* Share Button */}
      <div className={`${compact ? 'mt-2 pt-2' : 'mt-3 pt-3'} border-t border-gray-200`}>
        <button
          onClick={() => {
            const text = `🔥 ${opportunity.profit.toFixed(1)}% arb on ${opportunity.awayTeam} @ ${opportunity.homeTeam}\n\n${opportunity.legs.map(l => `${l.side} @ ${l.book} (${l.odds > 0 ? '+' : ''}${l.odds})`).join('\n')}\n\nFound on hedj.app`;
            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank', 'width=550,height=420');
          }}
          className={`w-full flex items-center justify-center gap-2 ${compact ? 'py-2 text-[10px]' : 'py-2.5 text-xs'} font-medium rounded-lg bg-black text-white hover:bg-gray-800 active:scale-[0.98] transition-all`}
        >
          <svg className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share on X
        </button>
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
