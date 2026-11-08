"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "./shared";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed");
        return;
      }
      window.location.reload();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="password"
          autoComplete="current-password"
          aria-label="Password"
          placeholder="Password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          // biome-ignore lint/a11y/noAutofocus: single-purpose login page
          autoFocus
        />
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        <Button type="submit" size="lg" disabled={pending || !password}>
          {pending ? "…" : "Enter"}
        </Button>
      </form>
    </div>
  );
}
