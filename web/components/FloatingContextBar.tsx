"use client";

import { useState, useEffect } from "react";
import { Sport } from "@/lib/types";

const SPORT_EMOJI: Record<Sport | "all", string> = {
  all: "🎯",
  NFL: "🏈",
  NBA: "🏀",
  MLB: "⚾",
  NHL: "🏒",
  MMA: "🥊",
  Soccer: "⚽",
};

const SPORTS: (Sport | "all")[] = ["all", "NFL", "NBA", "MLB", "NHL", "MMA", "Soccer"];

interface Props {
  arbCount: number;
  gameCount: number;
  selectedSport: Sport | "all";
  onSportChange: (sport: Sport | "all") => void;
}

export function FloatingContextBar({
  arbCount,
  gameCount,
  selectedSport,
  onSportChange,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY && currentScrollY > 100;

      if (isScrollingDown && !isExpanded) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isExpanded]);

  // Close on outside tap
  useEffect(() => {
    if (!isExpanded) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".floating-bar")) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isExpanded]);

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 sm:hidden transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Floating Bar */}
      <div
        className={`floating-bar fixed bottom-5 left-1/2 -translate-x-1/2 z-50 sm:hidden transition-all duration-300 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      >
        <div
          className={`relative overflow-hidden transition-all duration-300 ease-out shadow-2xl shadow-black/20 ${
            isExpanded
              ? "w-[calc(100vw-24px)] max-w-sm rounded-2xl"
              : "w-auto rounded-full"
          }`}
        >
          {/* Glass background */}
          <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-xl" />

          {/* Subtle border */}
          <div className="absolute inset-0 rounded-[inherit] border border-white/10" />

          {/* Content */}
          <div className="relative">
            {/* Collapsed State - Pill */}
            {!isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-white active:scale-95 transition-transform"
              >
                {/* Live indicator */}
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                </span>

                {/* Stats */}
                <div className="flex items-center gap-2 text-[12px] font-medium">
                  {arbCount > 0 && (
                    <>
                      <span className="text-green-400 font-semibold">{arbCount} arbs</span>
                      <span className="text-white/20">|</span>
                    </>
                  )}
                  <span className="flex items-center gap-1 text-white/80">
                    <span className="text-sm">{SPORT_EMOJI[selectedSport]}</span>
                    <span>{selectedSport === "all" ? `${gameCount} games` : selectedSport}</span>
                  </span>
                </div>

                {/* Expand indicator */}
                <svg
                  className="w-3.5 h-3.5 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}

            {/* Expanded State */}
            {isExpanded && (
              <div className="p-4 text-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                    </span>
                    <span className="text-[11px] font-medium text-white/50">Live</span>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white/5 rounded-xl p-2.5">
                    <div className="text-xl font-bold text-green-400 tabular-nums">{arbCount}</div>
                    <div className="text-[10px] text-white/40">Arbitrage</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5">
                    <div className="text-xl font-bold tabular-nums">{gameCount}</div>
                    <div className="text-[10px] text-white/40">Games</div>
                  </div>
                </div>

                {/* Sport Filters */}
                <div className="mb-3">
                  <div className="text-[10px] font-medium text-white/40 mb-1.5">Sport</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SPORTS.map((sport) => (
                      <button
                        key={sport}
                        onClick={() => {
                          onSportChange(sport);
                          setIsExpanded(false);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 ${
                          selectedSport === sport
                            ? "bg-white text-gray-900"
                            : "bg-white/10 text-white/60 hover:bg-white/15"
                        }`}
                      >
                        <span className="text-sm">{SPORT_EMOJI[sport]}</span>
                        <span>{sport === "all" ? "All" : sport}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      document.getElementById("arb-section")?.scrollIntoView({ behavior: "smooth" });
                      setIsExpanded(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-green-500 text-white font-semibold text-[11px] active:scale-95 transition-transform"
                  >
                    <span>💰</span>
                    <span>View Arbs</span>
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById("feed-section")?.scrollIntoView({ behavior: "smooth" });
                      setIsExpanded(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-[11px] active:scale-95 transition-transform hover:bg-white/15"
                  >
                    <span>🏆</span>
                    <span>All Games</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
