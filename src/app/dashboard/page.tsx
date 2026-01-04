import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/ui/Statusbadge";
import ClientDateTime from "@/components/common/ClientDateTime";
import { STATUS_META, type AppStatus } from "@/lib/applicationStatus";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppItem = {
  id: string;
  company: string;
  role: string;
  status: AppStatus;
  nextEventAt?: string; // ISO
  nextEventTitle?: string;
};

const applications: AppItem[] = [
  {
    id: "a1",
    company: "PT Example",
    role: "Frontend Developer",
    status: "interview",
    nextEventAt: "2026-01-04T14:00:00",
    nextEventTitle: "HR Interview",
  },
  {
    id: "a2",
    company: "Company A",
    role: "Fullstack Developer",
    status: "technical_test",
    nextEventAt: "2026-01-05T10:00:00",
    nextEventTitle: "Technical Test",
  },
  {
    id: "a3",
    company: "Startup B",
    role: "Backend Developer",
    status: "screening",
  },
  {
    id: "a4",
    company: "Fintech C",
    role: "Junior Software Engineer",
    status: "ghosting",
  },
  {
    id: "a5",
    company: "Agency D",
    role: "React Developer",
    status: "rejected",
  },
];

const statusMeta = (
  [
    "applied",
    "screening",
    "interview",
    "technical_test",
    "offer",
    "ghosting",
    "rejected",
  ] as const
).map((key) => ({
  key,
  label: STATUS_META[key].label,
  dot: STATUS_META[key].dot,
}));

function countByStatus(rows: AppItem[]) {
  const init: Record<AppStatus, number> = {
    applied: 0,
    screening: 0,
    interview: 0,
    technical_test: 0,
    offer: 0,
    rejected: 0,
    ghosting: 0,
    hired: 0,
    withdrawn: 0,
  };

  for (const r of rows) {
    init[r.status] += 1;
  }
  return init;
}

function getUpcoming(rows: AppItem[]) {
  return rows
    .filter((r) => r.nextEventAt)
    .map((r) => ({ ...r, t: new Date(r.nextEventAt as string).getTime() }))
    .filter((r) => !Number.isNaN(r.t))
    .sort((a, b) => a.t - b.t);
}

export default function DashboardPage() {
  const stats = countByStatus(applications);
  const total = applications.length;

  const activeCount = applications.filter(
    (a) => a.status !== "rejected" && a.status !== "withdrawn"
  ).length;

  const upcoming = getUpcoming(applications);
  const nextUp = upcoming[0] ?? null;

  const distribution = total
    ? statusMeta
        .map((s) => ({
          ...s,
          count: stats[s.key],
          pct: (stats[s.key] / total) * 100,
        }))
        .filter((x) => x.count > 0)
    : [];

  const recent = applications.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">
            Track applications & schedule interviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
            asChild
          >
            <Link href="/dashboard/applications/new">
              <span className="inline-flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </span>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="rounded-xl border-slate-200 bg-white/60"
            asChild
          >
            <Link href="/dashboard/applications">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
          <CardContent className="p-5">
            <p className="text-xs text-slate-600">Active</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {activeCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">Excluding rejected</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
          <CardContent className="p-5">
            <p className="text-xs text-slate-600">Interview</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {stats.interview}
            </p>
            <p className="mt-1 text-xs text-slate-500">In progress</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
          <CardContent className="p-5">
            <p className="text-xs text-slate-600">Technical Test</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {stats.technical_test}
            </p>
            <p className="mt-1 text-xs text-slate-500">Pending</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
          <CardContent className="p-5">
            <p className="text-xs text-slate-600">Next up</p>
            {nextUp ? (
              <>
                <p className="mt-2 text-sm font-semibold text-slate-900 truncate">
                  {nextUp.nextEventTitle ?? "Upcoming event"}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  <span className="text-slate-500">{nextUp.company}</span> ·{" "}
                  <span className="font-medium text-slate-800">
                    <ClientDateTime value={nextUp.nextEventAt} />
                  </span>
                </p>
                <Link
                  href={`/dashboard/applications/${nextUp.id}`}
                  className="mt-2 inline-block text-xs font-medium text-indigo-700 hover:underline"
                >
                  Open detail →
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm font-semibold text-slate-900">-</p>
                <p className="mt-1 text-xs text-slate-500">
                  No upcoming agenda
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status distribution (mini) */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Status overview
            </h2>
            <p className="text-xs text-slate-500">
              Quick breakdown of your pipeline.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Total: <span className="font-medium text-slate-800">{total}</span>
          </p>
        </div>

        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          {total === 0 ? (
            <div className="h-full w-full bg-slate-200" />
          ) : (
            distribution.map((d) => (
              <div
                key={d.key}
                className={`inline-block h-full ${d.dot}`}
                style={{ width: `${d.pct}%` }}
                title={`${d.label}: ${d.count}`}
              />
            ))
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {statusMeta.map((s) => (
            <Link
              key={s.key}
              href={`/dashboard/applications`}
              className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 text-xs text-slate-700 hover:bg-white"
              title="Open Applications"
            >
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              <span className="font-medium">{s.label}</span>
              <span className="text-slate-500">({stats[s.key]})</span>
            </Link>
          ))}
        </div>
      </div>

      {/* My applications */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            My applications
          </h2>
          <Link
            href="/dashboard/applications"
            className="text-xs font-medium text-indigo-700 hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {recent.map((a) => (
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

                  {a.nextEventAt ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Next:{" "}
                      <span className="font-medium text-slate-700">
                        {a.nextEventTitle}
                      </span>{" "}
                      · <ClientDateTime value={a.nextEventAt} />
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

      {/* Upcoming agenda */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Upcoming agenda
          </h2>
          <p className="text-xs text-slate-600">Next 7 days</p>
        </div>

        <div className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-6 text-sm text-slate-600">
              No upcoming events yet. Add an interview/test schedule from an
              application detail.
            </div>
          ) : (
            upcoming.slice(0, 4).map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/applications/${a.id}`}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-4 hover:bg-white"
              >
                <div className="min-w-0">
                  <p className="text-xs text-slate-600">
                    <ClientDateTime value={a.nextEventAt} />
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {a.nextEventTitle}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
