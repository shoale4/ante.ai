import { GameOdds } from "./types";
import { NewsItem } from "./news";
import { GameWeather } from "./weather";

export interface AIAnalysis {
  gameId: string;
  pick: "home" | "away" | "over" | "under" | "pass";
  confidence: number; // 0-100
  reasoning: string;
  keyFactors: string[];
  riskLevel: "low" | "medium" | "high";
  bestBet: {
    type: "spread" | "moneyline" | "total";
    side: string;
    line?: number;
    odds: number;
    book: string;
  } | null;
  edgeEstimate?: number; // Estimated edge percentage
  generatedAt: string;
}

interface AnalysisContext {
  game: GameOdds;
  weather?: GameWeather;
  relatedNews: NewsItem[];
  lineMovements?: {
    spread?: { open: number; current: number };
    total?: { open: number; current: number };
  };
}

// Generate analysis prompt for Claude
function buildAnalysisPrompt(context: AnalysisContext): string {
  const { game, weather, relatedNews, lineMovements } = context;

  // Get best odds for each market
  const homeML = game.markets.moneyline.find(o => o.outcome === "home");
  const awayML = game.markets.moneyline.find(o => o.outcome === "away");
  const homeSpread = game.markets.spread.find(o => o.outcome === "home");
  const awaySpread = game.markets.spread.find(o => o.outcome === "away");
  const over = game.markets.total.find(o => o.outcome === "over");
  const under = game.markets.total.find(o => o.outcome === "under");

  let prompt = `Analyze this ${game.sport} game and provide a betting recommendation:

**MATCHUP**
${game.awayTeam} @ ${game.homeTeam}
Game Time: ${new Date(game.eventStartTime).toLocaleString()}

**CURRENT ODDS**
Spread: ${game.homeTeam} ${homeSpread?.currentLine ?? "N/A"} (${homeSpread?.currentPrice ?? "N/A"}) | ${game.awayTeam} ${awaySpread?.currentLine ?? "N/A"} (${awaySpread?.currentPrice ?? "N/A"})
Moneyline: ${game.homeTeam} ${homeML?.currentPrice ?? "N/A"} | ${game.awayTeam} ${awayML?.currentPrice ?? "N/A"}
Total: O/U ${over?.currentLine ?? "N/A"} (Over ${over?.currentPrice ?? "N/A"} | Under ${under?.currentPrice ?? "N/A"})
`;

  if (lineMovements) {
    prompt += `
**LINE MOVEMENT**
${lineMovements.spread ? `Spread opened ${lineMovements.spread.open}, now ${lineMovements.spread.current}` : ""}
${lineMovements.total ? `Total opened ${lineMovements.total.open}, now ${lineMovements.total.current}` : ""}
`;
  }

  if (weather && !weather.isDome) {
    prompt += `
**WEATHER**
Temperature: ${weather.temperature}°F (feels like ${weather.feelsLike}°F)
Wind: ${weather.windSpeed} mph (gusts ${weather.windGusts} mph)
Conditions: ${weather.condition}
${weather.precipitationChance > 20 ? `Precipitation: ${weather.precipitationChance}% chance of ${weather.precipitationType}` : ""}
${weather.alerts.length > 0 ? `Alerts: ${weather.alerts.map(a => a.message).join(", ")}` : ""}
`;
  } else if (weather?.isDome) {
    prompt += `
**VENUE**: Dome/Indoor stadium
`;
  }

  if (relatedNews.length > 0) {
    prompt += `
**RECENT NEWS**
${relatedNews.slice(0, 5).map(n => `- [${n.category.toUpperCase()}] ${n.title}`).join("\n")}
`;
  }

  prompt += `
**INSTRUCTIONS**
Analyze all available information and provide:
1. Your recommended bet (spread, moneyline, or total - or "pass" if no clear edge)
2. Confidence level (0-100)
3. Brief reasoning (2-3 sentences)
4. Key factors that influenced your decision (bullet points)
5. Risk assessment (low/medium/high)

Consider:
- Line movement direction (sharp money indicators)
- Weather impact on scoring (for outdoor games)
- Injury news and its impact
- Historical trends
- Current odds value

Respond in this exact JSON format:
{
  "pick": "home" | "away" | "over" | "under" | "pass",
  "betType": "spread" | "moneyline" | "total",
  "confidence": <number 0-100>,
  "reasoning": "<2-3 sentences>",
  "keyFactors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "riskLevel": "low" | "medium" | "high"
}`;

  return prompt;
}

