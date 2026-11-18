"use client";

import {
  CloudAngledRainIcon,
  CloudAngledZapIcon,
  CloudIcon,
  CloudLittleRainIcon,
  CloudSnowIcon,
  Moon02Icon,
  MoonCloudIcon,
  Sun03Icon,
  SunCloud02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { currentLocation } from "@/lib/data/location";
import type { CurrentWeather, WeatherKind } from "@/lib/weather";

type LocalClock = {
  /** e.g. "2:14am" */
  time: string;
  hour: number;
  weekend: boolean;
};

const clockFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h12",
  timeZone: currentLocation.timezone,
});

const hourFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  hourCycle: "h23",
  timeZone: currentLocation.timezone,
});

function readClock(now: Date): LocalClock {
  const parts = Object.fromEntries(
    clockFormatter.formatToParts(now).map((p) => [p.type, p.value]),
  );
  return {
    time: `${parts.hour}:${parts.minute}${parts.dayPeriod?.toLowerCase() ?? ""}`,
    hour: Number(hourFormatter.format(now)) % 24,
    weekend: parts.weekday === "Sat" || parts.weekday === "Sun",
  };
}

/** Wall-clock time where I live. Null until mounted so SSR markup matches. */
function useLocalClock() {
  const [clock, setClock] = useState<LocalClock | null>(null);

  useEffect(() => {
    let last = "";
    const tick = () => {
      const next = readClock(new Date());
      if (next.time === last) return;
      last = next.time;
      setClock(next);
    };
    tick();
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, []);

  return clock;
}

// One request per page load, shared by every component that asks.
let weatherRequest: Promise<CurrentWeather | null> | null = null;

function loadWeather() {
  weatherRequest ??= fetch("/api/weather")
    .then((res) => (res.ok ? res.json() : { weather: null }))
    .then((body: { weather: CurrentWeather | null }) => body.weather)
    .catch(() => null);
  return weatherRequest;
}

function useWeather() {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadWeather().then((w) => {
      if (!cancelled) setWeather(w);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return weather;
}

function weatherIcon(kind: WeatherKind, isDay: boolean) {
  switch (kind) {
    case "clear":
      return isDay ? Sun03Icon : Moon02Icon;
    case "partly-cloudy":
      return isDay ? SunCloud02Icon : MoonCloudIcon;
    case "drizzle":
      return CloudLittleRainIcon;
    case "rain":
      return CloudAngledRainIcon;
    case "storm":
      return CloudAngledZapIcon;
    case "snow":
      return CloudSnowIcon;
    default:
      return CloudIcon;
  }
}

function guessWhatImDoing(
  { hour, weekend }: LocalClock,
  weather: CurrentWeather | null,
) {
  if (weather?.kind === "snow")
    return "it's snowing in Orlando?? something is very wrong.";
  if (weather?.kind === "storm" && hour >= 12 && hour < 21)
    return "probably watching a Florida thunderstorm roll in.";

  if (hour < 2) return "I should probably be asleep.";
  if (hour < 6) return "I'm probably asleep.";
  if (hour < 9) return "probably on my first coffee.";
  if (weekend && hour < 18)
    return weather?.kind === "rain"
      ? "probably stuck inside, reading."
      : "probably outside somewhere.";
  if (hour < 12) return "probably heads-down in code.";
  if (hour < 14) return "probably out getting lunch.";
  if (hour < 18) return "probably deep in a PR review.";
  if (hour < 21) return "probably at the climbing gym.";
  return "probably reading in bed.";
}

/** "It's 2:14am here, I'm probably asleep." */
export function LocalStatus({ className }: { className?: string }) {
  const clock = useLocalClock();
  const weather = useWeather();

  return (
    <p className={className} aria-live="off">
      {clock ? (
        <>
          It's <span className="tabular-nums">{clock.time}</span> here,{" "}
          {guessWhatImDoing(clock, weather)}
        </>
      ) : (
        // Holds the line's height until the clock mounts.
        <span aria-hidden>&nbsp;</span>
      )}
    </p>
  );
}

/** Current conditions, shown over the location map. */
export function WeatherBadge() {
  const weather = useWeather();
  if (!weather) return null;

  return (
    <Badge
      variant="secondary"
      className="text-xs text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur border border-border/40 rounded-sm [&>svg]:size-3.5! animate-in fade-in duration-300"
    >
      <HugeiconsIcon icon={weatherIcon(weather.kind, weather.isDay)} />
      <span className="tabular-nums">{weather.temperatureF}°F</span>
      <span className="text-muted-foreground">· {weather.label}</span>
    </Badge>
  );
}
