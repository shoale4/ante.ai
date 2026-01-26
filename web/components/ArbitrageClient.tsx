"use client";

import { useState, useMemo } from "react";
import { GameOdds, Sport } from "@/lib/types";
import { ArbitrageFinderBySport } from "@/components/ArbitrageFinderBySport";
import { ArbCalculator } from "@/components/ArbCalculator";
import { FloatingContextBar } from "@/components/FloatingContextBar";
import { WaitlistModal, useWaitlistModal } from "@/components/WaitlistModal";
import { RedeemCodeModal, useRedeemModal } from "@/components/RedeemCodeModal";
import { LaunchBanner } from "@/components/LaunchBanner";
import { findAllArbitrage, ArbitrageOpportunity } from "@/lib/arbitrage";
import { usePro } from "@/lib/pro-context";
import { useUserState } from "@/components/StateSelector";
import { isBookAvailable } from "@/lib/state-legality";

interface Props {
  games: GameOdds[];
  lastUpdated: string | null;
}

export function ArbitrageClient({ games, lastUpdated }: Props) {
  const [globalSport, setGlobalSport] = useState<Sport | "all">("all");
  const waitlistModal = useWaitlistModal();
  const redeemModal = useRedeemModal();
  const { isPro } = usePro();
  const { userState } = useUserState();

  // Filter arbs by state availability (both books must be available)
  const filterArbsByState = (opps: ArbitrageOpportunity[]): ArbitrageOpportunity[] => {
    if (!userState) return opps;
    return opps.filter(opp =>
      opp.legs.every(leg => isBookAvailable(userState, leg.book))
    );
  };

  // Calculate arb count (filtered by state)
  const arbCount = useMemo(() => {
    const allArbs = findAllArbitrage(games);
    const filtered = filterArbsByState(allArbs);
    if (globalSport === "all") return filtered.length;
    return filtered.filter((a) => a.sport === globalSport).length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, globalSport, userState]);

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
          lastUpdated={lastUpdated}
        />

        {/* Manual Arb Calculator */}
        <ArbCalculator />
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
