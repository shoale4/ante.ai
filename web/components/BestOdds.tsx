"use client";

import { GameOdds } from "@/lib/types";

interface Props {
  games: GameOdds[];
}

export function BestOdds({ games }: Props) {
  if (games.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-gray-400 text-center">
        No games available. Check back when odds are loaded.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <GameCard key={game.eventId} game={game} />
      ))}
    </div>
  );
}

function GameCard({ game }: { game: GameOdds }) {
  const gameTime = new Date(game.eventStartTime);
  const isToday = isSameDay(gameTime, new Date());
  const isTomorrow = isSameDay(
    gameTime,
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );

  const dateLabel = isToday
    ? "Today"
    : isTomorrow
    ? "Tomorrow"
    : gameTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const timeLabel = gameTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 flex justify-between items-center">
        <div>
          <span className="text-xs font-medium text-gray-400 uppercase">
            {game.sport}
          </span>
          <h3 className="text-white font-medium">
            {game.awayTeam} @ {game.homeTeam}
          </h3>
        </div>
        <div className="text-right text-sm text-gray-400">
          <div>{dateLabel}</div>
          <div>{timeLabel}</div>
        </div>
      </div>

      {/* Markets */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <MarketSection
          title="Moneyline"
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          odds={game.markets.moneyline}
          showLine={false}
        />
        <MarketSection
          title="Spread"
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          odds={game.markets.spread}
          showLine={true}
        />
        <MarketSection
          title="Total"
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          odds={game.markets.total}
          showLine={true}
          isTotal={true}
        />
      </div>
    </div>
  );
}

function MarketSection({
  title,
  homeTeam,
  awayTeam,
  odds,
  showLine,
  isTotal = false,
}: {
  title: string;
  homeTeam: string;
  awayTeam: string;
  odds: Array<{
    book: string;
    outcome: string;
    currentPrice: number;
    currentLine: number | null;
  }>;
  showLine: boolean;
  isTotal?: boolean;
}) {
  // Group by outcome
  const homeOdds = odds.filter((o) => o.outcome === "home");
  const awayOdds = odds.filter((o) => o.outcome === "away");
  const overOdds = odds.filter((o) => o.outcome === "over");
  const underOdds = odds.filter((o) => o.outcome === "under");

  const side1 = isTotal ? overOdds : awayOdds;
  const side2 = isTotal ? underOdds : homeOdds;
  const label1 = isTotal ? "Over" : awayTeam;
  const label2 = isTotal ? "Under" : homeTeam;

  const best1 = findBest(side1);
  const best2 = findBest(side2);

  return (
    <div className="bg-gray-750 rounded-lg p-3">
      <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
        {title}
      </h4>
      <div className="space-y-2">
        <OddsRow
          label={label1}
          best={best1}
          allOdds={side1}
          showLine={showLine}
        />
        <OddsRow
          label={label2}
          best={best2}
          allOdds={side2}
          showLine={showLine}
        />
      </div>
    </div>
  );
}

function OddsRow({
  label,
  best,
  allOdds,
  showLine,
}: {
  label: string;
  best: { book: string; price: number; line: number | null } | null;
  allOdds: Array<{
    book: string;
    currentPrice: number;
    currentLine: number | null;
  }>;
  showLine: boolean;
}) {
  if (!best) {
    return (
      <div className="flex justify-between items-center text-gray-500 text-sm">
        <span className="truncate max-w-[100px]">{label}</span>
        <span>-</span>
      </div>
    );
  }

  const priceStr = best.price > 0 ? `+${best.price}` : `${best.price}`;
  const lineStr =
    showLine && best.line !== null
      ? best.line > 0
        ? `+${best.line}`
        : `${best.line}`
      : null;

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300 text-sm truncate max-w-[100px]">
        {label}
      </span>
      <div className="text-right">
        <div className="text-white font-medium">
          {lineStr && <span className="mr-1">{lineStr}</span>}
          <span className={best.price > 0 ? "text-green-400" : ""}>
            {priceStr}
          </span>
        </div>
        <div className="text-xs text-gray-500">{best.book}</div>
      </div>
    </div>
  );
}

function findBest(
  odds: Array<{ book: string; currentPrice: number; currentLine: number | null }>
): { book: string; price: number; line: number | null } | null {
  if (odds.length === 0) return null;

  return odds.reduce((best, current) => {
    // Higher price is always better (for both + and - odds)
    return current.currentPrice > best.price
      ? { book: current.book, price: current.currentPrice, line: current.currentLine }
      : best;
  }, { book: odds[0].book, price: odds[0].currentPrice, line: odds[0].currentLine });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
