import { getGameOdds, getLineMovements } from "@/lib/data";
import { LineMovements } from "@/components/LineMovements";
import { SportTabs } from "@/components/SportTabs";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
  const [games, movements] = await Promise.all([
    getGameOdds(),
    getLineMovements(),
  ]);

  const nflGames = games.filter((g) => g.sport === "NFL");
  const nbaGames = games.filter((g) => g.sport === "NBA");

  const bookCount = new Set(
    games.flatMap((g) => Object.values(g.markets).flat().map((m) => m.book))
  ).size;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-6 py-4">
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
              <span className="pill pill-purple">
                {bookCount} books
              </span>
              <span className="pill pill-green">
                {games.length} games
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Games Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Games</h2>
            <p className="text-[--text-secondary] mt-1">Compare odds across sportsbooks · Click any game for details</p>
          </div>
          <SportTabs nflGames={nflGames} nbaGames={nbaGames} />
        </section>

        {/* Line Movements Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Line Movements</h2>
              <p className="text-[--text-secondary] mt-1">Track where the sharp money is going</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-green-600">Live</span>
            </div>
          </div>
          <LineMovements movements={movements.slice(0, 15)} />
        </section>

        {/* Empty State */}
        {games.length === 0 && movements.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 rounded-2xl gradient-purple flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">No odds data yet</h3>
            <p className="text-[--text-secondary]">
              Data updates automatically every few hours.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 mt-12 bg-white/50">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-[--text-secondary]">
          <p>Data refreshes every 6 hours</p>
          <p>Built with Next.js</p>
        </div>
      </footer>
    </main>
  );
}
