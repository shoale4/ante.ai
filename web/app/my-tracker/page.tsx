import { getLastUpdated } from "@/lib/data";
import { Header } from "@/components/Header";
import { BetTrackerClient } from "@/components/BetTrackerClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Bets Tracker | Hedj",
  description:
    "Track your bets, monitor performance, and analyze your betting history.",
};

export default async function MyTrackerPage() {
  const lastUpdated = await getLastUpdated();

  return (
    <main className="min-h-screen pb-24 sm:pb-0">
      <Header games={[]} lastUpdated={lastUpdated} />

      <BetTrackerClient />

      <footer className="border-t border-gray-200/60 mt-8 bg-white/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">hedj</span>
              <span className="text-xs text-gray-400">Bet Smarter</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Data stored locally in browser</span>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center leading-relaxed max-w-2xl mx-auto">
              Must be 21+ (18+ in some states). Gambling problem? Call
              1-800-GAMBLER. Hedj provides informational content only and does
              not facilitate gambling. Your bet data is stored locally in your
              browser and is not sent to any server.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
