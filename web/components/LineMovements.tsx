"use client";

import { LineMovement } from "@/lib/types";

interface Props {
  movements: LineMovement[];
}

export function LineMovements({ movements }: Props) {
  if (movements.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-gray-400 text-center">
        No significant line movements detected yet. Check back after more data
        is collected.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">Game</th>
              <th className="px-4 py-3 text-left">Market</th>
              <th className="px-4 py-3 text-left">Book</th>
              <th className="px-4 py-3 text-right">Open</th>
              <th className="px-4 py-3 text-right">Current</th>
              <th className="px-4 py-3 text-right">Movement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {movements.map((m, i) => (
              <tr key={i} className="hover:bg-gray-750">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">
                    {m.awayTeam} @ {m.homeTeam}
                  </div>
                  <div className="text-xs text-gray-400">
                    {m.sport} &middot;{" "}
                    {new Date(m.eventStartTime).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-300 capitalize">
                    {m.marketType}
                  </span>
                  <span className="text-gray-500 ml-1">({m.outcome})</span>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-gray-700 px-2 py-1 rounded text-xs font-medium text-gray-200">
                    {m.book}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-400">
                  {formatOdds(m.openingPrice, m.openingLine, m.marketType)}
                </td>
                <td className="px-4 py-3 text-right text-white font-medium">
                  {formatOdds(m.currentPrice, m.currentLine, m.marketType)}
                </td>
                <td className="px-4 py-3 text-right">
                  <MovementBadge
                    lineMovement={m.lineMovement}
                    priceMovement={m.priceMovement}
                    marketType={m.marketType}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatOdds(
  price: number,
  line: number | null,
  marketType: string
): string {
  const priceStr = price > 0 ? `+${price}` : `${price}`;

  if (marketType === "moneyline") {
    return priceStr;
  }

  if (line !== null) {
    const lineStr = line > 0 ? `+${line}` : `${line}`;
    return `${lineStr} (${priceStr})`;
  }

  return priceStr;
}

function MovementBadge({
  lineMovement,
  priceMovement,
  marketType,
}: {
  lineMovement: number | null;
  priceMovement: number;
  marketType: string;
}) {
  const hasLineMove = lineMovement !== null && lineMovement !== 0;
  const hasPriceMove = priceMovement !== 0;

  if (!hasLineMove && !hasPriceMove) {
    return <span className="text-gray-500">-</span>;
  }

  const parts: string[] = [];

  if (hasLineMove && marketType !== "moneyline") {
    const sign = lineMovement! > 0 ? "+" : "";
    parts.push(`${sign}${lineMovement}`);
  }

  if (hasPriceMove) {
    const sign = priceMovement > 0 ? "+" : "";
    parts.push(`${sign}${priceMovement}`);
  }

  const isPositive =
    (lineMovement && lineMovement > 0) || (!lineMovement && priceMovement > 0);
  const colorClass = isPositive
    ? "bg-green-900/50 text-green-400"
    : "bg-red-900/50 text-red-400";

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
      {parts.join(" / ")}
    </span>
  );
}
