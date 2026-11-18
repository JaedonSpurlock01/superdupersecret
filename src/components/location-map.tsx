"use client";

import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { currentLocation } from "@/lib/data/location";
import "maplibre-gl/dist/maplibre-gl.css";
import { WeatherBadge } from "./orlando-now";
import { useTheme } from "./theme-provider";

const LIGHT_MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const DARK_MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/**
 * The <html> class is the source of truth: the inline script in layout sets it
 * before paint, and ThemeProvider updates it synchronously on toggle. React's
 * `currentTheme` starts as "light" until ThemeProvider's layout effect runs, so
 * reading it here would briefly pick the wrong style.
 */
function getMapStyleForDocument() {
  return document.documentElement.classList.contains("dark")
    ? DARK_MAP_STYLE
    : LIGHT_MAP_STYLE;
}

export function LocationMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const compassDblClickCleanupRef = useRef<(() => void) | null>(null);
  const appliedStyleRef = useRef<string | null>(null);
  const { currentTheme } = useTheme();
  const isDark = currentTheme === "dark";

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const { lat, lng } = currentLocation.coordinates;
    const initialView = {
      center: [lng, lat] as [number, number],
      zoom: 9,
      bearing: 0,
      pitch: 0,
    };

    const initialStyle = getMapStyleForDocument();
    appliedStyleRef.current = initialStyle;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [lng, lat],
      zoom: 1.5,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-right",
    );

    const compassButton =
      mapContainerRef.current.querySelector<HTMLButtonElement>(
        ".maplibregl-ctrl-compass",
      );

    if (compassButton) {
      const onCompassDoubleClick = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        map.easeTo({
          ...initialView,
          duration: 1000,
          essential: true,
        });
      };

      compassButton.addEventListener("dblclick", onCompassDoubleClick);
      compassDblClickCleanupRef.current = () => {
        compassButton.removeEventListener("dblclick", onCompassDoubleClick);
      };
    }

    map.on("load", () => {
      map.easeTo({
        ...initialView,
        duration: 2500,
        essential: true,
      });

      const markerEl = document.createElement("div");
      markerEl.className = "relative h-6 w-6 -translate-x-1/2 -translate-y-1/2";

      const inner = document.createElement("div");
      inner.className =
        "absolute inset-0 m-auto h-2 w-2 rounded-full bg-primary shadow-lg";

      const pulse = document.createElement("div");
      pulse.className =
        "absolute inset-0 m-auto h-6 w-6 rounded-full border-2 border-primary/40 animate-[ping_1.5s_ease-out_infinite]";

      markerEl.appendChild(pulse);
      markerEl.appendChild(inner);

      new maplibregl.Marker({ element: markerEl })
        .setLngLat([lng, lat])
        .addTo(map);
    });

    return () => {
      compassDblClickCleanupRef.current?.();
      compassDblClickCleanupRef.current = null;
      map.remove();
      mapRef.current = null;
      appliedStyleRef.current = null;
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: isDark is the trigger; the style is read from the <html> class.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const style = getMapStyleForDocument();
    if (appliedStyleRef.current === style) return;
    appliedStyleRef.current = style;

    // diff: false replaces the style outright and aborts any in-flight style
    // request, so the last call always wins. With diffing, overlapping
    // setStyle calls race on their JSON fetches and a stale light style can
    // land after the dark one.
    map.setStyle(style, { diff: false });
  }, [isDark]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
      <div
        ref={mapContainerRef}
        className={`relative h-full w-full ${isDark ? "map-dark" : ""}`}
      />

      <div className="pointer-events-none absolute left-3 top-3 z-10">
        <WeatherBadge />
      </div>
    </div>
  );
}
