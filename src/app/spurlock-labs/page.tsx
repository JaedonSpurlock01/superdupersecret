import Image from "next/image";
import Link from "next/link";
import { StaggerContainer } from "@/components/stagger-container";
import { AnimatedTextLink } from "@/components/ui/animated-text-link";
import { SpurlockLabsRegistrationForm } from "./registration-form";

export const metadata = {
  title: "Spurlock Labs",
  description:
    "Spurlock Labs provides digital marketing infrastructure, software applications, and web services for local businesses.",
};

export default function SpurlockLabsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-20 pb-16 lg:px-0">
        <StaggerContainer className="max-w-xl" delayStep={100}>
          <AnimatedTextLink href="/" arrowSide="left">
            Spurlock Labs
          </AnimatedTextLink>

          <Image
            src="/spurlocklabs.jpeg"
            alt="Spurlock Labs"
            width={2396}
            height={1760}
            priority
            className="mt-8 w-44 rounded-sm"
          />

          <p className="mt-8 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            Spurlock Labs provides digital marketing infrastructure, software
            applications, and web services for local businesses.
          </p>

          <section className="mt-10">
            <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Contact
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <li>
                <a
                  href="mailto:spurjae@gmail.com"
                  className="underline underline-offset-4 hover:text-blue-500"
                >
                  spurjae@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+17604503906"
                  className="underline underline-offset-4 hover:text-blue-500"
                >
                  760-450-3906
                </a>
              </li>
            </ul>
          </section>

          <SpurlockLabsRegistrationForm />
        </StaggerContainer>
      </main>

      <footer className="border-t border-border px-4 py-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between lg:px-0">
          <p>© 2026 Spurlock Labs. All rights reserved.</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link
              href="/spurlock-labs/privacy"
              className="underline underline-offset-4 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              Privacy Policy
            </Link>
            <Link
              href="/spurlock-labs/terms"
              className="underline underline-offset-4 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              Terms of Service
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
