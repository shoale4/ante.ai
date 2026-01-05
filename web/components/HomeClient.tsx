"use client";

import { useState, useMemo } from "react";
import { GameOdds, LineMovement, Sport } from "@/lib/types";
import { NewsItem } from "@/lib/news";
import { GameWeather } from "@/lib/weather";
import { ArbitrageFinder } from "@/components/ArbitrageFinder";
import { UnifiedFeed } from "@/components/UnifiedFeed";
import { ProTeaser } from "@/components/ProTeaser";
import { FloatingContextBar } from "@/components/FloatingContextBar";
import { findAllArbitrage } from "@/lib/arbitrage";

interface Props {
  games: GameOdds[];
  movements: LineMovement[];
  news: NewsItem[];
  weatherData: Record<string, GameWeather>;
}

export function HomeClient({ games, movements, news, weatherData }: Props) {
  const [globalSport, setGlobalSport] = useState<Sport | "all">("all");

  // Calculate arb count
  const arbCount = useMemo(() => {
    const allArbs = findAllArbitrage(games);
    if (globalSport === "all") return allArbs.length;
    return allArbs.filter((a) => a.sport === globalSport).length;
  }, [games, globalSport]);

  // Calculate filtered game count
  const gameCount = useMemo(() => {
    if (globalSport === "all") return games.length;
    return games.filter((g) => g.sport === globalSport).length;
  }, [games, globalSport]);

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Arbitrage Section */}
        <section id="arb-section">
          <ArbitrageFinder games={games} globalSportFilter={globalSport} />
        </section>

        {/* Pro Features Teaser */}
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          <ProTeaser
            feature="Real-Time Arbitrage Alerts"
            description="Get instant SMS & email alerts when arbitrage opportunities appear. Never miss a guaranteed profit again."
          />
          <ProTeaser
            feature="AI-Powered Picks"
            description="Unlock Claude AI analysis for every game with confidence scores, key factors, and best bet recommendations."
          />
        </div>

        {/* Feed Section */}
        <section id="feed-section">
          <UnifiedFeed
            games={games}
            movements={movements}
            news={news}
            weatherData={weatherData}
          />
        </section>

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
