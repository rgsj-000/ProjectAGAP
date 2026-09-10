import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  House,
  LockKeyhole,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { ProjectAgapBrand } from "@/components/branding/ProjectAgapBrand";
import {
  HOUSEHOLD_HOME,
  LOGIN_PATH,
} from "@/lib/domain/applicationRoutes";

const process = [
  "Verified advisory",
  "Documented assessment",
  "Approved actions",
  "Human review",
];

export function PublicEntry() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            aria-label="Project AGAP home"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4"
          >
            <ProjectAgapBrand
              width={190}
              height={58}
              priority
              className="h-10 w-auto sm:h-11"
            />
          </Link>

          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>Lucena City, Quezon</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <section className="grid items-end gap-10 border-b border-slate-200 pb-12 lg:grid-cols-[1.35fr_0.65fr] lg:pb-16">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Disaster decision support
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">
              From verified warnings to clear local action.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Project AGAP helps disaster personnel review which communities
              need attention first, then turns the same verified information
              into practical household preparedness guidance.
            </p>
          </div>

          <aside className="border-l-2 border-blue-700 pl-5">
            <p className="text-sm font-bold text-slate-900">
              AI assists. LGU decides.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Risk assessment stays deterministic. Recommendations come from
              approved action rules. Authorized personnel remain in control.
            </p>
          </aside>
        </section>

        <section
          aria-labelledby="choose-access"
          className="py-10 sm:py-12"
        >
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2
                id="choose-access"
                className="text-xl font-bold tracking-tight text-slate-950"
              >
                Choose how you&apos;re using AGAP
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Operational records require an authorized Supabase account.
              </p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Lucena City pilot
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Link
              href={LOGIN_PATH}
              className="group rounded-2xl border border-slate-300 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4 sm:p-7"
            >
              <div className="flex items-start justify-between gap-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                  Sign in required
                </span>
              </div>

              <h3 className="mt-8 text-2xl font-bold tracking-tight">
                Authorized Personnel
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                Open the LGU operations workspace to review advisories,
                assessments, barangay records, damage and needs reports, and
                official action controls.
              </p>

              <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
                Sign in to LGU workspace
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>

            <Link
              href={HOUSEHOLD_HOME}
              className="group rounded-2xl border border-slate-300 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-4 sm:p-7"
            >
              <div className="flex items-start justify-between gap-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white">
                  <House className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  Public access
                </span>
              </div>

              <h3 className="mt-8 text-2xl font-bold tracking-tight">
                Household Preparedness
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                Get preparedness guidance from verified advisories and
                approved action rules. No LGU account, full name, or exact
                home address is required.
              </p>

              <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                Open household guide
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </div>
        </section>

        <section
          aria-label="How Project AGAP handles information"
          className="rounded-2xl border border-slate-200 bg-white px-5 py-6 sm:px-7"
        >
          <div className="grid gap-5 lg:grid-cols-[0.8fr_2.2fr] lg:items-center">
            <div>
              <p className="text-sm font-bold text-slate-950">
                One traceable decision path
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Evidence stays visible from source to action.
              </p>
            </div>

            <ol className="grid gap-3 sm:grid-cols-4">
              {process.map((step, index) => (
                <li
                  key={step}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-blue-700"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="sr-only">Step {index + 1}: </span>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <footer className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl">
            Official warnings and final emergency instructions remain with
            PAGASA and authorized LGUs. Project AGAP supports review,
            communication, and preparedness; it does not replace official
            disaster authorities.
          </p>
          <p className="shrink-0 sm:text-right">
            Project AGAP · Byte me Maybe
            <br />
            Southern Luzon State University
          </p>
        </footer>
      </div>
    </main>
  );
}
