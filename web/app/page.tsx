import { getGameOdds, getLineMovements } from "@/lib/data";
import { fetchAllESPNNews } from "@/lib/espn-news";
import { getWeatherForGames, GameWeather } from "@/lib/weather";
import { ArbitrageBadge } from "@/components/ArbitrageFinder";
import { HomeClient } from "@/components/HomeClient";

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
    <main className="min-h-screen pb-24 sm:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Logo Icon */}
              <div className="relative">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                    <polyline points="16 7 22 7 22 13"></polyline>
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-[7px] sm:text-[8px] font-bold">AI</span>
                </div>
              </div>
              {/* Logo Text */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">ante</span>
                  <span className="text-gray-800">.ai</span>
                </h1>
                <p className="hidden sm:block text-[10px] font-medium text-[--text-secondary] tracking-widest uppercase">Smart Odds Tracking</p>
              </div>
            </div>
            {/* Desktop badges */}
            <div className="hidden sm:flex items-center gap-2">
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
            {/* Mobile badges - simplified */}
            <div className="flex sm:hidden items-center gap-1.5">
              <ArbitrageBadge games={games} />
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <HomeClient
        games={games}
        movements={movements}
        news={news}
        weatherData={weatherData}
      />

      {/* Footer - desktop only */}
      <footer className="hidden sm:block border-t border-gray-200/60 mt-8 bg-white/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between text-sm text-[--text-secondary]">
          <p>Data refreshes every 5 minutes</p>
          <p>Powered by ESPN & The Odds API</p>
        </div>
      </footer>
    </main>
  );
}
