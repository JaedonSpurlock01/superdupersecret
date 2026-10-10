import Link from "next/link";
import { StaggerContainer } from "@/components/stagger-container";
import { AnimatedTextLink } from "@/components/ui/animated-text-link";

export const metadata = {
  title: "Terms of Service | Spurlock Labs",
  description:
    "Terms of Service for Spurlock Labs client registration and SMS messaging.",
};

export default function SpurlockLabsTermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-20 pb-16 lg:px-0">
        <StaggerContainer className="max-w-xl" delayStep={100}>
          <AnimatedTextLink href="/spurlock-labs" arrowSide="left">
            Terms of Service
          </AnimatedTextLink>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your use of
              Spurlock Labs services, including client registration and SMS lead
              notification features. By completing registration or using our
              services, you agree to these Terms.
            </p>

            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Services
              </h2>
              <p className="mt-3">
                Spurlock Labs provides digital marketing infrastructure,
                software applications, and web services for local businesses,
                including lead notification and call alert messaging to
                registered mobile numbers.
              </p>
            </section>

            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                SMS Terms
              </h2>
              <p className="mt-3">
                By checking the SMS consent box and submitting the registration
                form, you agree to receive lead notification and customer care
                text messages from Spurlock Labs. Message frequency varies.
                Message and data rates may apply. Reply HELP for help or STOP to
                cancel. Opting out of SMS does not cancel other Spurlock Labs
                services you may use.
              </p>
            </section>

            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Accurate Information
              </h2>
              <p className="mt-3">
                You agree to provide accurate registration details, including a
                mobile number that you own or are authorized to use for
                receiving text messages.
              </p>
            </section>

            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Limitation of Liability
              </h2>
              <p className="mt-3">
                To the fullest extent permitted by law, Spurlock Labs is not
                liable for indirect, incidental, or consequential damages
                arising from use of the services or delays in message delivery
                caused by carriers or third-party networks.
              </p>
            </section>

            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Contact
              </h2>
              <p className="mt-3">
                For questions about these Terms, contact{" "}
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
