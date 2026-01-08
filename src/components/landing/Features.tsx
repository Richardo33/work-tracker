import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, CalendarDays, Ghost } from "lucide-react";

const features = [
  {
    title: "Application Tracker",
    desc: "Manually track every company and role you applied for.",
    icon: ClipboardList,
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    title: "Recruitment Calendar",
    desc: "Schedule interviews and tests in a familiar calendar view.",
    icon: CalendarDays,
    color: "bg-sky-100 text-sky-600",
  },
  {
    title: "Auto Ghosting Detection",
    desc: "No update for 14 days? Automatically marked as ghosting.",
    icon: Ghost,
    color: "bg-emerald-100 text-emerald-600",
  },
];

export default function Features() {
  return (
    <section className="relative px-6 py-20">
      {/* divider halus biar transisinya enak, bukan blok */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-white/0 via-white/20 to-white/0"
      />

      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Core Features
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Built to keep your job search organized and stress-free.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.title}
                className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur"
              >
                <CardContent className="p-6">
                  <div
                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {f.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
