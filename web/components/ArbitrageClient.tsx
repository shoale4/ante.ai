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
