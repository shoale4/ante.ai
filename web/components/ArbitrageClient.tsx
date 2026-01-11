"use client";

import { useState, useMemo } from "react";
import { GameOdds, Sport } from "@/lib/types";
import { ArbitrageFinderBySport } from "@/components/ArbitrageFinderBySport";
import { FloatingContextBar } from "@/components/FloatingContextBar";
import { WaitlistModal, useWaitlistModal } from "@/components/WaitlistModal";
import { RedeemCodeModal, useRedeemModal } from "@/components/RedeemCodeModal";
import { LaunchBanner } from "@/components/LaunchBanner";
import { findAllArbitrage } from "@/lib/arbitrage";
import { usePro } from "@/lib/pro-context";

interface Props {
  games: GameOdds[];
}

export function ArbitrageClient({ games }: Props) {
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
        {/* Pro Features Banner */}
        {isPro ? (
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-white/20 text-[9px] font-bold text-white uppercase">
                Pro
              </span>
              <span className="text-xs text-white/90 truncate">
                All arbitrage opportunities unlocked
              </span>
            </div>
            <span className="flex-shrink-0 text-white/80 text-[11px]">
              Active
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-bold text-black uppercase">
                Pro
              </span>
              <span className="text-xs text-gray-300 truncate">
                Unlock all arbs, alerts & more
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => redeemModal.open()}
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

        {/* Arbitrage Section with Sport Groups */}
        <ArbitrageFinderBySport
          games={games}
          onWaitlist={() => waitlistModal.open("arbitrage")}
          isPro={isPro}
        />
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
      />
    </>
  );
}
