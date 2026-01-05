import { getGameOdds, getLineMovements } from "@/lib/data";
import { UnifiedFeed } from "@/components/UnifiedFeed";
import { fetchAllESPNNews } from "@/lib/espn-news";
import { getWeatherForGames, GameWeather } from "@/lib/weather";
import { ArbitrageFinder, ArbitrageBadge } from "@/components/ArbitrageFinder";
import { ProTeaser } from "@/components/ProTeaser";

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
              {/* Logo Icon */}
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                    <polyline points="16 7 22 7 22 13"></polyline>
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-[8px] font-bold">AI</span>
                </div>
              </div>
              {/* Logo Text */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">ante</span>
                  <span className="text-gray-800">.ai</span>
                </h1>
                <p className="text-[10px] font-medium text-[--text-secondary] tracking-widest uppercase">Smart Odds Tracking</p>
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

        {/* Pro Features Teaser */}
        <div className="grid sm:grid-cols-2 gap-4">
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
