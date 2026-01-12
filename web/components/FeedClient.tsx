"use client";

import { useState, useMemo } from "react";
import { GameOdds, LineMovement, Sport } from "@/lib/types";
import { NewsItem } from "@/lib/news";
import { GameWeather } from "@/lib/weather";
import { UnifiedFeed } from "@/components/UnifiedFeed";
import { FloatingContextBar } from "@/components/FloatingContextBar";
import { WaitlistModal, useWaitlistModal } from "@/components/WaitlistModal";
import { RedeemCodeModal, useRedeemModal } from "@/components/RedeemCodeModal";
import { LaunchBanner } from "@/components/LaunchBanner";
import { findAllArbitrage } from "@/lib/arbitrage";
import { usePro } from "@/lib/pro-context";

interface Props {
  games: GameOdds[];
  movements: LineMovement[];
  news: NewsItem[];
  weatherData: Record<string, GameWeather>;
}

export function FeedClient({ games, movements, news, weatherData }: Props) {
  const [globalSport, setGlobalSport] = useState<Sport | "all">("all");
  const waitlistModal = useWaitlistModal();
  const redeemModal = useRedeemModal();
  const { isPro } = usePro();

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
      {/* Launch Promo Banner */}
      <LaunchBanner onRedeemClick={() => redeemModal.open("DABEARSCHAMPS26")} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Feed Section */}
        <UnifiedFeed
          games={games}
          movements={movements}
          news={news}
          weatherData={weatherData}
          onWaitlist={() => waitlistModal.open("player-props")}
        />

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
        initialCode={redeemModal.initialCode}
        onWaitlist={() => waitlistModal.open("promo-maxed")}
      />
    </>
  );
}
