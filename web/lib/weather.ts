import { getStadiumForTeam, isOutdoorStadium } from "./stadiums";

export interface GameWeather {
  temperature: number; // Fahrenheit
  feelsLike: number;
  windSpeed: number; // mph
  windGusts: number; // mph
  precipitationChance: number; // 0-100
  precipitationType: "none" | "rain" | "snow" | "mixed";
  condition: string;
  icon: string;
  alerts: WeatherAlert[];
  isDome: boolean;
}

export interface WeatherAlert {
  type: "wind" | "cold" | "rain" | "snow" | "heat";
  severity: "low" | "medium" | "high";
  message: string;
  icon: string;
}

// Open-Meteo API (free, no API key required)
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

export async function getWeatherForGame(
  homeTeam: string,
  gameTime: string
): Promise<GameWeather | null> {
  // Check if outdoor stadium
  if (!isOutdoorStadium(homeTeam)) {
    return {
      temperature: 72,
      feelsLike: 72,
      windSpeed: 0,
      windGusts: 0,
      precipitationChance: 0,
      precipitationType: "none",
      condition: "Dome",
      icon: "🏟️",
      alerts: [],
      isDome: true,
    };
  }

  const stadium = getStadiumForTeam(homeTeam);
  if (!stadium) return null;

  try {
    const gameDate = new Date(gameTime);
    const dateStr = gameDate.toISOString().split("T")[0];
    const hour = gameDate.getHours();

    const response = await fetch(
      `${OPEN_METEO_URL}?latitude=${stadium.lat}&longitude=${stadium.lon}` +
        `&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,weather_code` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch` +
        `&start_date=${dateStr}&end_date=${dateStr}`,
      { next: { revalidate: 1800 } } // Cache for 30 minutes
    );

    if (!response.ok) {
      console.error("Weather API error:", response.status);
      return null;
    }

    const data = await response.json();
    const hourlyData = data.hourly;

    // Get weather at game time (or closest hour)
    const hourIndex = Math.min(hour, 23);

    const temp = Math.round(hourlyData.temperature_2m[hourIndex]);
    const feelsLike = Math.round(hourlyData.apparent_temperature[hourIndex]);
    const windSpeed = Math.round(hourlyData.wind_speed_10m[hourIndex]);
    const windGusts = Math.round(hourlyData.wind_gusts_10m[hourIndex]);
    const precipChance = hourlyData.precipitation_probability[hourIndex] || 0;
    const precip = hourlyData.precipitation[hourIndex] || 0;
    const weatherCode = hourlyData.weather_code[hourIndex];

    // Determine precipitation type based on temperature and weather code
    let precipType: "none" | "rain" | "snow" | "mixed" = "none";
    if (precipChance > 30) {
      if (temp <= 32) {
        precipType = "snow";
      } else if (temp <= 40 && weatherCode >= 70) {
        precipType = "mixed";
      } else {
        precipType = "rain";
      }
    }

    // Get condition and icon from weather code
    const { condition, icon } = getWeatherCondition(weatherCode, temp);

    // Generate alerts
    const alerts = generateWeatherAlerts(
      temp,
      windSpeed,
      windGusts,
      precipChance,
      precipType
    );

    return {
      temperature: temp,
      feelsLike,
      windSpeed,
      windGusts,
      precipitationChance: precipChance,
      precipitationType: precipType,
      condition,
      icon,
      alerts,
      isDome: false,
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    return null;
  }
}

function getWeatherCondition(
  code: number,
  temp: number
): { condition: string; icon: string } {
  // WMO Weather codes: https://open-meteo.com/en/docs
  if (code === 0) return { condition: "Clear", icon: "☀️" };
  if (code <= 3) return { condition: "Partly Cloudy", icon: "⛅" };
  if (code <= 49) return { condition: "Cloudy", icon: "☁️" };
  if (code <= 59) return { condition: "Drizzle", icon: "🌧️" };
  if (code <= 69) return { condition: temp <= 32 ? "Snow" : "Rain", icon: temp <= 32 ? "🌨️" : "🌧️" };
  if (code <= 79) return { condition: "Snow", icon: "❄️" };
  if (code <= 84) return { condition: "Rain Showers", icon: "🌦️" };
  if (code <= 94) return { condition: "Snow Showers", icon: "🌨️" };
  if (code >= 95) return { condition: "Thunderstorm", icon: "⛈️" };
  return { condition: "Unknown", icon: "🌡️" };
}

function generateWeatherAlerts(
  temp: number,
  windSpeed: number,
  windGusts: number,
  precipChance: number,
  precipType: string
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  // Wind alerts (affects passing game)
  if (windGusts >= 25) {
    alerts.push({
      type: "wind",
      severity: "high",
      message: `Gusts ${windGusts}mph - Major passing impact`,
      icon: "💨",
    });
  } else if (windSpeed >= 15 || windGusts >= 20) {
    alerts.push({
      type: "wind",
      severity: "medium",
      message: `Wind ${windSpeed}mph - Affects deep balls`,
      icon: "💨",
    });
  }

  // Cold alerts (affects kicking, grip)
  if (temp <= 20) {
    alerts.push({
      type: "cold",
      severity: "high",
      message: `${temp}°F - Extreme cold, kicking affected`,
      icon: "🥶",
    });
  } else if (temp <= 32) {
    alerts.push({
      type: "cold",
      severity: "medium",
      message: `${temp}°F - Cold conditions`,
      icon: "🥶",
    });
  }

  // Heat alerts
  if (temp >= 95) {
    alerts.push({
      type: "heat",
      severity: "high",
      message: `${temp}°F - Extreme heat, fatigue factor`,
      icon: "🥵",
    });
  }

  // Precipitation alerts
  if (precipChance >= 70 && precipType === "snow") {
    alerts.push({
      type: "snow",
      severity: "high",
      message: `${precipChance}% snow chance - Major impact`,
      icon: "❄️",
    });
  } else if (precipChance >= 70 && precipType === "rain") {
    alerts.push({
      type: "rain",
      severity: "medium",
      message: `${precipChance}% rain chance - Ball handling affected`,
      icon: "🌧️",
    });
  } else if (precipChance >= 50) {
    alerts.push({
      type: "rain",
      severity: "low",
      message: `${precipChance}% precip chance`,
      icon: precipType === "snow" ? "🌨️" : "🌧️",
    });
  }

  return alerts;
}

// Batch fetch weather for multiple games
export async function getWeatherForGames(
  games: { homeTeam: string; eventStartTime: string }[]
): Promise<Map<string, GameWeather>> {
  const weatherMap = new Map<string, GameWeather>();

  // Only fetch for NFL games (check team names)
  const nflGames = games.filter((g) =>
    Object.keys(require("./stadiums").NFL_STADIUMS).includes(g.homeTeam)
  );

  await Promise.all(
    nflGames.map(async (game) => {
      const weather = await getWeatherForGame(game.homeTeam, game.eventStartTime);
      if (weather) {
        weatherMap.set(game.homeTeam, weather);
      }
    })
  );

  return weatherMap;
}
