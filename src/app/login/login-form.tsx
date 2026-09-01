"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/schemas/intake";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/ui/error-banner";
import { BlackgateMark } from "@/components/brand/blackgate-mark";
import { STAFF_CLOSED_KEY, STAFF_IDLE_MS, STAFF_LOCK_KEY } from "@/lib/session-security";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leaveReason = searchParams.get("reason");
  const authError = searchParams.get("error");
  const leaveNotice =
    leaveReason === "idle"
      ? `Signed out after ${Math.round(STAFF_IDLE_MS / 60000)} minutes of inactivity. Sign in again to continue.`
      : leaveReason === "closed"
        ? "Signed out because the last BLACKGATE window closed. Sign in again to continue."
        : leaveReason === "expired"
          ? "Session expired. Sign in again to continue."
          : null;
  const [error, setError] = useState(() => {
    if (authError === "Configuration" || authError === "Callback") {
      return "Sign-in could not finish. On Vercel, set NEXTAUTH_SECRET and NEXTAUTH_URL (your live BLACKGATE URL), plus DATABASE_URL from BLACKBOX.";
    }
    if (authError) {
      return "Sign-in was interrupted. Use your BLACKBOX employee email and password.";
    }
    return "";
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginValues) {
    setError("");
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (res?.error) {
      setError(
        res.error === "Configuration" || res.error === "Callback"
          ? "Sign-in could not finish. Set NEXTAUTH_SECRET and NEXTAUTH_URL on Vercel to this site’s URL."
          : "Sign-in rejected. Use your BLACKBOX employee email and password."
      );
      return;
    }
    try {
      sessionStorage.setItem(STAFF_LOCK_KEY, "1");
      localStorage.removeItem(STAFF_CLOSED_KEY);
    } catch {
      // private mode
    }
    router.push("/queue");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% -10%, rgba(232,184,74,0.1), transparent)",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="eyebrow mb-4">Internal intake system</p>
          <BlackgateMark
            as="h1"
            className="justify-center font-serif text-4xl font-bold tracking-[0.22em] text-brand-gold sm:text-5xl"
          />
          <p className="mt-4 text-sm leading-relaxed text-brand-white/80">
            Employee sign-in — same email and password as BLACKBOX. The public
            form lives at /intake and does not use this screen.
          </p>
        </div>

        <div className="mb-8 border border-brand-white/10 bg-brand-navy-deep/40 px-4 py-3 text-center">
          <p className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-brand-slate">
            Operated for
          </p>
          <p className="mt-1.5 font-serif text-xs font-semibold tracking-[0.14em] text-brand-white/85">
            BLACKLINE PUBLIC ADJUSTERS LLC
          </p>
        </div>

        <div className="hairline mb-8" />

        {leaveNotice ? (
          <ErrorBanner message={leaveNotice} className="mb-6" />
        ) : null}

        {error ? (
          <ErrorBanner
            message={error}
            onDismiss={() => setError("")}
            className="mb-6"
          />
        ) : null}

        <form
          method="post"
          action="#"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-denied">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-xs text-denied">{errors.password.message}</p>
            ) : null}
          </div>
          <Button
            type="submit"
            variant="solid"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Authenticating…" : "Enter BLACKGATE™"}
          </Button>
        </form>

        <p className="mt-8 text-center font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-slate">
          Authorized personnel only · idle sign-out 5 min · window close ends session
        </p>
      </div>
    </div>
  );
}
