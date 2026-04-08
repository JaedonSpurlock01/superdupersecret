import Image from "next/image";
import Link from "next/link";
import Section from "./section";
import { work } from "@/lib/data/work";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Experience() {
    return (
        <Section title="Experience">
            <div className="relative mt-4 space-y-4 pl-6">
                <div className="pointer-events-none absolute left-9 top-0 bottom-0 w-px bg-border" />

                {work.map((item) => (
                    <div key={`${item.company}-${item.date}`} className="flex gap-4">
                        <div className="relative flex w-6 justify-center translate-y-5">
                            <div className="z-10 mt-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
                        </div>

                        <div className="flex flex-1 flex-col gap-1 rounded-sm py-3 pr-6">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                                <div>
                                    <p className="text-sm font-semibold leading-tight">
                                        {item.position}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        <Tooltip>
                                            <TooltipTrigger
                                                render={
                                                    <Link
                                                        href={item.href}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="hover:underline hover:text-blue-500"
                                                        aria-label={`Open ${item.company}`}
                                                    >
                                                        {item.company}
                                                    </Link>
                                                }
                                            />
                                            <TooltipContent>{`Open ${item.company}`}</TooltipContent>
                                        </Tooltip>
                                        <span>{` · ${item.location}`}</span>
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {item.date}
                                </p>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {item.description}
                            </p>

                            {item.skills && item.skills.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {item.skills.map((skill) => (
                                        <Badge key={skill} variant="outline" className="text-[10px]">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

