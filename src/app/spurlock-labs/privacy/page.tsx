import Link from "next/link";
import { StaggerContainer } from "@/components/stagger-container";
import { AnimatedTextLink } from "@/components/ui/animated-text-link";

export const metadata = {
  title: "Privacy Policy | Spurlock Labs",
  description:
    "Privacy Policy for Spurlock Labs, including SMS messaging and lead notification practices.",
};

export default function SpurlockLabsPrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-20 pb-16 lg:px-0">
        <StaggerContainer className="max-w-xl" delayStep={100}>
          <AnimatedTextLink href="/spurlock-labs" arrowSide="left">
            Privacy Policy
          </AnimatedTextLink>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            <p>
              Spurlock Labs (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
              respects your privacy. This Privacy Policy explains how we
              collect, use, and protect information when you register for our
              services or opt in to receive text messages.
            </p>

            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Information We Collect
              </h2>
              <p className="mt-3">
                When you complete client registration, we collect your full
                name, business name / DBA, email address, mobile phone number,
                and target service niche or city. We also record your SMS
                consent status and the time of opt-in.
              </p>
            </section>

            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                How We Use Information
              </h2>
              <p className="mt-3">
                We use your information to deliver lead notification and
                customer care text messages, provide call alerts, operate and
                improve our services, and communicate about your account.
                Message frequency varies.
              </p>
            </section>

            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                SMS Messaging
              </h2>
              <p className="mt-3">
                By providing your mobile number and checking the SMS consent box
                on our registration form, you agree to receive lead notification
                and customer care text messages from Spurlock Labs. Message and
                data rates may apply. Reply HELP for help or STOP to opt out at
                any time. Consent to receive texts is not a condition of
                purchase.
              </p>
            </section>

            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Sharing
              </h2>
              <p className="mt-3">
                We do not sell your personal information. We may share data with
                service providers who help us deliver messaging and operate our
                platform, solely as needed to provide those services and subject
                to appropriate safeguards.
              </p>
            </section>

            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Contact
              </h2>
              <p className="mt-3">
                Questions about this policy can be sent to{" "}
                <a
                  href="mailto:spurjae@gmail.com"
                  className="underline underline-offset-4 hover:text-blue-500"
                >
                  spurjae@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
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
