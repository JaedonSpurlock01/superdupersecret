"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapData from "@/lib/data/map.json";

type MapPoint = {
  x: number;
  y: number;
};

type MapJson = {
  points: Record<string, MapPoint>;
};

type PreparedDot = {
  id: string;
  x: number;
  y: number;
};

type PreparedMap = {
  dots: PreparedDot[];
  totalWidth: number;
  totalHeight: number;
  viewWidth: number;
  viewHeight: number;
  initialViewX: number;
  initialViewY: number;
  maxViewX: number;
  maxViewY: number;
};

function prepareMap(map: MapJson): PreparedMap {
  const entries = Object.entries(map.points);
  const values = entries.map(([, p]) => p);

  const minX = Math.min(...values.map((p) => p.x));
  const maxX = Math.max(...values.map((p) => p.x));
  const minY = Math.min(...values.map((p) => p.y));
  const maxY = Math.max(...values.map((p) => p.y));

  const baseWidth = maxX - minX || 1;
  const baseHeight = maxY - minY || 1;

  const scale = 1.5; // draw a bit larger than the viewport to allow panning
  const totalWidth = baseWidth * scale + 70;
  const totalHeight = baseHeight * scale;
  const viewWidth = baseWidth;
  const viewHeight = baseHeight;

  const marginX = (totalWidth - viewWidth) / 2;
  const marginY = (totalHeight - viewHeight) / 2;

  const dots: PreparedDot[] = entries.map(([key, p]) => ({
    id: key,
    x: (p.x - minX) * scale + marginX,
    y: (p.y - minY) * scale + marginY,
  }));

  const maxViewX = totalWidth - viewWidth;
  const maxViewY = totalHeight - viewHeight;

  return {
    dots,
    totalWidth,
    totalHeight,
    viewWidth,
    viewHeight,
    initialViewX: marginX,
    initialViewY: marginY,
    maxViewX,
    maxViewY,
  };
}

const prepared = prepareMap(mapData as MapJson);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type GuestbookMapProps = {
  onDotClick?: (id: string) => void;
  dotCommentCounts?: Record<string, number>;
};

