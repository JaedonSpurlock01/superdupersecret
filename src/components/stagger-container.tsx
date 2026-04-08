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
      {items.map((child, index) => {
        if (!React.isValidElement(child)) {
          return (
            <div
              key={index}
              className="w-full fade-in-up"
              style={{ animationDelay: `${index * delayStep}ms` }}
            >
              {child}
            </div>
          );
        }

        const childProps = child.props as {
          className?: string;
          style?: React.CSSProperties;
        };

        return React.cloneElement(child, {
          className: cn("fade-in-up", childProps.className),
          style: {
            ...childProps.style,
            animationDelay: `${index * delayStep}ms`,
          },
        });
      })}
    </div>
  );
}

