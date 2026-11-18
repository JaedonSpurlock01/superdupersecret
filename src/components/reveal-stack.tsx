"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealStackProps = {
  children: React.ReactNode;
  className?: string;
  /** Delay between children that are already on screen at load (ms) */
  delayStep?: number;
};

/**
 * Fades each child up the first time it scrolls into view. Children visible
 * on load stagger in order; ones revealed later by scrolling don't wait.
 * Revealing a child also reveals every child before it, so jumping down the
 * page (End key, anchor link) never leaves hidden sections behind.
 */
export function RevealStack({
  children,
  className,
  delayStep = 80,
}: RevealStackProps) {
  const [revealedUpTo, setRevealedUpTo] = useState(-1);

  return (
    <div className={cn(className)}>
      {React.Children.toArray(children).map((child, index) => (
        <RevealItem
          key={
            React.isValidElement(child) && child.key != null ? child.key : index
          }
          delay={index * delayStep}
          forceVisible={index <= revealedUpTo}
          onReveal={() => setRevealedUpTo((max) => Math.max(max, index))}
        >
          {child}
        </RevealItem>
      ))}
    </div>
  );
}

function RevealItem({
  children,
  delay,
  forceVisible,
  onReveal,
}: {
  children: React.ReactNode;
  delay: number;
  forceVisible: boolean;
  onReveal: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [appliedDelay, setAppliedDelay] = useState(0);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mountedAt = performance.now();
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (performance.now() - mountedAt < 300) setAppliedDelay(delay);
        setInView(true);
        onRevealRef.current();
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className="reveal w-full"
      data-inview={inView || forceVisible}
      style={{ "--reveal-delay": `${appliedDelay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
