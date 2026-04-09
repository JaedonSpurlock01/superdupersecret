import Image from "next/image";
import Link from "next/link";
import Section from "./section";
import { work } from "@/lib/data/work";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { education } from "@/lib/data/personal";

export default function Education() {
    return (
        <Section title="EDUCATION">
            <div className="relative mt-8">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-sm font-semibold text-neutral-700 dark:text-white leading-tight mb-0.5">{education.school}</p>
                        <p className="text-xs text-muted-foreground mb-1">{education.degree}</p>
                    </div>

                    <Image src={education.imageSrc} alt={education.school} width={35} height={35} className="rounded-sm aspect-square object-cover" />
                </div>


                <Badge variant="secondary" className="text-[10px] rounded-sm text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-800 border border-border/40">
                    {education.date}
                </Badge>
            </div>
        </Section>
    );
}

