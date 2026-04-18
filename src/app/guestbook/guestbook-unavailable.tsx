import Link from "next/link";
import { StaggerContainer } from "@/components/stagger-container";
import { Button } from "@/components/ui/button";
import { AnimatedTextLink } from "@/components/ui/animated-text-link";

export function GuestbookUnavailable() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 pt-20 pb-20 lg:px-0">
      <StaggerContainer className="max-w-lg" delayStep={100}>
        <AnimatedTextLink href="/" arrowSide="left">
          Guestbook
        </AnimatedTextLink>
        <p className="mt-6 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          This page is currently not available.
        </p>
        <div className="mt-8">
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/" />}
          >
            Back to home
          </Button>
        </div>
      </StaggerContainer>
    </main>
  );
}
