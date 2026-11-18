import { currentLocation } from "@/lib/data/location";

export type WeatherKind =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "storm"
  | "snow";

export type CurrentWeather = {
  temperatureF: number;
  kind: WeatherKind;
  label: string;
  isDay: boolean;
};

/** WMO weather interpretation codes, as returned by Open-Meteo. */
function describeWeatherCode(code: number): {
  kind: WeatherKind;
  label: string;
} {
  if (code === 0) return { kind: "clear", label: "Clear" };
  if (code === 1 || code === 2)
    return { kind: "partly-cloudy", label: "Partly cloudy" };
  if (code === 3) return { kind: "cloudy", label: "Overcast" };
  if (code === 45 || code === 48) return { kind: "fog", label: "Foggy" };
  if (code >= 51 && code <= 57) return { kind: "drizzle", label: "Drizzle" };
  if (code === 61 || code === 80)
    return { kind: "drizzle", label: "Light rain" };
  if ((code >= 63 && code <= 67) || code === 81 || code === 82)
    return { kind: "rain", label: "Rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { kind: "snow", label: "Snow (somehow)" };
  if (code >= 95) return { kind: "storm", label: "Thunderstorms" };
  return { kind: "cloudy", label: "Cloudy" };
}

/**
 * Current conditions at `currentLocation`. Cached for 15 minutes so every
 * visitor shares one upstream request; returns null if Open-Meteo is down.
 */
export async function getCurrentWeather(): Promise<CurrentWeather | null> {
  const { lat, lng } = currentLocation.coordinates;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("current", "temperature_2m,weather_code,is_day");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("timezone", currentLocation.timezone);

  try {
    const res = await fetch(url, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        is_day?: number;
      };
    };
    const current = data.current;
    if (
      typeof current?.temperature_2m !== "number" ||
      typeof current.weather_code !== "number"
    ) {
      return null;
    }

    return {
      temperatureF: Math.round(current.temperature_2m),
      isDay: current.is_day === 1,
      ...describeWeatherCode(current.weather_code),
    };
  } catch {
    return null;
  }
}
