import { getGameOdds, getLineMovements, getLastUpdated } from "@/lib/data";
import { fetchAllNews } from "@/lib/news-sources";
import { getWeatherForGames, GameWeather } from "@/lib/weather";
import { Header } from "@/components/Header";
import { FeedClient } from "@/components/FeedClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Feed | Hedj",
  description: "Real-time odds, line movements, and player props across all major sports and sportsbooks.",
};

export const revalidate = 300; // Revalidate every 5 minutes

export default async function FeedPage() {
  const [games, movements, news, lastUpdated] = await Promise.all([
    getGameOdds(),
    getLineMovements(),
    fetchAllNews(),
    getLastUpdated(),
  ]);

  const nflGames = games.filter((g) => g.sport === "NFL");

  // Fetch weather for NFL games
  const weatherMap = await getWeatherForGames(nflGames);
  // Convert Map to serializable object for client component
  const weatherData: Record<string, GameWeather> = {};
  weatherMap.forEach((value, key) => {
    weatherData[key] = value;
  });

  return (
    <main className="min-h-screen pb-24 sm:pb-0">
      {/* Header with Navigation */}
      <Header games={games} lastUpdated={lastUpdated} />

      {/* Main Content */}
      <FeedClient
        games={games}
        movements={movements}
        news={news}
        weatherData={weatherData}
      />

      {/* Footer */}
      <footer className="border-t border-gray-200/60 mt-8 bg-white/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">hedj</span>
              <span className="text-xs text-gray-400">Bet Smarter</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Data refreshes every 5 min</span>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span className="hidden sm:inline">7+ sportsbooks</span>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center leading-relaxed max-w-2xl mx-auto">
              Must be 21+ (18+ in some states). Gambling problem? Call 1-800-GAMBLER.
              Hedj provides informational content only and does not facilitate gambling.
              Odds are for informational purposes and may not reflect actual sportsbook lines.
              Always verify odds directly with the sportsbook before placing bets.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
