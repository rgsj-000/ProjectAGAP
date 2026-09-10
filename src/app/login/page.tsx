"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, LogIn, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/client/supabase";
import {
  OPERATIONS_HOME,
  PUBLIC_HOME,
} from "@/lib/domain/applicationRoutes";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.replace(OPERATIONS_HOME);
      router.refresh();
    } catch {
      setErrorMessage("Unable to connect to the authentication service.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="hidden border-r border-slate-800 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-bold tracking-tight">PROJECT AGAP</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
            AI-Guided Assessment and Prioritization for disaster preparedness,
            response, and recovery review.
          </p>
        </div>

        <div className="max-w-md">
          <ShieldCheck className="h-9 w-9 text-blue-400" aria-hidden="true" />
          <h1 className="mt-6 text-4xl font-black tracking-[-0.03em]">
            Authorized access only.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Operational records, assessments, verification controls, and
            post-impact reports are protected through Supabase authentication
            and LGU role permissions.
          </p>
        </div>

        <p className="text-xs text-slate-500">
          Lucena City pilot · Project AGAP
        </p>
      </section>

      <section className="flex items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href={PUBLIC_HOME}
            className="mb-10 inline-flex items-center gap-2 rounded-md text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Project AGAP
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <div className="mb-8">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                LGU operations
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Sign in
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use the Supabase account issued for your authorized AGAP role.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-slate-700">
                Email address
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Password
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              {errorMessage && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                )}
                {isSubmitting ? "Signing in..." : "Sign in to workspace"}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-slate-500">
            Household preparedness remains available from the public Project
            AGAP page without an LGU account.
          </p>
        </div>
      </section>
    </main>
  );
}
