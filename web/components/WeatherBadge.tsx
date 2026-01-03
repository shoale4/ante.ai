"use client";

import { GameWeather } from "@/lib/weather";

interface Props {
  weather: GameWeather | null;
}

export function WeatherBadge({ weather }: Props) {
  if (!weather) return null;

  if (weather.isDome) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-lg text-xs">
        <span>🏟️</span>
        <span className="text-gray-600 font-medium">Dome</span>
      </div>
    );
  }

  // Determine badge color based on conditions
  let bgClass = "bg-green-50 text-green-700";
  if (weather.alerts.some((a) => a.severity === "high")) {
    bgClass = "bg-red-50 text-red-700";
  } else if (weather.alerts.some((a) => a.severity === "medium")) {
    bgClass = "bg-orange-50 text-orange-700";
  }

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${bgClass}`}>
      <span>{weather.icon}</span>
      <span className="font-medium">{weather.temperature}°F</span>
      {weather.windSpeed >= 10 && (
        <span className="text-gray-500">💨{weather.windSpeed}mph</span>
      )}
    </div>
  );
}

export function WeatherDetail({ weather }: Props) {
  if (!weather || weather.isDome) return null;

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{weather.icon}</span>
          <div>
            <div className="font-semibold text-lg">{weather.temperature}°F</div>
            <div className="text-xs text-gray-500">
              Feels like {weather.feelsLike}°F
            </div>
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="text-gray-600">{weather.condition}</div>
          <div className="text-gray-500">
            💨 {weather.windSpeed} mph (gusts {weather.windGusts})
          </div>
        </div>
      </div>

      {weather.precipitationChance > 0 && (
        <div className="text-sm text-gray-600 mb-2">
          {weather.precipitationType === "snow" ? "❄️" : "🌧️"}{" "}
          {weather.precipitationChance}% chance of {weather.precipitationType}
        </div>
      )}

      {weather.alerts.length > 0 && (
        <div className="space-y-1">
          {weather.alerts.map((alert, i) => (
            <div
              key={i}
              className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1.5 ${
                alert.severity === "high"
                  ? "bg-red-100 text-red-700"
                  : alert.severity === "medium"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              <span>{alert.icon}</span>
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
