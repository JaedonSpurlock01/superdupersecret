import Image from "next/image";
import Link from "next/link";
import Section from "./section";
import { work } from "@/lib/data/work";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function Experience() {
    return (
        <Section title="Experience">
            <div className="relative mt-8 space-y-4">
                <div className="pointer-events-none absolute left-3 top-0 bottom-0 w-px bg-border mt-9.5" />

                {work.map((item, index) => (
                    <div key={`${item.company}-${item.date}`} className="flex gap-4">
                        <div className="relative flex w-6 justify-center translate-y-5">
                            <div className={cn("z-10 mt-1 h-2.5 w-2.5 rounded-full bg-muted-foreground ring-3 ring-primary/15", index === 0 && "animate-pulse bg-green-500 ring-green-500/15")} />
                        </div>

                        <div className="flex flex-1 flex-col gap-1 rounded-sm py-3">
                            <div className="flex flex-wrap justify-between items-start gap-x-2 gap-y-1">
                                <div>
                                    <p className="text-sm font-semibold leading-tight mb-0.5 text-neutral-700 dark:text-white">
                                        {item.position}
                                    </p>
                                    <div className="flex flex-col text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Tooltip>
                                                <TooltipTrigger
                                                    render={
                                                        <Link
                                                            href={item.href}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="hover:underline text-xs text-neutral-700 dark:text-neutral-400 hover:text-blue-500"
                                                            aria-label={`Open ${item.company}`}
                                                        >
                                                            {item.company}
                                                        </Link>
                                                    }
                                                />
                                                <TooltipContent>{`Open ${item.company}`}</TooltipContent>
                                            </Tooltip>
                                            <span className="text-xs text-neutral-700 dark:text-neutral-400">{` · ${item.location}`}</span>
                                        </div>
                                        <Badge variant="secondary" className="mt-2 text-[10px] rounded-sm text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-800 border border-border/40">
                                            {item.date}
                                        </Badge>
                                    </div>
                                </div>
                                <Image src={item.imageSrc} alt={item.company} width={35} height={35} className="rounded-sm" />

                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed mr-14 mt-1.5">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

