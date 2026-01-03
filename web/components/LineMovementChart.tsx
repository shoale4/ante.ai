"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface HistoricalOdds {
  timestamp: string;
  book: string;
  sport: string;
  eventId: string;
  marketType: string;
  outcome: string;
  price: number;
  line: number | null;
}

interface ChartDataPoint {
  timestamp: string;
  time: string;
  [key: string]: string | number | null;
}

interface Props {
  eventId: string;
  marketType: "moneyline" | "spread" | "total";
  homeTeam: string;
  awayTeam: string;
}

const BOOK_COLORS: Record<string, string> = {
  fanduel: "#1493ff",
  draftkings: "#53d337",
  betmgm: "#c4a900",
  caesars: "#00875a",
  pointsbetus: "#ff6b35",
  bet365: "#027b5b",
  betonlineag: "#ff4444",
};

export function LineMovementChart({ eventId, marketType, homeTeam, awayTeam }: Props) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<string[]>([]);
  const [selectedOutcome, setSelectedOutcome] = useState<"home" | "away" | "over" | "under">(
    marketType === "total" ? "over" : "home"
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/odds-history?eventId=${eventId}&marketType=${marketType}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const result = await response.json();

        if (!result.data || result.data.length === 0) {
          setData([]);
          setBooks([]);
          setLoading(false);
          return;
        }

        // Get unique books
        const uniqueBooks = result.meta?.books || [];
        setBooks(uniqueBooks);

        // Filter by selected outcome
        const filteredData = result.data.filter(
          (d: HistoricalOdds) => d.outcome === selectedOutcome
        );

        // Transform data for chart - group by timestamp
        const timeMap = new Map<string, ChartDataPoint>();

        for (const item of filteredData) {
          const timestamp = item.timestamp;
          const timeLabel = new Date(timestamp).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });

          if (!timeMap.has(timestamp)) {
            timeMap.set(timestamp, {
              timestamp,
              time: timeLabel,
            });
          }

          const point = timeMap.get(timestamp)!;
          // For spread/total, show line; for moneyline, show price
          const value = marketType === "moneyline" ? item.price : item.line;
          point[item.book] = value;
        }

        // Convert to array and sort by time
        const chartData = Array.from(timeMap.values()).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setData(chartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [eventId, marketType, selectedOutcome]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No historical data available</p>
          <p className="text-sm">Line movement data will appear after multiple odds updates</p>
        </div>
      </div>
    );
  }

  const outcomeOptions = marketType === "total"
    ? [{ value: "over", label: "Over" }, { value: "under", label: "Under" }]
    : [{ value: "home", label: homeTeam }, { value: "away", label: awayTeam }];

  const yAxisLabel = marketType === "moneyline" ? "American Odds" : "Line";

  return (
    <div className="space-y-4">
      {/* Outcome Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Show:</span>
        {outcomeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedOutcome(opt.value as typeof selectedOutcome)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedOutcome === opt.value
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              label={{
                value: yAxisLabel,
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11, fill: "#6b7280" },
              }}
              domain={marketType === "moneyline" ? ["auto", "auto"] : ["dataMin - 0.5", "dataMax + 0.5"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => [
                marketType === "moneyline"
                  ? value > 0 ? `+${value}` : value
                  : value,
                name.charAt(0).toUpperCase() + name.slice(1),
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            />
            {books.map((book) => (
              <Line
                key={book}
                type="stepAfter"
                dataKey={book}
                stroke={BOOK_COLORS[book] || "#888888"}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Book Legend with Colors */}
      <div className="flex flex-wrap gap-3 text-xs">
        {books.map((book) => (
          <div key={book} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: BOOK_COLORS[book] || "#888888" }}
            />
            <span className="capitalize">{book}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
