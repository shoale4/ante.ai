import { NextRequest, NextResponse } from "next/server";
import { analyzeGame, generateQuickAnalysis } from "@/lib/ai-analysis";
import { GameOdds } from "@/lib/types";
import { NewsItem } from "@/lib/news";
import { GameWeather } from "@/lib/weather";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { game, weather, relatedNews, useAI = true } = body as {
      game: GameOdds;
      weather?: GameWeather;
      relatedNews?: NewsItem[];
      useAI?: boolean;
    };

    if (!game) {
      return NextResponse.json(
        { error: "Game data required" },
        { status: 400 }
      );
    }

    const context = {
      game,
      weather,
      relatedNews: relatedNews || [],
    };

    // Use quick analysis as fallback or if AI is disabled
    if (!useAI || !process.env.ANTHROPIC_API_KEY) {
      const analysis = generateQuickAnalysis(context);
      return NextResponse.json({ analysis, source: "heuristic" });
    }

    // Use AI analysis
    const analysis = await analyzeGame(context);

    if (!analysis) {
      // Fall back to quick analysis
      const fallback = generateQuickAnalysis(context);
      return NextResponse.json({ analysis: fallback, source: "heuristic" });
    }

    return NextResponse.json({ analysis, source: "ai" });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
