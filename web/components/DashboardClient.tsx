"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { GameOdds, LineMovement, Sport } from "@/lib/types";
import { NewsItem } from "@/lib/news";
import { GameWeather } from "@/lib/weather";
import { WaitlistModal, useWaitlistModal } from "@/components/WaitlistModal";
import { RedeemCodeModal, useRedeemModal } from "@/components/RedeemCodeModal";
import { FloatingContextBar } from "@/components/FloatingContextBar";
import { BookLeaderboard } from "@/components/BookLeaderboard";
import { findAllArbitrage, ArbitrageOpportunity } from "@/lib/arbitrage";
import { usePro } from "@/lib/pro-context";

interface Props {
  games: GameOdds[];
  movements: LineMovement[];
  news: NewsItem[];
  weatherData: Record<string, GameWeather>;
}

// Activity item types
type ActivityItem =
  | { type: "arb"; data: ArbitrageOpportunity; timestamp: Date }
  | { type: "movement"; data: LineMovement; timestamp: Date }
  | { type: "news"; data: NewsItem; timestamp: Date };

// Sport emoji mapping
const sportEmoji: Record<string, string> = {
  NFL: "🏈",
  NBA: "🏀",
  MLB: "⚾",
  NHL: "🏒",
  MMA: "🥊",
  Soccer: "⚽",
};