// Call Claude API for analysis
export async function analyzeGame(context: AnalysisContext): Promise<AIAnalysis | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set");
    return null;
  }

  const prompt = buildAnalysisPrompt(context);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Claude API error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      return null;
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Build the best bet info
    const { game } = context;
    let bestBet: AIAnalysis["bestBet"] = null;

    if (parsed.pick !== "pass") {
      const betType = parsed.betType || "spread";
      let marketOdds;
      let side = "";
      let line: number | undefined;

      if (betType === "moneyline") {
        marketOdds = game.markets.moneyline.find(
          o => o.outcome === parsed.pick
        );
        side = parsed.pick === "home" ? game.homeTeam : game.awayTeam;
      } else if (betType === "spread") {
        marketOdds = game.markets.spread.find(
          o => o.outcome === (parsed.pick === "home" || parsed.pick === "away" ? parsed.pick : "home")
        );
        side = parsed.pick === "home" ? game.homeTeam : game.awayTeam;
        line = marketOdds?.currentLine ?? undefined;
      } else if (betType === "total") {
        marketOdds = game.markets.total.find(
          o => o.outcome === parsed.pick
        );
        side = parsed.pick === "over" ? "Over" : "Under";
        line = marketOdds?.currentLine ?? undefined;
      }

      if (marketOdds) {
        bestBet = {
          type: betType,
          side,
          line,
          odds: marketOdds.currentPrice,
          book: marketOdds.book,
        };
      }
    }

    return {
      gameId: game.eventId,
      pick: parsed.pick,
      confidence: Math.min(100, Math.max(0, parsed.confidence)),
      reasoning: parsed.reasoning,
      keyFactors: parsed.keyFactors || [],
      riskLevel: parsed.riskLevel || "medium",
      bestBet,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error analyzing game:", error);
    return null;
  }
}

// Generate a quick heuristic-based analysis (no API call)
// Used as fallback or for preview
export function generateQuickAnalysis(context: AnalysisContext): AIAnalysis {
  const { game, weather, relatedNews } = context;

  let confidence = 50;
  const keyFactors: string[] = [];
  let pick: AIAnalysis["pick"] = "pass";
  let riskLevel: AIAnalysis["riskLevel"] = "medium";

  // Check for significant line movement
  const homeSpread = game.markets.spread.find(o => o.outcome === "home");
  if (homeSpread && homeSpread.lineMovement) {
    const movement = Math.abs(homeSpread.lineMovement);
    if (movement >= 1) {
      keyFactors.push(`Line moved ${movement} points - sharp action detected`);
      confidence += 10;
    }
  }

  // Check weather impact for NFL
  if (game.sport === "NFL" && weather && !weather.isDome) {
    if (weather.windSpeed >= 15) {
      keyFactors.push(`High winds (${weather.windSpeed} mph) favor the under`);
      pick = "under";
      confidence += 5;
    }
    if (weather.temperature <= 32) {
      keyFactors.push(`Cold weather (${weather.temperature}°F) may affect scoring`);
    }
    if (weather.precipitationChance >= 50) {
      keyFactors.push(`${weather.precipitationChance}% precipitation chance`);
      pick = "under";
      confidence += 5;
    }
  }

  // Check injury news
  const injuryNews = relatedNews.filter(n => n.category === "injury");
  if (injuryNews.length > 0) {
    const negativeInjuries = injuryNews.filter(n => n.sentiment === "negative");
    if (negativeInjuries.length > 0) {
      keyFactors.push(`Key injury news affecting this game`);
      riskLevel = "high";
    }
  }

  // If no strong signals, pass
  if (keyFactors.length === 0) {
    keyFactors.push("No strong betting signals detected");
    confidence = 40;
    riskLevel = "low";
  }

  // Get best odds for the pick
  let bestBet: AIAnalysis["bestBet"] = null;
  if (pick === "under") {
    const marketOdds = game.markets.total.find(o => o.outcome === "under");
    if (marketOdds) {
      bestBet = {
        type: "total",
        side: "Under",
        line: marketOdds.currentLine ?? undefined,
        odds: marketOdds.currentPrice,
        book: marketOdds.book,
      };
    }
  }

  return {
    gameId: game.eventId,
    pick,
    confidence,
    reasoning: pick === "pass"
      ? "No clear betting edge identified. Consider passing on this game."
      : `Based on ${keyFactors.length} factors, there may be value on the ${pick}.`,
    keyFactors,
    riskLevel,
    bestBet,
    generatedAt: new Date().toISOString(),
  };
}