export function GuestbookMap({
  onDotClick,
  dotCommentCounts,
}: GuestbookMapProps) {
  const [_selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewBoxRef = useRef<{ x: number; y: number }>({
    x: prepared.initialViewX,
    y: prepared.initialViewY,
  });
  const zoomRef = useRef<number>(1);
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 3;
  const velocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const lastMoveRef = useRef<{
    time: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const inertiaFrameRef = useRef<number | null>(null);
  const [dragState, setDragState] = useState<{
    startClientX: number;
    startClientY: number;
    startViewX: number;
    startViewY: number;
    scaleX: number;
    scaleY: number;
  } | null>(null);

  const handleDotClick = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });

      if (onDotClick) {
        onDotClick(id);
      }
    },
    [onDotClick],
  );

  const getDotFill = (id: string) => {
    if (hoveredId === id) {
      return "#22d3ee"; // bright cyan on hover
    }

    const count = dotCommentCounts?.[id] ?? 0;

    if (count === 0) return "#9ca3af"; // gray
    if (count === 1) return "#bfdbfe"; // light blue
    if (count <= 3) return "#60a5fa"; // medium blue
    return "#1d4ed8"; // dark blue
  };

  const getVisibleDimensions = useCallback(() => {
    const zoom = zoomRef.current || 1;
    return {
      width: prepared.viewWidth / zoom,
      height: prepared.viewHeight / zoom,
    };
  }, []);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const { width, height } = getVisibleDimensions();
      const scaleX = width / (rect.width || 1);
      const scaleY = height / (rect.height || 1);

      setDragState({
        startClientX: event.clientX,
        startClientY: event.clientY,
        startViewX: viewBoxRef.current.x,
        startViewY: viewBoxRef.current.y,
        scaleX,
        scaleY,
      });

      // Stop any ongoing inertia when a new drag starts
      if (inertiaFrameRef.current !== null) {
        cancelAnimationFrame(inertiaFrameRef.current);
        inertiaFrameRef.current = null;
      }
      velocityRef.current = { vx: 0, vy: 0 };
      lastMoveRef.current = {
        time: performance.now(),
        clientX: event.clientX,
        clientY: event.clientY,
      };
    },
    [getVisibleDimensions],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!dragState) return;

      event.preventDefault();

      const dx = (event.clientX - dragState.startClientX) * dragState.scaleX;
      const dy = (event.clientY - dragState.startClientY) * dragState.scaleY;

      const { width, height } = getVisibleDimensions();
      const maxViewX = prepared.totalWidth - width;
      const maxViewY = prepared.totalHeight - height;

      const nextX = clamp(dragState.startViewX - dx, 0, maxViewX);
      const nextY = clamp(dragState.startViewY - dy, 0, maxViewY);

      viewBoxRef.current = { x: nextX, y: nextY };

      if (svgRef.current) {
        svgRef.current.setAttribute(
          "viewBox",
          `${nextX} ${nextY} ${width} ${height}`,
        );
      }

      // Track velocity based on the most recent movement (similar feel to Photos)
      const now = performance.now();
      if (lastMoveRef.current) {
        const dt = Math.max(now - lastMoveRef.current.time, 16);
        const dxClient = event.clientX - lastMoveRef.current.clientX;
        const dyClient = event.clientY - lastMoveRef.current.clientY;
        const velocityX = (-dxClient * dragState.scaleX) / dt; // units/ms
        const velocityY = (-dyClient * dragState.scaleY) / dt; // units/ms
        velocityRef.current = { vx: velocityX, vy: velocityY };
      }
      lastMoveRef.current = {
        time: now,
        clientX: event.clientX,
        clientY: event.clientY,
      };
    },
    [dragState, getVisibleDimensions],
  );

  const handleMouseUpOrLeave = useCallback(() => {
    if (dragState) {
      // Start inertia if there's meaningful velocity
      const { vx, vy } = velocityRef.current;
      const speed = Math.hypot(vx, vy);
      // vx, vy are in units/ms; mimic Photos inertia feel
      if (speed > 0.02) {
        const friction = 0.92;
        const scale = 600;

        let currentVx = vx * scale;
        let currentVy = vy * scale;

        const step = () => {
          currentVx *= friction;
          currentVy *= friction;

          const currentSpeed = Math.hypot(currentVx, currentVy);
          if (currentSpeed < 2) {
            inertiaFrameRef.current = null;
            return;
          }

          const dt = 1 / 60;
          const dx = currentVx * dt;
          const dy = currentVy * dt;

          const { width, height } = getVisibleDimensions();
          const maxViewX = prepared.totalWidth - width;
          const maxViewY = prepared.totalHeight - height;

          const nextX = clamp(viewBoxRef.current.x + dx, 0, maxViewX);
          const nextY = clamp(viewBoxRef.current.y + dy, 0, maxViewY);

          viewBoxRef.current = { x: nextX, y: nextY };
          if (svgRef.current) {
            svgRef.current.setAttribute(
              "viewBox",
              `${nextX} ${nextY} ${width} ${height}`,
            );
          }

          inertiaFrameRef.current = requestAnimationFrame(step);
        };

        inertiaFrameRef.current = requestAnimationFrame(step);
      }
    }

    setDragState(null);
    lastMoveRef.current = null;
  }, [dragState, getVisibleDimensions]);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const { width, height } = getVisibleDimensions();

      // Current center in SVG units
      const currentX = viewBoxRef.current.x;
      const currentY = viewBoxRef.current.y;
      const centerX = currentX + width / 2;
      const centerY = currentY + height / 2;

      // Zoom in on wheel up, out on wheel down
      const direction = event.deltaY > 0 ? -1 : 1;
      const factor = direction > 0 ? 1.1 : 0.9;
      let nextZoom = zoomRef.current * factor;
      nextZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);

      zoomRef.current = nextZoom;

      const { width: newWidth, height: newHeight } = getVisibleDimensions();

      // Keep the center roughly stable
      let nextX = centerX - newWidth / 2;
      let nextY = centerY - newHeight / 2;

      const maxViewX = prepared.totalWidth - newWidth;
      const maxViewY = prepared.totalHeight - newHeight;

      nextX = clamp(nextX, 0, maxViewX);
      nextY = clamp(nextY, 0, maxViewY);

      viewBoxRef.current = { x: nextX, y: nextY };

      if (svgRef.current) {
        svgRef.current.setAttribute(
          "viewBox",
          `${nextX} ${nextY} ${newWidth} ${newHeight}`,
        );
      }
    },
    [getVisibleDimensions],
  );

  // Initialize the SVG viewBox once on mount so React doesn't override
  useEffect(() => {
    if (svgRef.current) {
      const { width, height } = getVisibleDimensions();
      svgRef.current.setAttribute(
        "viewBox",
        `${viewBoxRef.current.x} ${viewBoxRef.current.y} ${width} ${height}`,
      );
    }
  }, [getVisibleDimensions]);
  return (
    <div
      className="relative h-160 w-full overflow-hidden overscroll-none"
      onWheel={handleWheel}
    >
      <svg
        ref={svgRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        <title>Guestbook map: pan and zoom to explore entries</title>
        <rect
          x={0}
          y={0}
          width={prepared.totalWidth}
          height={prepared.totalHeight}
          fill="none"
        />
        {prepared.dots.map((dot) => (
          // biome-ignore lint/a11y/useSemanticElements: Map dots are SVG graphics; HTML <button> cannot be used inside <svg>.
          <g
            key={dot.id}
            role="button"
            tabIndex={0}
            aria-label={`Guestbook location ${dot.id}`}
            style={{ cursor: "pointer" }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseEnter={() => setHoveredId(dot.id)}
            onMouseLeave={() =>
              setHoveredId((current) => (current === dot.id ? null : current))
            }
            onClick={(e) => {
              e.stopPropagation();
              handleDotClick(dot.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                handleDotClick(dot.id);
              }
            }}
          >
            <circle cx={dot.x} cy={dot.y} r={0.5} fill={getDotFill(dot.id)} />
          </g>
        ))}
      </svg>
    </div>
  );
}
