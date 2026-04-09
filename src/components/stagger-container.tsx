import React from "react";
import { cn } from "@/lib/utils";

type StaggerContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** Delay between each child (in milliseconds) */
  delayStep?: number;
};

export function StaggerContainer({
  children,
  className,
  delayStep = 150,
}: StaggerContainerProps) {
  const items = React.Children.toArray(children);

  return (
    <div className={cn(className)}>
      {items.map((child, index) => (
        <div
          key={index}
          className="w-full fade-in-up"
          style={{ animationDelay: `${index * delayStep}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

