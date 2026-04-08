"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import {
    Home01FreeIcons,
    LicenseDraftIcon,
    Moon01FreeIcons,
    Moon02FreeIcons,
    Sun01FreeIcons,
    UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "@/components/theme-provider";
import Image from "next/image";

export default function PageHeader() {
    const { currentTheme, toggleTheme } = useTheme();
    const isDark = currentTheme === "dark";

    return (
        <header className="sticky top-0 h-14 z-50 bg-white dark:bg-black w-full border-b border-border p-2">
            <div className="flex items-center justify-between w-full max-w-3xl mx-auto h-full">
                <Link href="/">
                    <Image src="/logo.png" alt="Profile" width={30} height={30} className="rounded-full" />
                </Link>
                <div className="flex items-center gap-2">
                    <Link href="/blogs">
                        <Button variant="ghost" size="lg">
                            <HugeiconsIcon icon={LicenseDraftIcon} /> Blog
                        </Button>
                    </Link>
                    <Link href="/guestbook">
                        <Button variant="ghost" size="lg">
                            <HugeiconsIcon icon={UserGroupIcon} /> Guestbook
                        </Button>
                    </Link>
                    <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        className="ml-2"
                        onClick={toggleTheme}
                        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        title={isDark ? "Light mode" : "Dark mode"}
                    >
                        <HugeiconsIcon icon={isDark ? Sun01FreeIcons : Moon02FreeIcons} />
                    </Button>
                </div>
            </div>
        </header>
    );
}