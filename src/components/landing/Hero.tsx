import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-indigo-50 via-slate-50 to-emerald-50 px-6 py-28">
      {/* pastel blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-112 w-240 -translate-x-1/2 rounded-full bg-linear-to-r from-indigo-200/50 via-sky-200/40 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-linear-to-tr from-emerald-200/40 to-transparent blur-3xl" />
        <div className="absolute bottom-10 left-0 h-64 w-64 rounded-full bg-linear-to-tr from-rose-200/30 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl">
        <span className="inline-flex items-center rounded-full border border-indigo-200/60 bg-white/60 px-3 py-1 text-xs font-medium text-indigo-900 backdrop-blur">
          WGN · Work Gantt Navigator
        </span>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
          Track your job applications
          <span className="block text-slate-600">with clarity and calm.</span>
        </h1>

        <p className="mt-5 max-w-2xl text-base text-slate-600 md:text-lg">
          A simple, manual-first recruitment tracker with calendar scheduling
          and auto ghosting after 14 days.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            asChild
            className="rounded-xl bg-indigo-600 px-6 hover:bg-indigo-700"
          >
            <Link href="/register">Get Started</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="rounded-xl border-slate-300 bg-white/60 px-6 backdrop-blur hover:bg-white"
          >
            <Link href="/login">Login</Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="rounded-xl px-6 text-slate-700 hover:bg-white/50"
          >
            <Link href="/dashboard">Preview App</Link>
          </Button>
        </div>

        {/* highlight mini cards */}
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {[
            { t: "Manual Tracker", d: "Track status, notes, and next steps." },
            {
              t: "Calendar Agenda",
              d: "Plan interviews & tests by time slot.",
            },
            { t: "Auto Ghosting", d: "14 days no update → marked ghosting." },
          ].map((x) => (
            <div
              key={x.t}
              className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 backdrop-blur"
            >
              <p className="text-sm font-semibold text-slate-900">{x.t}</p>
              <p className="mt-1 text-sm text-slate-600">{x.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
