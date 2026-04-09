"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import Section from "./section";
import { info, socials } from "@/lib/data/personal";
import { LocationMap } from "./location-map";
import Link from "next/link";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "./theme-provider";

type InfoActionButtonProps = {
    tooltip: string;
    ariaLabel: string;
    icon: ReactNode;
    href?: string;
    external?: boolean;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
};

export function InfoActionButton({
    tooltip,
    ariaLabel,
    icon,
    href,
    external = false,
    onClick,
    type = "button",
}: InfoActionButtonProps) {
    const linkProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
    const isLink = Boolean(href);

    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Button
                        type={isLink ? undefined : type}
                        nativeButton={!isLink}
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:scale-110 transition-all duration-200"
                        aria-label={ariaLabel}
                        onClick={onClick}
                        render={href ? <Link href={href} {...linkProps} /> : undefined}
                    >
                        {icon}
                    </Button>
                }
            />
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    );
}

export default function Info() {
    const { currentTheme, toggleTheme } = useTheme();
    const isDark = currentTheme === "dark";

    return (
        <Section className="overflow-hidden rounded-md border border-border">
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
                <h1 className="text-xl font-bold">{info.name}</h1>
                <p className="text-sm text-muted-foreground">{info.role}</p>
                <p className="text-sm text-muted-foreground">
                    {info.location}
                </p>
            </div>

            <div className="flex items-center justify-center pb-4">
                <div className="flex items-center gap-1.5">
                    <InfoActionButton
                        tooltip="GitHub"
                        ariaLabel="Open GitHub profile"
                        href={socials.github}
                        external
                        icon={
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M256 32C132.3 32 32 134.9 32 261.7c0 101.5 64.2 187.5 153.2 217.9 1.4.3 2.6.4 3.8.4 8.3 0 11.5-6.1 11.5-11.4 0-5.5-.2-19.9-.3-39.1-8.4 1.9-15.9 2.7-22.6 2.7-43.1 0-52.9-33.5-52.9-33.5-10.2-26.5-24.9-33.6-24.9-33.6-19.5-13.7-.1-14.1 1.4-14.1h.1c22.5 2 34.3 23.8 34.3 23.8 11.2 19.6 26.2 25.1 39.6 25.1 10.5 0 20-3.4 25.6-6 2-14.8 7.8-24.9 14.2-30.7-49.7-5.8-102-25.5-102-113.5 0-25.1 8.7-45.6 23-61.6-2.3-5.8-10-29.2 2.2-60.8 0 0 1.6-.5 5-.5 8.1 0 26.4 3.1 56.6 24.1 17.9-5.1 37-7.6 56.1-7.7 19 .1 38.2 2.6 56.1 7.7 30.2-21 48.5-24.1 56.6-24.1 3.4 0 5 .5 5 .5 12.2 31.6 4.5 55 2.2 60.8 14.3 16.1 23 36.6 23 61.6 0 88.2-52.4 107.6-102.3 113.3 8 7.1 15.2 21.1 15.2 42.5 0 30.7-.3 55.5-.3 63 0 5.4 3.1 11.5 11.4 11.5 1.2 0 2.6-.1 4-.4C415.9 449.2 480 363.1 480 261.7 480 134.9 379.7 32 256 32z"></path></svg>
                        }
                    />
                    <InfoActionButton
                        tooltip="LinkedIn"
                        ariaLabel="Open LinkedIn profile"
                        href={socials.linkedin}
                        external
                        icon={
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
                                <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5.001 2.5 2.5 0 0 0 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.1c.53-1 1.83-2.06 3.77-2.06C21.2 8.64 22 10.96 22 14v7h-4v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.61-2.38 3.28V21H10V9z" />
                            </svg>
                        }
                    />

                    <InfoActionButton
                        tooltip="Resume"
                        ariaLabel="Open resume"
                        href={info.resume}
                        external
                        icon={
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
                                <path d="M14 2H7a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8l-6-6zM9 16h6a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2zm6-3H9a1 1 0 1 1 0-2h6a1 1 0 1 1 0 2zm-1-4V4.5L18.5 9H14z" />
                            </svg>
                        }
                    />

                    <InfoActionButton
                        tooltip="Email"
                        ariaLabel="Send email"
                        href={`mailto:${socials.email}`}
                        icon={
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
                                <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v.35l-9 5.4-9-5.4V6zm0 2.67V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.67l-8.48 5.09a1 1 0 0 1-1.04 0L3 8.67z" />
                            </svg>
                        }
                    />

                    <InfoActionButton
                        tooltip="Guestbook"
                        ariaLabel="Open guestbook"
                        href="/guestbook"
                        icon={
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
                                <path d="M16 11a3 3 0 1 0-2.999-3A3 3 0 0 0 16 11zm-8 0a3 3 0 1 0-2.999-3A3 3 0 0 0 8 11zm0 2c-2.673 0-8 1.343-8 4v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1c0-2.657-5.327-4-8-4zm8 0c-.299 0-.627.018-.973.051C16.68 13.89 18 15.205 18 17v1c0 .35-.07.683-.196.987l4.196.013a2 2 0 0 0 2-2v-1c0-2.657-5.327-4-8-4z" />
                            </svg>
                        }
                    />

                    <InfoActionButton
                        tooltip={isDark ? "Light mode" : "Dark mode"}
                        ariaLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        onClick={toggleTheme}
                        type="button"
                        icon={
                            isDark ? (
                                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
                                    <path d="M6.76 4.84 5.34 3.42 3.93 4.83l1.42 1.42 1.41-1.41zm10.48 0 1.41 1.41 1.42-1.42-1.41-1.41-1.42 1.42zM12 5a1 1 0 0 1-1-1V2a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1zm0 15a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zm8-7a1 1 0 1 1 0-2h2a1 1 0 1 1 0 2h-2zM2 12a1 1 0 1 1 0-2h2a1 1 0 1 1 0 2H2zm16.66 7.17 1.41-1.41-1.42-1.42-1.41 1.42 1.42 1.41zM5.34 17.75l-1.42 1.42 1.41 1.41 1.42-1.41-1.41-1.42zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
                                </svg>
                            ) : (
                                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
                                    <path d="M20.742 13.045a1 1 0 0 0-1.1-.26A8.002 8.002 0 0 1 9.214 2.357a1 1 0 0 0-1.36-1.1A10 10 0 1 0 21.84 15.19a1 1 0 0 0-1.098-2.145z" />
                                </svg>
                            )
                        }
                    />
                </div>
            </div>
        </Section>
    );
}