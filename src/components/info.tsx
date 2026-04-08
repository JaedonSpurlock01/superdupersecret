"use client";

import Image from "next/image";
import Section from "./section";
import { info, socials } from "@/lib/data/personal";
import { LocationMap } from "./location-map";
import Link from "next/link";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    File01FreeIcons,
    Linkedin,
    Mail01FreeIcons,
    Moon02FreeIcons,
    Sun01FreeIcons,
    UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { useTheme } from "./theme-provider";

export default function Info() {
    const { currentTheme, toggleTheme } = useTheme();
    const isDark = currentTheme === "dark";

    return (
        <Section className="overflow-hidden h-fit sticky top-6">
            <div className="relative h-60 border-b border-border">
                <div className="absolute inset-0 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

                <div className="absolute inset-0">
                    <LocationMap />
                </div>

                <Image
                    src="/photos/1.jpg"
                    alt="Profile"
                    width={120}
                    height={120}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full border-4 border-background"
                />
            </div>

            <div className="p-4 *:text-center mt-12 space-y-1.5">
                <h1 className="text-2xl font-bold">{info.name}</h1>
                <p className="text-sm text-muted-foreground">{info.role}</p>
                <p className="text-sm text-muted-foreground">
                    {info.location}
                </p>
            </div>

            <div className="flex items-center justify-center pb-4">
                <div className="flex items-center gap-3">
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    aria-label="Open LinkedIn profile"
                                    render={
                                        <Link
                                            href={socials.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        />
                                    }
                                >
                                    <HugeiconsIcon icon={Linkedin} className="size-5" />
                                </Button>
                            }
                        />
                        <TooltipContent>LinkedIn</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    aria-label="Open resume"
                                    render={
                                        <Link
                                            href={info.resume}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        />
                                    }
                                >
                                    <HugeiconsIcon icon={File01FreeIcons} className="size-5" />
                                </Button>
                            }
                        />
                        <TooltipContent>Resume</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    aria-label="Send email"
                                    render={<Link href={`mailto:${socials.email}`} />}
                                >
                                    <HugeiconsIcon icon={Mail01FreeIcons} className="size-5" />
                                </Button>
                            }
                        />
                        <TooltipContent>Email</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    aria-label="Open guestbook"
                                    render={<Link href="/guestbook" />}
                                >
                                    <HugeiconsIcon icon={UserGroupIcon} className="size-5" />
                                </Button>
                            }
                        />
                        <TooltipContent>Guestbook</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    onClick={toggleTheme}
                                    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                                >
                                    <HugeiconsIcon
                                        icon={isDark ? Sun01FreeIcons : Moon02FreeIcons}
                                        className="size-5"
                                    />
                                </Button>
                            }
                        />
                        <TooltipContent>{isDark ? "Light mode" : "Dark mode"}</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </Section>
    );
}