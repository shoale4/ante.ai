import { getGameOdds, getLineMovements } from "@/lib/data";
import { UnifiedFeed } from "@/components/UnifiedFeed";
import { fetchAllESPNNews } from "@/lib/espn-news";
import { getWeatherForGames, GameWeather } from "@/lib/weather";
import { ArbitrageFinder, ArbitrageBadge } from "@/components/ArbitrageFinder";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
  const [games, movements, news] = await Promise.all([
    getGameOdds(),
    getLineMovements(),
    fetchAllESPNNews(),
  ]);

  const nflGames = games.filter((g) => g.sport === "NFL");

  // Fetch weather for NFL games
  const weatherMap = await getWeatherForGames(nflGames);
  // Convert Map to serializable object for client component
  const weatherData: Record<string, GameWeather> = {};
  weatherMap.forEach((value, key) => {
    weatherData[key] = value;
  });

  const bookCount = new Set(
    games.flatMap((g) => Object.values(g.markets).flat().map((m) => m.book))
  ).size;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Ante<span className="text-[--accent]">AI</span>
                </h1>
                <p className="text-xs text-[--text-secondary]">Smart odds tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArbitrageBadge games={games} />
              <span className="pill pill-purple">
                {bookCount} books
              </span>
              <span className="pill pill-green">
                {games.length} games
              </span>
              <span className="relative flex h-3 w-3 ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-8">
        {/* Arbitrage Section */}
        <ArbitrageFinder games={games} />

        {/* Feed Section */}
        <UnifiedFeed
          games={games}
          movements={movements}
          news={news}
          weatherData={weatherData}
        />

        {/* Empty State */}
        {games.length === 0 && movements.length === 0 && news.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 rounded-2xl gradient-purple flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">No data yet</h3>
            <p className="text-[--text-secondary]">
              Data updates automatically every few hours.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 mt-8 bg-white/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between text-sm text-[--text-secondary]">
          <p>Data refreshes every 5 minutes</p>
          <p>Powered by ESPN & The Odds API</p>
        </div>
      </footer>
    </main>
  );
}
