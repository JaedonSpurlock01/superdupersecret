"use client";

import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { currentLocation } from "@/lib/data/location";
import "maplibre-gl/dist/maplibre-gl.css";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "./theme-provider";

const DEFAULT_MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export function LocationMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const compassDblClickCleanupRef = useRef<(() => void) | null>(null);
  const [timeString, setTimeString] = useState<string>("");
  const { currentTheme } = useTheme();
  const isDark = currentTheme === "dark";

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: currentLocation.timezone,
    });

    const updateTime = () => {
      try {
        setTimeString(formatter.format(new Date()));
      } catch {
        // If timezone is invalid for any reason, fall back to local time.
        setTimeString(new Date().toLocaleTimeString());
      }
    };

    updateTime();
    const interval = window.setInterval(updateTime, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const { lat, lng } = currentLocation.coordinates;
    const initialView = {
      center: [lng, lat] as [number, number],
      zoom: 9,
      bearing: 0,
      pitch: 0,
    };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: DEFAULT_MAP_STYLE,
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
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const style = isDark
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

    mapRef.current.setStyle(style);
  }, [isDark]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
      <div
        ref={mapContainerRef}
        className={`relative h-full w-full ${isDark ? "map-dark" : ""}`}
      />

      {timeString && (
        <div className="pointer-events-none absolute left-3 top-3 z-10">
          <Badge
            variant="secondary"
            className="pointer-events-auto text-xs text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur border border-border/40 rounded-sm"
          >
            Local time · {timeString}
          </Badge>
        </div>
      )}
    </div>
  );
}
