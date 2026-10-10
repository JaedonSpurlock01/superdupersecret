import Link from "next/link";
import { StaggerContainer } from "@/components/stagger-container";
import { AnimatedTextLink } from "@/components/ui/animated-text-link";

export const metadata = {
  title: "Terms of Service | Spurlock Labs",
  description:
    "Terms of Service for the Spurlock Labs messaging program, including lead notifications, missed call alerts, customer care updates, and SMS / A2P compliance.",
};

export default function SpurlockLabsTermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-20 pb-24 lg:px-0">
        <StaggerContainer className="max-w-2xl" delayStep={80}>
          <AnimatedTextLink href="/spurlock-labs" arrowSide="left">
            Spurlock Labs
          </AnimatedTextLink>

          <article className="mt-14">
            <header className="space-y-4 border-b border-border pb-10">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                Legal
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 sm:text-4xl">
                Terms of Service
              </h1>
              <p className="max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-400">
                These Terms of Service (&quot;Terms&quot;) govern your use of
                the{" "}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  Spurlock Labs
                </span>{" "}
                messaging program and related services. By completing client
                registration, opting in to SMS communications, or otherwise
                using Spurlock Labs services, you agree to these Terms.
              </p>
              <p className="text-sm text-neutral-500">
                Last updated: October 10, 2026
              </p>
            </header>

            <div className="mt-12 space-y-14 text-base leading-7 text-neutral-700 dark:text-neutral-300">
              <section aria-labelledby="program-name">
                <h2
                  id="program-name"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  Program &amp; Brand Name
                </h2>
                <p className="mt-4">
                  The messaging program described in these Terms is operated by{" "}
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    Spurlock Labs
                  </span>
                  . All operational lead notifications, missed call alerts, and
                  customer care text messages sent under this program are from
                  Spurlock Labs.
                </p>
              </section>

              <section aria-labelledby="program-description">
                <h2
                  id="program-description"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  Program Description
                </h2>
                <p className="mt-4">
                  Spurlock Labs provides digital marketing infrastructure,
                  software applications, and web services for local businesses.
                  The Spurlock Labs messaging program delivers operational lead
                  notifications, missed call alerts, and customer care updates
                  to opted-in business clients so they can respond quickly to
                  inbound opportunities and support needs.
                </p>
              </section>

              <section aria-labelledby="eligibility">
                <h2
                  id="eligibility"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  Eligibility &amp; Accurate Information
                </h2>
                <p className="mt-4">
                  You agree to provide accurate registration details, including
                  a mobile phone number that you own or are authorized to use
                  for receiving text messages. You are responsible for keeping
                  your contact information current.
                </p>
              </section>

              <section aria-labelledby="sms-terms">
                <h2
                  id="sms-terms"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  SMS Messaging Terms
                </h2>
                <p className="mt-4">
                  By checking the SMS consent box and submitting the Spurlock
                  Labs client registration form, you agree to receive
                  operational lead notifications, missed call alerts, and
                  customer care text messages from Spurlock Labs at the mobile
                  number you provide.
                </p>
                <p className="mt-4">
                  Message frequency varies based on lead volume. Message and
                  data rates may apply.
                </p>
                <p className="mt-4 rounded-sm border border-border bg-neutral-50 px-5 py-4 text-[0.95rem] leading-7 text-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-200">
                  <strong>
                    To get help, reply HELP. To cancel or opt out of text
                    messages at any time, reply STOP.
                  </strong>
                </p>
                <p className="mt-4">
                  Opting out of SMS does not cancel other Spurlock Labs services
                  you may use. Consent to receive text messages is not a
                  condition of purchase.
                </p>
              </section>

              <section aria-labelledby="carrier-disclaimer">
                <h2
                  id="carrier-disclaimer"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  Carrier Liability Disclaimer
                </h2>
                <p className="mt-4">
                  Mobile carriers are not liable for delayed or undelivered
                  messages. Spurlock Labs likewise is not responsible for
                  delivery failures, delays, or interruptions caused by wireless
                  carriers, handset compatibility issues, network outages, or
                  other circumstances outside our reasonable control.
                </p>
              </section>

              <section aria-labelledby="limitation">
                <h2
                  id="limitation"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  Limitation of Liability
                </h2>
                <p className="mt-4">
                  To the fullest extent permitted by law, Spurlock Labs is not
                  liable for indirect, incidental, special, or consequential
                  damages arising from your use of the services, including any
                  reliance on lead notifications or call alerts.
                </p>
              </section>

              <section aria-labelledby="privacy">
                <h2
                  id="privacy"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  Privacy Policy
                </h2>
                <p className="mt-4">
                  How Spurlock Labs collects, uses, and protects personal
                  information—including SMS opt-in data—is described in our{" "}
                  <Link
                    href="/spurlock-labs/privacy"
                    className="font-medium text-neutral-950 underline underline-offset-4 hover:text-blue-600 dark:text-neutral-50 dark:hover:text-blue-400"
                  >
                    Privacy Policy
                  </Link>
                  . By using the Spurlock Labs messaging program, you also
                  acknowledge that policy.
                </p>
              </section>

              <section aria-labelledby="support">
                <h2
                  id="support"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  Customer Support
                </h2>
                <p className="mt-4">
                  For questions about these Terms, the Spurlock Labs messaging
                  program, or account support, contact:
                </p>
                <p className="mt-4">
                  <a
                    href="mailto:support@jaedon.dev"
                    className="font-medium text-neutral-950 underline underline-offset-4 hover:text-blue-600 dark:text-neutral-50 dark:hover:text-blue-400"
                  >
                    support@jaedon.dev
                  </a>
                </p>
                <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                  You may also visit{" "}
                  <Link
                    href="/spurlock-labs"
                    className="underline underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    /spurlock-labs
                  </Link>{" "}
                  for client registration and general contact information, or
                  review our{" "}
                  <Link
                    href="/spurlock-labs/privacy"
                    className="underline underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </section>
            </div>
          </article>
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
