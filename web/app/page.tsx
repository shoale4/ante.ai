import { getGameOdds, getLineMovements } from "@/lib/data";
import { LineMovements } from "@/components/LineMovements";
import { BestOdds } from "@/components/BestOdds";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
  const [games, movements] = await Promise.all([
    getGameOdds(),
    getLineMovements(),
  ]);

  const nflGames = games.filter((g) => g.sport === "NFL");
  const nbaGames = games.filter((g) => g.sport === "NBA");

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">
            Ante<span className="text-blue-500">AI</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time odds tracking &amp; line movement alerts
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Line Movements Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Line Movements</h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              Sharp money indicator
            </span>
          </div>
          <LineMovements movements={movements.slice(0, 20)} />
        </section>

        {/* Best Odds - NFL */}
        {nflGames.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">NFL</h2>
              <span className="text-xs text-gray-500">
                {nflGames.length} games
              </span>
            </div>
            <BestOdds games={nflGames} />
          </section>
        )}

        {/* Best Odds - NBA */}
        {nbaGames.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">NBA</h2>
              <span className="text-xs text-gray-500">
                {nbaGames.length} games
              </span>
            </div>
            <BestOdds games={nbaGames} />
          </section>
        )}

        {/* No Data State */}
        {games.length === 0 && movements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No odds data available yet.</p>
            <p className="text-gray-500 text-sm mt-2">
              Data updates automatically every few hours.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>
            Data refreshes every 6 hours &middot; Tracking{" "}
            {new Set(games.flatMap((g) =>
              Object.values(g.markets).flat().map((m) => m.book)
            )).size}{" "}
            sportsbooks
          </p>
        </div>
      </footer>
    </main>
  );
}
