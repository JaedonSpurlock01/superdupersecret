import React, { isValidElement } from "react";
import { cn } from "@/lib/utils";

type StaggerContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** Delay between each child (in milliseconds) */
  delayStep?: number;
};

function childListKey(child: React.ReactNode, fallback: number): string {
  if (isValidElement(child) && child.key != null) {
    return String(child.key);
  }
  return `stagger-child-${fallback}`;
}

export function StaggerContainer({
  children,
  className,
  delayStep = 150,
}: StaggerContainerProps) {
  const items = React.Children.toArray(children);
  let step = 0;

  return (
    <div className={cn(className)}>
      {items.map((child) => {
        const key = childListKey(child, step);
        const delayMs = step * delayStep;
        step += 1;
        return (
          <div
            key={key}
            className="w-full fade-in-up"
            style={{ animationDelay: `${delayMs}ms` }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
