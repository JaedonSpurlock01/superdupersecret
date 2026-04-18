import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AppPreviousPathTracker } from "@/components/app-previous-path-tracker";
import { DatabaseFeaturesProvider } from "@/components/database-features-provider";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jaedon Spurlock",
  description: "Jaedon Spurlock's Portfolio",
};

/** DB health is checked per request so nav and guestbook reflect runtime availability. */
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const databaseAvailable = await isDatabaseAvailable();

  return (
    <html
      lang="en"
      className={cn("font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem("theme");
                  var theme =
                    stored === "dark" || stored === "light"
                      ? stored
                      : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                  document.documentElement.classList.toggle("dark", theme === "dark");
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-neutral-900 bg-neutral-100 font-sans`}
      >
        <ThemeProvider>
          <SessionProvider>
            <DatabaseFeaturesProvider databaseAvailable={databaseAvailable}>
              <AppPreviousPathTracker />
              <TooltipProvider>{children}</TooltipProvider>
            </DatabaseFeaturesProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
