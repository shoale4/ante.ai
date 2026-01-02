"use client";

import { LineMovement } from "@/lib/types";

interface Props {
  movements: LineMovement[];
}

export function LineMovements({ movements }: Props) {
  if (movements.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-[--text-secondary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <p className="text-[--text-secondary] font-medium">No significant line movements yet</p>
        <p className="text-sm text-[--text-secondary] mt-1">
          Check back after more data is collected
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200/60">
              <th className="px-5 py-4 text-left text-sm font-medium text-[--text-secondary]">Game</th>
              <th className="px-5 py-4 text-left text-sm font-medium text-[--text-secondary]">Market</th>
              <th className="px-5 py-4 text-left text-sm font-medium text-[--text-secondary]">Book</th>
              <th className="px-5 py-4 text-right text-sm font-medium text-[--text-secondary]">Open</th>
              <th className="px-5 py-4 text-right text-sm font-medium text-[--text-secondary]">Current</th>
              <th className="px-5 py-4 text-right text-sm font-medium text-[--text-secondary]">Move</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/60">
            {movements.map((m, i) => (
              <tr key={i} className="hover:bg-gray-100/50">
                <td className="px-5 py-4">
                  <div className="font-medium text-[--foreground]">
                    {m.awayTeam} @ {m.homeTeam}
                  </div>
                  <div className="text-sm text-[--text-secondary]">
                    {m.sport} · {new Date(m.eventStartTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="capitalize text-[--foreground]">{m.marketType}</span>
                  <span className="text-[--text-secondary] ml-1">({m.outcome})</span>
                </td>
                <td className="px-5 py-4">
                  <span className="pill pill-gray capitalize">{m.book}</span>
                </td>
                <td className="px-5 py-4 text-right text-[--text-secondary]">
                  {formatOdds(m.openingPrice, m.openingLine, m.marketType)}
                </td>
                <td className="px-5 py-4 text-right font-medium text-[--foreground]">
                  {formatOdds(m.currentPrice, m.currentLine, m.marketType)}
                </td>
                <td className="px-5 py-4 text-right">
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

function formatOdds(price: number, line: number | null, marketType: string): string {
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
    return <span className="text-[--text-secondary]">—</span>;
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

  const isPositive = (lineMovement && lineMovement > 0) || (!lineMovement && priceMovement > 0);

  return (
    <span className={`pill ${isPositive ? "pill-green" : "pill-red"}`}>
      {isPositive ? "↑" : "↓"} {parts.join(" / ")}
    </span>
  );
}
