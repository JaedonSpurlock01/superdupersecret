import { cn } from "@/lib/utils";

export default function Section({ children, title, className, ...props }: { children: React.ReactNode, title?: string, className?: string } & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <section className={cn("w-full bg-white border border-border rounded-sm dark:bg-black", className)} {...props}>
            {title && <h1 className="text-xl font-semibold mx-4 mt-6">{title}</h1>}
            {children}
        </section>
    )
}   