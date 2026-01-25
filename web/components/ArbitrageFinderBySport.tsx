"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GameOdds, Sport } from "@/lib/types";
import { findAllArbitrage, ArbitrageOpportunity } from "@/lib/arbitrage";
import { useUserState } from "./StateSelector";
import { isBookAvailable } from "@/lib/state-legality";
import { refreshArbitrageData } from "@/app/actions";

const SPORTS: Sport[] = ["NFL", "NBA", "NCAAB", "NHL", "MLB", "MMA", "Soccer"];

const SPORT_EMOJI: Record<Sport, string> = {
  NFL: "🏈",
  NBA: "🏀",
  NCAAB: "🏀",
  MLB: "⚾",
  NHL: "🏒",
  MMA: "🥊",
  Soccer: "⚽",
};

const FREE_ARBS_PER_SPORT = 2;

interface Props {
  games: GameOdds[];
  onWaitlist?: () => void;
  isPro?: boolean;
  lastUpdated?: string | null;
}

// Format relative time (e.g., "2 min ago")
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins === 1) return "1 min ago";
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function ArbitrageFinderBySport({ games, onWaitlist, isPro = false, lastUpdated }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [justRefreshed, setJustRefreshed] = useState(false);
  // Track expanded state per sport - all expanded by default
  const [expandedSports, setExpandedSports] = useState<Set<Sport>>(new Set(SPORTS));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { userState } = useUserState();

  // Filter arbitrage opportunities by state (both books must be available)
  const filterArbsByState = (opps: ArbitrageOpportunity[]): ArbitrageOpportunity[] => {
    if (!userState) return opps;
    return opps.filter(opp =>
      opp.legs.every(leg => isBookAvailable(userState, leg.book))
    );
  };

  // Group opportunities by sport
  const { opportunitiesBySport, totalCount, topProfit } = useMemo(() => {
    const allOpps = findAllArbitrage(games);
    const filtered = filterArbsByState(allOpps);
    const sorted = filtered.sort((a, b) => b.profit - a.profit);

    const grouped = new Map<Sport, ArbitrageOpportunity[]>();
    SPORTS.forEach(sport => grouped.set(sport, []));

    sorted.forEach(opp => {
      const sport = opp.sport as Sport;
      if (grouped.has(sport)) {
        grouped.get(sport)!.push(opp);
      }
    });

    // Sort within each sport by profit
    grouped.forEach((opps, sport) => {
      opps.sort((a, b) => b.profit - a.profit);
    });

    return {
      opportunitiesBySport: grouped,
      totalCount: sorted.length,
      topProfit: sorted[0]?.profit || 0,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, userState]);

  const toggleSport = (sport: Sport) => {
    setExpandedSports(prev => {
      const next = new Set(prev);
      if (next.has(sport)) {
        next.delete(sport);
      } else {
        next.add(sport);
      }
      return next;
    });
  };

  // Get sports with opportunities
  const activeSports = SPORTS.filter(sport => (opportunitiesBySport.get(sport)?.length || 0) > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
            totalCount > 0
              ? "bg-gradient-to-br from-green-400 to-emerald-500"
              : "bg-gradient-to-br from-gray-300 to-gray-400"
          }`}>
            <span className="text-sm">💰</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">Arbitrage Scanner</h3>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] text-gray-500">Guaranteed profit opportunities</p>
              {lastUpdated && (
                <>
                  <span className="text-[11px] text-gray-300">·</span>
                  <span className="text-[11px] text-gray-400">{formatRelativeTime(lastUpdated)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isPro && (
            <button
              onClick={() => startTransition(async () => {
                await refreshArbitrageData();
                router.refresh();
                setJustRefreshed(true);
                setTimeout(() => setJustRefreshed(false), 2000);
              })}
              disabled={isPending}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all text-xs font-medium ${
                justRefreshed
                  ? "bg-green-100 text-green-600"
                  : isPending
                  ? "bg-gray-100 text-gray-400"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              }`}
              title="Refresh data"
            >
              {justRefreshed ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Refreshed</span>
                </>
              ) : (
                <>
                  <svg
                    className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Refresh</span>
                </>
              )}
            </button>
          )}
          {totalCount > 0 && (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              +{topProfit.toFixed(1)}% best
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
            totalCount > 0
              ? "text-gray-500 bg-gray-100"
              : "text-gray-400 bg-gray-50"
          }`}>
            {totalCount} found
          </span>
        </div>
      </div>

      {/* Sport Sections */}
      {activeSports.length > 0 ? (
        <div className="space-y-3">
          {activeSports.map(sport => {
            const sportOpps = opportunitiesBySport.get(sport) || [];
            const isExpanded = expandedSports.has(sport);
            const bestProfit = sportOpps[0]?.profit || 0;

            // Pro/Free gating per sport
            const freeArbs = isPro
              ? sportOpps
              : sportOpps.slice(-FREE_ARBS_PER_SPORT).reverse();
            const lockedArbs = isPro
              ? []
              : sportOpps.slice(0, Math.max(0, sportOpps.length - FREE_ARBS_PER_SPORT));
            const bestLockedProfit = lockedArbs[0]?.profit || 0;

            return (
              <div key={sport} className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                {/* Collapsible Header */}
                <button
                  onClick={() => toggleSport(sport)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{SPORT_EMOJI[sport]}</span>
                    <span className="font-semibold text-gray-900">{sport}</span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                      {sportOpps.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {bestProfit > 0 && (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                        +{bestProfit.toFixed(1)}% best
                      </span>
                    )}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {/* Locked Pro section for this sport */}
                    {lockedArbs.length > 0 && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-200/50">
                        <div className="px-3 py-3 border-b border-amber-200/30">
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

                        {/* Blurred preview */}
                        <div className="relative">
                          <div className="px-3 py-3 blur-[6px] select-none pointer-events-none">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">🥇</span>
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

                    {/* Free opportunities */}
                    {freeArbs.length > 0 && (
                      <div className="divide-y divide-gray-100">
                        {freeArbs.map((opp) => (
                          <ArbRow
                            key={`${opp.gameId}-${opp.market}`}
                            opportunity={opp}
                            isExpanded={expandedId === `${opp.gameId}-${opp.market}`}
                            onToggle={() => setExpandedId(
                              expandedId === `${opp.gameId}-${opp.market}` ? null : `${opp.gameId}-${opp.market}`
                            )}
                            isPro={isPro}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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

// Arb row component
function ArbRow({
  opportunity,
  isExpanded,
  onToggle,
  isPro
}: {
  opportunity: ArbitrageOpportunity;
  isExpanded: boolean;
  onToggle: () => void;
  isPro: boolean;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
      >
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

      {isExpanded && <BetDetails opportunity={opportunity} isPro={isPro} />}
    </div>
  );
}

// Save bets to localStorage
function trackBets(opportunity: ArbitrageOpportunity, stake: number) {
  const STORAGE_KEY = "hedj_tracked_bets";
  const multiplier = stake / 100;

  // Load existing bets
  let bets = [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    bets = stored ? JSON.parse(stored) : [];
  } catch {
    bets = [];
  }

  // Create bet entries for each leg
  const newBets = opportunity.legs.map((leg, idx) => ({
    id: Date.now().toString(36) + Math.random().toString(36).substr(2) + idx,
    createdAt: new Date().toISOString(),
    type: "arb" as const,
    status: "pending" as const,
    sport: opportunity.sport,
    event: `${opportunity.awayTeam} @ ${opportunity.homeTeam}`,
    eventDate: opportunity.eventStartTime.split("T")[0],
    market: opportunity.market,
    selection: leg.side,
    book: leg.book,
    odds: leg.odds,
    stake: Math.round(leg.stake * multiplier * 100) / 100,
    notes: `Arb leg ${idx + 1}/${opportunity.legs.length} - ${opportunity.profit.toFixed(1)}% ROI`,
  }));

  // Add to beginning of list
  const updatedBets = [...newBets, ...bets];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBets));

  return newBets.length;
}

// Bet details component
function BetDetails({ opportunity, isPro }: { opportunity: ArbitrageOpportunity; isPro: boolean }) {
  const [stake, setStake] = useState(100);
  const [tracked, setTracked] = useState(false);
  const multiplier = stake / 100;

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setStake(value);
    } else if (e.target.value === '') {
      setStake(0);
    }
  };

  const presets = [50, 100, 250, 500, 1000];
  const profit = (opportunity.profit / 100) * stake;
  const totalReturn = stake + profit;

  return (
    <div className="border-t border-gray-100 bg-gray-50 p-3">
      {/* Stake Input */}
      <div className="mb-3">
        <label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">
          Total Stake
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 font-medium">$</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={stake || ''}
            onChange={handleStakeChange}
            placeholder="100"
            className="w-full pl-7 pr-3 py-3 text-lg bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-semibold text-gray-900"
          />
        </div>
        <div className="flex gap-1.5 mt-2">
          {presets.map((amount) => (
            <button
              key={amount}
              onClick={() => setStake(amount)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
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
      <div className="text-[10px] font-medium text-gray-500 uppercase mb-1.5">
        Bet Amounts
      </div>
      <div className="space-y-1.5">
        {opportunity.legs.map((leg, idx) => (
          <div key={idx} className="flex items-center justify-between bg-white rounded p-2 border border-gray-100">
            <div>
              <div className="text-xs font-medium text-gray-900">{leg.side}</div>
              <div className="text-[10px] text-gray-500">{leg.book}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-gray-900">${(leg.stake * multiplier).toFixed(2)}</div>
              <div className="text-[10px] text-gray-500">@ {leg.odds > 0 ? `+${leg.odds}` : leg.odds}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Profit Summary */}
      <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-500">Profit</span>
          <span className="text-xs font-bold text-green-600">+${profit.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-500">Total Return</span>
          <span className="text-sm font-bold text-green-600">${totalReturn.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
        {isPro && (
          <button
            onClick={() => {
              trackBets(opportunity, stake);
              setTracked(true);
              setTimeout(() => setTracked(false), 2000);
            }}
            disabled={tracked}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium rounded-lg transition-all active:scale-[0.98] ${
              tracked
                ? "bg-green-500 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {tracked ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Tracked!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Track Bets
              </>
            )}
          </button>
        )}
        <button
          onClick={() => {
            const text = `🔥 ${opportunity.profit.toFixed(1)}% arb on ${opportunity.awayTeam} @ ${opportunity.homeTeam}\n\n${opportunity.legs.map(l => `${l.side} @ ${l.book} (${l.odds > 0 ? '+' : ''}${l.odds})`).join('\n')}\n\nFound on hedj.app`;
            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank', 'width=550,height=420');
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium rounded-lg bg-black text-white hover:bg-gray-800 active:scale-[0.98] transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share
        </button>
      </div>
    </div>
  );
}
