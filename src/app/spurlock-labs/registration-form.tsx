"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SMS_DISCLOSURE =
  "By checking this box, you agree to receive lead notification and customer care text messages from Spurlock Labs. Message frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to opt out.";

const fieldClassName =
  "mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50";

const labelClassName =
  "text-xs font-medium text-neutral-600 dark:text-neutral-400";

type FormState = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  nicheCity: string;
  smsConsent: boolean;
};

const initialState: FormState = {
  fullName: "",
  businessName: "",
  email: "",
  phone: "",
  nicheCity: "",
  smsConsent: false,
};

export function SpurlockLabsRegistrationForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !form.fullName.trim() ||
      !form.businessName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.nicheCity.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (!form.smsConsent) {
      setError("Please check the SMS consent box to continue.");
      return;
    }

    setSubmitted(true);
  }

  return (
    <section className="mt-10" aria-labelledby="registration-heading">
      <h2
        id="registration-heading"
        className="text-xs font-medium uppercase tracking-wider text-neutral-500"
      >
        Client Registration
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        Registering ensures business owners receive instant lead notifications
        and call alerts.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="full-name" className={labelClassName}>
            Full Name
          </label>
          <input
            id="full-name"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            disabled={submitted}
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            className={fieldClassName}
          />
        </div>

        <div>
          <label htmlFor="business-name" className={labelClassName}>
            Business Name / DBA
          </label>
          <input
            id="business-name"
            name="businessName"
            type="text"
            autoComplete="organization"
            required
            disabled={submitted}
            value={form.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            className={fieldClassName}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClassName}>
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={submitted}
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={fieldClassName}
          />
        </div>

        <div>
          <label htmlFor="phone" className={labelClassName}>
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            disabled={submitted}
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="Mobile number"
            className={fieldClassName}
          />
        </div>

        <div>
          <label htmlFor="niche-city" className={labelClassName}>
            Target Service Niche/City
          </label>
          <input
            id="niche-city"
            name="nicheCity"
            type="text"
            required
            disabled={submitted}
            value={form.nicheCity}
            onChange={(e) => updateField("nicheCity", e.target.value)}
            className={fieldClassName}
          />
        </div>

        <div className="flex items-start gap-3 pt-1">
          <input
            id="sms-consent"
            name="smsConsent"
            type="checkbox"
            checked={form.smsConsent}
            disabled={submitted}
            onChange={(e) => updateField("smsConsent", e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded-sm border-border accent-foreground"
          />
          <label
            htmlFor="sms-consent"
            className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300"
          >
            {SMS_DISCLOSURE}
          </label>
        </div>

        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={submitted}
          className={cn(
            "h-10 w-full rounded-sm bg-neutral-950 text-sm font-medium text-white hover:bg-neutral-800",
            "dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200",
          )}
        >
          Complete Registration
        </Button>
      </form>

      {submitted && (
        <output
          className="mt-6 block rounded-sm border border-border bg-neutral-100/60 px-4 py-3 text-sm leading-relaxed text-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-200"
          aria-live="polite"
        >
          Your registration has been received. Text alerts are now active — you
          will receive lead notification and call alerts at the mobile number
          you provided.
        </output>
      )}
    </section>
  );
}
