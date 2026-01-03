"use client";

import { useState } from "react";
import { AIAnalysis as AIAnalysisType } from "@/lib/ai-analysis";
import { GameOdds } from "@/lib/types";
import { NewsItem } from "@/lib/news";
import { GameWeather } from "@/lib/weather";

interface Props {
  game: GameOdds;
  weather?: GameWeather;
  relatedNews?: NewsItem[];
  compact?: boolean;
}

export function AIAnalysis({ game, weather, relatedNews, compact = false }: Props) {
  const [analysis, setAnalysis] = useState<AIAnalysisType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "heuristic" | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, weather, relatedNews }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setSource(data.source);
    } catch (err) {
      setError("Failed to analyze game");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Compact view - just show a button and badge
  if (compact && !analysis) {
    return (
      <button
        onClick={fetchAnalysis}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 transition-all"
      >
        {loading ? (
          <>
            <span className="animate-spin">⚡</span>
            Analyzing...
          </>
        ) : (
          <>
            <span>🤖</span>
            AI Pick
          </>
        )}
      </button>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-red-500 flex items-center gap-1">
        <span>⚠️</span> {error}
        <button onClick={fetchAnalysis} className="underline ml-1">
          Retry
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <button
        onClick={fetchAnalysis}
        disabled={loading}
        className="glass-card p-4 w-full text-left hover:shadow-lg transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-lg">
              🤖
            </div>
            <div>
              <div className="font-semibold">AI Analysis</div>
              <div className="text-xs text-[--text-secondary]">
                Get betting recommendation
              </div>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <span className="animate-spin">⚡</span>
              Analyzing...
            </div>
          ) : (
            <div className="text-sm text-purple-600 font-medium">
              Click to analyze →
            </div>
          )}
        </div>
      </button>
    );
  }

  // Full analysis display
  const confidenceColor =
    analysis.confidence >= 70
      ? "text-green-600 bg-green-100"
      : analysis.confidence >= 50
      ? "text-yellow-600 bg-yellow-100"
      : "text-red-600 bg-red-100";

  const pickDisplay = getPickDisplay(analysis, game);

  return (
    <div className="glass-card p-4 border-l-4 border-purple-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
            AI ANALYSIS
          </span>
          {source === "heuristic" && (
            <span className="text-[10px] text-gray-400">(quick mode)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-1 rounded-lg ${confidenceColor}`}
          >
            {analysis.confidence}% confident
          </span>
        </div>
      </div>

      {/* Pick */}
      {analysis.pick !== "pass" ? (
        <div className="mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold">{pickDisplay.emoji}</div>
            <div>
              <div className="font-bold text-lg">{pickDisplay.label}</div>
              {analysis.bestBet && (
                <div className="text-sm text-[--text-secondary]">
                  {analysis.bestBet.line !== undefined && (
                    <span>
                      {analysis.bestBet.line > 0 ? "+" : ""}
                      {analysis.bestBet.line}{" "}
                    </span>
                  )}
                  <span
                    className={
                      analysis.bestBet.odds > 0
                        ? "text-green-600 font-semibold"
                        : "font-semibold"
                    }
                  >
                    ({analysis.bestBet.odds > 0 ? "+" : ""}
                    {analysis.bestBet.odds})
                  </span>
                  <span className="text-gray-400 ml-1">
                    @ {analysis.bestBet.book}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2 text-gray-600">
          <span className="text-xl">🚫</span>
          <span className="font-semibold">No Bet Recommended</span>
        </div>
      )}

      {/* Reasoning */}
      <p className="text-sm text-[--text-secondary] mb-3">{analysis.reasoning}</p>

      {/* Key Factors */}
      {analysis.keyFactors.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Key Factors
          </div>
          <ul className="text-xs text-[--text-secondary] space-y-1">
            {analysis.keyFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-purple-500 mt-0.5">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Badge */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className={`text-xs px-2 py-1 rounded-lg font-medium ${
            analysis.riskLevel === "high"
              ? "bg-red-100 text-red-600"
              : analysis.riskLevel === "medium"
              ? "bg-yellow-100 text-yellow-600"
              : "bg-green-100 text-green-600"
          }`}
        >
          {analysis.riskLevel.toUpperCase()} RISK
        </span>
        <button
          onClick={fetchAnalysis}
          className="text-xs text-purple-600 hover:underline"
        >
          Refresh analysis
        </button>
      </div>
    </div>
  );
}

function getPickDisplay(
  analysis: AIAnalysisType,
  game: GameOdds
): { label: string; emoji: string } {
  switch (analysis.pick) {
    case "home":
      return { label: `${game.homeTeam}`, emoji: "🏠" };
    case "away":
      return { label: `${game.awayTeam}`, emoji: "✈️" };
    case "over":
      return { label: "Over", emoji: "📈" };
    case "under":
      return { label: "Under", emoji: "📉" };
    default:
      return { label: "Pass", emoji: "🚫" };
  }
}

// Compact badge version for inline display
export function AIPickBadge({ game, weather, relatedNews }: Props) {
  const [analysis, setAnalysis] = useState<AIAnalysisType | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalysis = async () => {
    if (analysis || loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, weather, relatedNews, useAI: false }), // Quick mode only for badge
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-semibold">
        <span className="animate-pulse">🤖</span> ...
      </span>
    );
  }

  if (!analysis) {
    return (
      <button
        onClick={fetchAnalysis}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-semibold hover:bg-purple-200 transition-colors"
      >
        🤖 AI Pick
      </button>
    );
  }

  if (analysis.pick === "pass") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold">
        🤖 Pass
      </span>
    );
  }

  const pickLabel =
    analysis.pick === "home"
      ? game.homeTeam.split(" ").pop()
      : analysis.pick === "away"
      ? game.awayTeam.split(" ").pop()
      : analysis.pick === "over"
      ? "Over"
      : "Under";

  const confidenceColor =
    analysis.confidence >= 70
      ? "bg-green-100 text-green-700"
      : analysis.confidence >= 50
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${confidenceColor}`}
    >
      🤖 {pickLabel} ({analysis.confidence}%)
    </span>
  );
}
