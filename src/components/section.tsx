import { cn } from "@/lib/utils";

export default function Section({
  children,
  title,
  className,
  ...props
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn("w-full", className)} {...props}>
      {title && (
        <h1 className="text-xs text-neutral-500 tracking-wider uppercase font-medium">
          {title}
        </h1>
      )}
      {children}
    </section>
  );
}
