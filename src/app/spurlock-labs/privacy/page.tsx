import Link from "next/link";
import { StaggerContainer } from "@/components/stagger-container";
import { AnimatedTextLink } from "@/components/ui/animated-text-link";

export const metadata = {
  title: "Privacy Policy | Spurlock Labs",
  description:
    "Privacy Policy for Spurlock Labs (sole proprietorship), including data collection, SMS / A2P messaging practices, and how to contact us with privacy inquiries.",
};

export default function SpurlockLabsPrivacyPage() {
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
                Privacy Policy
              </h1>
              <p className="max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-400">
                This Privacy Policy applies to{" "}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  Spurlock Labs
                </span>
                , operating as a sole proprietorship. It describes how we
                collect, use, and protect personal information when you use our
                website, client onboarding form, and related messaging services.
              </p>
              <p className="text-sm text-neutral-500">
                Last updated: October 10, 2026
              </p>
            </header>

            <div className="mt-12 space-y-14 text-base leading-7 text-neutral-700 dark:text-neutral-300">
              <section aria-labelledby="who-we-are">
                <h2
                  id="who-we-are"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  Who We Are
                </h2>
                <p className="mt-4">
                  Spurlock Labs is a sole proprietorship that provides digital
                  marketing infrastructure, software applications, and web
                  services for local businesses. References to &quot;Spurlock
                  Labs,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;
                  in this Privacy Policy mean Spurlock Labs operating as a sole
                  proprietorship.
                </p>
              </section>

              <section aria-labelledby="data-we-collect">
                <h2
                  id="data-we-collect"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  Information We Collect
                </h2>
                <p className="mt-4">
                  When you complete our client onboarding and SMS opt-in form,
                  we collect information you submit, including:
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5">
                  <li>Full name and contact information</li>
                  <li>Business name / DBA</li>
                  <li>Email address</li>
                  <li>Mobile phone number</li>
                  <li>Target service niche and city</li>
                  <li>
                    SMS consent status and related compliance records (such as
                    the time of opt-in)
                  </li>
                </ul>
                <p className="mt-4">
                  We may also collect basic technical information needed to
                  operate the website securely, such as browser type and general
                  usage logs.
                </p>
              </section>

              <section aria-labelledby="how-we-use">
                <h2
                  id="how-we-use"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  How We Use Your Information
                </h2>
                <p className="mt-4">
                  We use the information collected through client onboarding to:
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5">
                  <li>
                    Route local service leads to the correct business contact
                  </li>
                  <li>
                    Send operational lead notification and call alert text
                    messages
                  </li>
                  <li>
                    Provide customer care notifications and account-related
                    support communications
                  </li>
                  <li>
                    Maintain SMS / A2P compliance records and honor HELP / STOP
                    requests
                  </li>
                  <li>Operate, secure, and improve Spurlock Labs services</li>
                </ul>
                <p className="mt-4">
                  Message frequency varies based on lead activity and support
                  needs. Message and data rates may apply. Reply HELP for help
                  or STOP to opt out at any time. Consent to receive text
                  messages is not a condition of purchase.
                </p>
              </section>

              <section aria-labelledby="sms-a2p">
                <h2
                  id="sms-a2p"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  SMS / A2P Compliance
                </h2>
                <p className="mt-4">
                  Spurlock Labs uses text messaging to deliver operational lead
                  notifications and customer care communications to business
                  owners who have explicitly opted in through our registration
                  form.
                </p>
                <p className="mt-4 rounded-sm border border-border bg-neutral-50 px-5 py-4 text-[0.95rem] leading-7 text-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-200">
                  We do not sell, rent, or share your SMS opt-in data or
                  personal information with third parties for marketing
                  purposes. All information collected for text messaging
                  compliance and communications is kept strictly confidential
                  and used solely for providing operational lead notifications
                  and customer support.
                </p>
              </section>

              <section aria-labelledby="sharing">
                <h2
                  id="sharing"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  Service Providers
                </h2>
                <p className="mt-4">
                  We may use trusted service providers solely to help us deliver
                  messaging, host infrastructure, or operate our platform. These
                  providers are permitted to process personal information only
                  as needed to perform services on our behalf and are expected
                  to protect that information appropriately. They are not
                  authorized to use SMS opt-in data or personal information for
                  their own marketing.
                </p>
              </section>

              <section aria-labelledby="retention">
                <h2
                  id="retention"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  Data Retention
                </h2>
                <p className="mt-4">
                  We retain registration and SMS consent records for as long as
                  needed to provide services, meet legal and carrier compliance
                  obligations, and resolve disputes. When information is no
                  longer required, we delete or de-identify it in accordance
                  with our operational practices.
                </p>
              </section>

              <section aria-labelledby="your-choices">
                <h2
                  id="your-choices"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  Your Choices
                </h2>
                <p className="mt-4">
                  You may opt out of Spurlock Labs text messages at any time by
                  replying STOP. For help with messaging, reply HELP. You may
                  also contact us using the support email below to update
                  account details or ask questions about the information we
                  hold.
                </p>
              </section>

              <section aria-labelledby="contact">
                <h2
                  id="contact"
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  Contact Us
                </h2>
                <p className="mt-4">
                  For privacy inquiries related to Spurlock Labs, contact:
                </p>
                <p className="mt-4">
                  <a
                    href="mailto:spurjae@gmail.com"
                    className="font-medium text-neutral-950 underline underline-offset-4 hover:text-blue-600 dark:text-neutral-50 dark:hover:text-blue-400"
                  >
                    spurjae@gmail.com
                  </a>
                </p>
                <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                  You may also visit{" "}
                  <Link
                    href="/spurlock-labs"
                    className="underline underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    spurlock-labs
                  </Link>{" "}
                  for general client registration and contact information.
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