// Format time ago
function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Format American odds
function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function DashboardClient({ games, movements, news }: Props) {
  const [globalSport, setGlobalSport] = useState<Sport | "all">("all");
  const waitlistModal = useWaitlistModal();
  const redeemModal = useRedeemModal();
  const { isPro } = usePro();

  // Calculate all arbs
  const allArbs = useMemo(() => findAllArbitrage(games), [games]);

  // Calculate arb count (for FloatingContextBar)
  const arbCount = useMemo(() => {
    if (globalSport === "all") return allArbs.length;
    return allArbs.filter((a) => a.sport === globalSport).length;
  }, [allArbs, globalSport]);

  // Calculate game count (for FloatingContextBar)
  const gameCount = useMemo(() => {
    if (globalSport === "all") return games.length;
    return games.filter((g) => g.sport === globalSport).length;
  }, [games, globalSport]);

  // Get unique sportsbooks
  const bookCount = useMemo(() => {
    const books = new Set<string>();
    games.forEach((game) => {
      game.markets.moneyline.forEach((o) => books.add(o.book));
      game.markets.spread.forEach((o) => books.add(o.book));
      game.markets.total.forEach((o) => books.add(o.book));
    });
    return books.size;
  }, [games]);

  // Get sharp movements (significant price changes)
  const sharpMovements = useMemo(() => {
    return movements
      .filter((m) => Math.abs(m.priceMovement) >= 15) // 15+ point swing
      .slice(0, 5);
  }, [movements]);

  // Build activity feed (best arbs + sharp movements)
  const activityFeed = useMemo(() => {
    const items: ActivityItem[] = [];

    // Add top 5 arbs
    allArbs.slice(0, 5).forEach((arb) => {
      items.push({
        type: "arb",
        data: arb,
        timestamp: new Date(arb.eventStartTime),
      });
    });

    // Add sharp movements
    sharpMovements.forEach((m) => {
      items.push({
        type: "movement",
        data: m,
        timestamp: new Date(m.lastUpdated),
      });
    });

    // Add top news
    news.slice(0, 3).forEach((n) => {
      items.push({
        type: "news",
        data: n,
        timestamp: new Date(n.publishedAt),
      });
    });

    // Sort by relevance (arbs first, then by recency)
    return items.sort((a, b) => {
      if (a.type === "arb" && b.type !== "arb") return -1;
      if (a.type !== "arb" && b.type === "arb") return 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [allArbs, sharpMovements, news]);

  // Featured games (games with arbs or most action)
  const featuredGames = useMemo(() => {
    // Games with arbs get priority
    const gamesWithArbs = new Map<string, { game: GameOdds; arbCount: number; bestProfit: number }>();

    allArbs.forEach((arb) => {
      const existing = gamesWithArbs.get(arb.gameId);
      if (existing) {
        existing.arbCount++;
        existing.bestProfit = Math.max(existing.bestProfit, arb.profit);
      } else {
        const game = games.find((g) => g.eventId === arb.gameId);
        if (game) {
          gamesWithArbs.set(arb.gameId, { game, arbCount: 1, bestProfit: arb.profit });
        }
      }
    });

    // Sort by best profit
    const withArbs = Array.from(gamesWithArbs.values())
      .sort((a, b) => b.bestProfit - a.bestProfit)
      .slice(0, 3);

    // If we need more, add games with most books
    if (withArbs.length < 3) {
      const remaining = games
        .filter((g) => !gamesWithArbs.has(g.eventId))
        .map((g) => ({
          game: g,
          bookCount: new Set([
            ...g.markets.moneyline.map((o) => o.book),
            ...g.markets.spread.map((o) => o.book),
            ...g.markets.total.map((o) => o.book),
          ]).size,
        }))
        .sort((a, b) => b.bookCount - a.bookCount)
        .slice(0, 3 - withArbs.length);

      return [
        ...withArbs.map((w) => ({ ...w, hasArb: true })),
        ...remaining.map((r) => ({ game: r.game, arbCount: 0, bestProfit: 0, hasArb: false })),
      ];
    }

    return withArbs.map((w) => ({ ...w, hasArb: true }));
  }, [games, allArbs]);

  // Arbs by sport for summary
  const arbsBySport = useMemo(() => {
    const bySport = new Map<string, number>();
    allArbs.forEach((arb) => {
      bySport.set(arb.sport, (bySport.get(arb.sport) || 0) + 1);
    });
    return bySport;
  }, [allArbs]);

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{allArbs.length}</div>
            <div className="text-xs text-gray-500">Active Arbs</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{games.length}</div>
            <div className="text-xs text-gray-500">Games</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{bookCount}</div>
            <div className="text-xs text-gray-500">Sportsbooks</div>
          </div>
        </div>

        {/* Pro Banner */}
        {isPro ? (
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-white/20 text-[9px] font-bold text-white uppercase">
                Pro
              </span>
              <span className="text-xs text-white/90 truncate">All features unlocked</span>
            </div>
            <span className="flex-shrink-0 text-white/80 text-[11px]">Active</span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-bold text-black uppercase">
                Pro
              </span>
              <span className="text-xs text-gray-300 truncate">Unlock all arbs, alerts & more</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={redeemModal.open}
                className="text-[11px] text-gray-400 hover:text-white transition-colors"
              >
                Have a code?
              </button>
              <button
                onClick={() => waitlistModal.open("pro-banner")}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold text-[11px] hover:from-amber-300 hover:to-orange-400 active:scale-95 transition-all"
              >
                Join Waitlist
              </button>
            </div>
          </div>
        )}

        {/* Arb Summary by Sport */}
        {allArbs.length > 0 && (
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Arbitrage by Sport</h2>
              <Link
                href="/arbitrage"
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(arbsBySport.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([sport, count]) => (
                  <Link
                    key={sport}
                    href="/arbitrage"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-sm">{sportEmoji[sport] || "🎯"}</span>
                    <span className="text-xs font-medium text-gray-700">{sport}</span>
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                      {count}
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Best Books Leaderboard */}
        <BookLeaderboard games={games} />

        {/* Activity Feed */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Live Activity</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-gray-500">Real-time</span>
            </div>
          </div>

          <div className="space-y-3">
            {activityFeed.slice(0, 8).map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    item.type === "arb"
                      ? "bg-green-100"
                      : item.type === "movement"
                      ? "bg-amber-100"
                      : "bg-blue-100"
                  }`}
                >
                  {item.type === "arb" && (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {item.type === "movement" && (
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                  {item.type === "news" && (
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {item.type === "arb" && (
                    <>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm">{sportEmoji[item.data.sport] || "🎯"}</span>
                        <span className="text-xs font-medium text-gray-900 truncate">
                          {item.data.homeTeam} vs {item.data.awayTeam}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                          +{item.data.profit.toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {item.data.market} • {item.data.legs.map((l) => l.book).join(" / ")}
                        </span>
                      </div>
                    </>
                  )}
                  {item.type === "movement" && (
                    <>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm">{sportEmoji[item.data.sport] || "🎯"}</span>
                        <span className="text-xs font-medium text-gray-900 truncate">
                          {item.data.homeTeam} vs {item.data.awayTeam}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                            item.data.priceMovement > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.data.priceMovement > 0 ? "+" : ""}
                          {item.data.priceMovement}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {item.data.book} • {formatOdds(item.data.openingPrice)} → {formatOdds(item.data.currentPrice)}
                        </span>
                      </div>
                    </>
                  )}
                  {item.type === "news" && (
                    <>
                      <p className="text-xs font-medium text-gray-900 line-clamp-1 mb-0.5">
                        {item.data.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">{item.data.source}</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(item.timestamp)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {activityFeed.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Featured Games */}
        {featuredGames.length > 0 && (
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Featured Games</h2>
              <Link
                href="/feed"
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                All Games →
              </Link>
            </div>

            <div className="space-y-3">
              {featuredGames.map((item) => {
                const game = item.game;
                const gameTime = new Date(game.eventStartTime);
                const isToday = gameTime.toDateString() === new Date().toDateString();
                const formattedTime = isToday
                  ? gameTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                  : gameTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

                return (
                  <Link
                    key={game.eventId}
                    href="/feed"
                    className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{sportEmoji[game.sport] || "🎯"}</span>
                        <span className="text-[10px] text-gray-500">{game.sport}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">{formattedTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {game.awayTeam} @ {game.homeTeam}
                        </p>
                      </div>
                      {item.hasArb && (
                        <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                          {item.arbCount} arb{item.arbCount > 1 ? "s" : ""} • +{item.bestProfit.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/arbitrage"
            className="glass-card p-4 hover:border-purple-200 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                Arbitrage Scanner
              </span>
            </div>
            <p className="text-xs text-gray-500">Find guaranteed profit opportunities</p>
          </Link>

          <Link
            href="/feed"
            className="glass-card p-4 hover:border-purple-200 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                Live Feed
              </span>
            </div>
            <p className="text-xs text-gray-500">All games, odds & news</p>
          </Link>
        </div>

        {/* Empty State */}
        {games.length === 0 && movements.length === 0 && news.length === 0 && (
          <div className="glass-card p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl gradient-purple flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">No data yet</h3>
            <p className="text-sm sm:text-base text-[--text-secondary]">
              Data updates automatically every few hours.
            </p>
          </div>
        )}
      </div>

      {/* Waitlist Modal */}
      <WaitlistModal
        isOpen={waitlistModal.isOpen}
        onClose={waitlistModal.close}
        source={waitlistModal.source}
      />

      {/* Redeem Code Modal */}
      <RedeemCodeModal
        isOpen={redeemModal.isOpen}
        onClose={redeemModal.close}
      />

      {/* Floating Context Bar - Mobile Only */}
      <FloatingContextBar
        arbCount={arbCount}
        gameCount={gameCount}
        selectedSport={globalSport}
        onSportChange={setGlobalSport}
      />
    </>
  );
}
