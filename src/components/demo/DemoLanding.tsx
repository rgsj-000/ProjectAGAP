"use client";

import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Home, ShieldCheck } from "lucide-react";
import { ProjectAgapBrand } from "@/components/branding/ProjectAgapBrand";

export function DemoLanding({ onOpenDemo }: { onOpenDemo: () => void }) {
  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-6xl flex-col rounded-2xl border border-slate-200 bg-white shadow-sm sm:min-h-[calc(100dvh-5rem)]">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-8">
          <ProjectAgapBrand width={190} height={56} priority className="h-10 w-auto max-w-[170px]" />
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase text-blue-800">Demo mode</span>
        </header>

        <div className="grid flex-1 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex flex-col justify-center px-5 py-10 sm:px-10 sm:py-14 lg:px-14" aria-labelledby="landing-title">
            <div className="flex size-12 items-center justify-center rounded-xl bg-blue-700 text-white">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </div>
            <p className="mt-6 text-sm font-bold uppercase text-blue-700">AI Guided Assessment and Prioritization</p>
            <h1 id="landing-title" className="mt-3 max-w-2xl text-balance text-4xl font-black leading-tight sm:text-5xl">Verified information. Explainable priorities. Accountable action.</h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg">
              Turning verified disaster information into explainable LGU priorities and household preparedness actions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={onOpenDemo} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800">
                <Building2 className="size-4" aria-hidden="true" /> Open LGU Demo <ArrowRight className="size-4" aria-hidden="true" />
              </button>
              <Link href="/household" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 hover:bg-slate-50">
                <Home className="size-4" aria-hidden="true" /> Household Preparedness
              </Link>
            </div>
          </section>

          <aside className="border-t border-slate-200 bg-slate-950 px-5 py-8 text-white sm:px-10 lg:border-l lg:border-t-0 lg:px-12 lg:py-14" aria-label="AGAP decision support boundaries">
            <p className="text-xs font-bold uppercase text-blue-300">Decision support, with clear boundaries</p>
            <h2 className="mt-3 text-balance text-2xl font-bold">Built for the questions an operations team asks first.</h2>
            <ol className="mt-8 space-y-5">
              {[
                ["01", "What is happening?", "Verified advisory and source context"],
                ["02", "Who needs attention first?", "Deterministic barangay prioritization"],
                ["03", "Why?", "Visible inputs, estimates, evidence, and action rules"],
                ["04", "What happens next?", "LGU-reviewed actions and validation"],
              ].map(([number, title, detail]) => (
                <li key={number} className="flex gap-4 border-t border-slate-800 pt-4">
                  <span className="font-mono text-xs font-bold text-blue-300">{number}</span>
                  <div><p className="font-bold">{title}</p><p className="mt-1 text-sm text-slate-400">{detail}</p></div>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <p>AI may explain and simplify approved information. It does not calculate risk, order evacuation, choose routes, or allocate resources.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
