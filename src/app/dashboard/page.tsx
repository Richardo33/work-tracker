import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/ui/Statusbadge";

type AppItem = {
  id: string;
  company: string;
  role: string;
  status: string;
  nextEvent?: { when: string; title: string };
};

const applications: AppItem[] = [
  {
    id: "a1",
    company: "PT Example",
    role: "Frontend Developer",
    status: "interview",
    nextEvent: { when: "Tomorrow · 14:00", title: "HR Interview" },
  },
  {
    id: "a2",
    company: "Company A",
    role: "Fullstack Developer",
    status: "technical_test",
    nextEvent: { when: "Fri · 10:00", title: "Technical Test" },
  },
  {
    id: "a3",
    company: "Startup B",
    role: "Backend Developer",
    status: "screening",
    nextEvent: { when: "Mon · 09:30", title: "Follow-up" },
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Quick summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Active", value: "8" },
          { label: "Interview", value: "2" },
          { label: "Ghosting", value: "3" },
        ].map((s) => (
          <Card
            key={s.label}
            className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur"
          >
            <CardContent className="p-5">
              <p className="text-xs text-slate-600">{s.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Applications (NextStep-like list) */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            My applications
          </h2>
          <Link
            href="/dashboard/tracker"
            className="text-xs font-medium text-indigo-700 hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {applications.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/applications/${a.id}`}
              className="block rounded-2xl border border-slate-200/70 bg-white/60 p-4 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {a.company}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{a.role}</p>

                  {a.nextEvent ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Next:{" "}
                      <span className="font-medium text-slate-700">
                        {a.nextEvent.title}
                      </span>{" "}
                      · {a.nextEvent.when}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      No upcoming agenda
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  <StatusBadge status={a.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming agenda (still useful but compact) */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Upcoming agenda
          </h2>
          <p className="text-xs text-slate-600">Next 7 days</p>
        </div>

        <div className="mt-4 space-y-3">
          {applications
            .filter((a) => a.nextEvent)
            .map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/applications/${a.id}`}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-4 hover:bg-white"
              >
                <div className="min-w-0">
                  <p className="text-xs text-slate-600">{a.nextEvent!.when}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {a.nextEvent!.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {a.company} · {a.role}
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                    Scheduled
                  </span>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
