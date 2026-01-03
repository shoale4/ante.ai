"use client";

import { LineMovement } from "@/lib/types";

interface Props {
  movement: LineMovement;
}

export function MovementFeedCard({ movement }: Props) {
  const isSignificant = Math.abs(movement.priceMovement) >= 15;
  const direction = movement.priceMovement > 0 ? "up" : "down";

  const timeAgo = getTimeAgo(movement.lastUpdated);

  // Format the movement display
  const formatLine = (line: number | null) => {
    if (line === null) return "";
    if (movement.marketType === "spread") {
      return line > 0 ? `+${line}` : `${line}`;
    }
    if (movement.marketType === "total") {
      return `${line}`;
    }
    return "";
  };

  const formatPrice = (price: number) => {
    return price > 0 ? `+${price}` : `${price}`;
  };

  // Get readable market type
  const marketLabel =
    movement.marketType === "moneyline"
      ? "ML"
      : movement.marketType === "spread"
      ? "Spread"
      : "Total";

  // Get team/side being shown
  const getSide = () => {
    if (movement.outcome === "home") return movement.homeTeam;
    if (movement.outcome === "away") return movement.awayTeam;
    if (movement.outcome === "over") return "Over";
    if (movement.outcome === "under") return "Under";
    return movement.outcome;
  };

  return (
    <div
      className={`glass-card p-4 ${
        isSignificant ? "ring-2 ring-orange-400/50" : ""
      }`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <span
            className={`text-xs font-semibold text-white px-2 py-0.5 rounded-full ${
              isSignificant
                ? "bg-gradient-to-r from-orange-500 to-red-500"
                : "bg-gradient-to-r from-purple-600 to-purple-500"
            }`}
          >
            {isSignificant ? "SHARP MOVE" : "LINE MOVE"}
          </span>
          <span className="text-xs font-medium text-[--text-secondary]">
            {movement.sport}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[--text-secondary]">{timeAgo}</span>
        </div>
      </div>

      {/* Movement Content */}
      <div className="flex items-center justify-between">
        {/* Game Info */}
        <div>
          <div className="font-semibold text-sm mb-1">
            {movement.awayTeam} @ {movement.homeTeam}
          </div>
          <div className="flex items-center gap-2 text-xs text-[--text-secondary]">
            <span className="font-medium">{getSide()}</span>
            <span className="px-1.5 py-0.5 bg-gray-100 rounded">{marketLabel}</span>
            <span className="capitalize">{movement.book}</span>
          </div>
        </div>

        {/* Movement Arrow */}
        <div className="flex items-center gap-3">
          {/* Old Value */}
          <div className="text-right">
            {movement.openingLine !== null && (
              <div className="text-sm text-[--text-secondary]">
                {formatLine(movement.openingLine)}
              </div>
            )}
            <div className="text-sm text-[--text-secondary]">
              {formatPrice(movement.openingPrice)}
            </div>
          </div>

          {/* Arrow */}
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              direction === "up"
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            <svg
              className={`w-4 h-4 ${direction === "down" ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </div>

          {/* New Value */}
          <div className="text-right">
            {movement.currentLine !== null && (
              <div className="text-sm font-semibold">
                {formatLine(movement.currentLine)}
              </div>
            )}
            <div
              className={`text-sm font-bold ${
                direction === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatPrice(movement.currentPrice)}
            </div>
          </div>

          {/* Movement Badge */}
          <div
            className={`px-2 py-1 rounded-lg text-xs font-bold ${
              direction === "up"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {direction === "up" ? "+" : ""}
            {movement.priceMovement}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
