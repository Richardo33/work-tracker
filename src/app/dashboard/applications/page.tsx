"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/ui/Statusbadge";
import ClientDateTime from "@/components/common/ClientDateTime";
import { Search, Plus, ArrowUpDown } from "lucide-react";

import { STATUS_META, type AppStatus } from "@/lib/applicationStatus";

type Status = AppStatus;

type Application = {
  id: string;
  company: string;
  role: string;
  location: string;
  workSetup: "Onsite" | "Hybrid" | "Remote";
  status: Status;
  appliedAt: string; // ISO
  lastUpdate: string; // ISO
  nextEventAt?: string; // ISO
  nextEventTitle?: string | null;
};

type ApiResponse = { items: Application[] };

const statusTabs: Array<{ key: "all" | Status; label: string }> = [
  { key: "all", label: "All" },
  { key: "applied", label: STATUS_META.applied.label },
  { key: "screening", label: STATUS_META.screening.label },
  { key: "interview", label: STATUS_META.interview.label },
  { key: "technical_test", label: "Test" },
  { key: "offer", label: STATUS_META.offer.label },
  { key: "ghosting", label: STATUS_META.ghosting.label },
  { key: "rejected", label: STATUS_META.rejected.label },
];

type SortKey = "lastUpdateDesc" | "companyAsc" | "nextEventAsc" | "statusAsc";

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: "lastUpdateDesc", label: "Last update (newest)" },
  { key: "nextEventAsc", label: "Next event (soonest)" },
  { key: "companyAsc", label: "Company (A–Z)" },
  { key: "statusAsc", label: "Status" },
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
  barClass: STATUS_META[key].dot,
}));

function countByStatus(rows: Application[]) {
  const init: Record<Status, number> = {
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

  for (const r of rows) init[r.status] += 1;
  return init;
}

function getNextUpcoming(rows: Application[]) {
  const upcoming = rows
    .filter((r) => r.nextEventAt)
    .map((r) => ({ ...r, t: new Date(r.nextEventAt as string).getTime() }))
    .filter((r) => !Number.isNaN(r.t))
    .sort((a, b) => a.t - b.t);

  return upcoming[0] ?? null;
}

export default function ApplicationsPage() {
  const router = useRouter();

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<"all" | Status>("all");
  const [sortKey, setSortKey] = useState<SortKey>("lastUpdateDesc");
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    const ac = new AbortController();

    async function run() {
      try {
        setLoading(true);
        setLoadError(null);

        const res = await fetch("/api/applications", {
          method: "GET",
          cache: "no-store",
          signal: ac.signal,
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }

        const json = (await res.json()) as ApiResponse;
        setApps(json.items ?? []);
      } catch (e) {
        if (ac.signal.aborted) return;
        setLoadError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    run();
    return () => ac.abort();
  }, [router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const rows = apps.filter((a) => {
      const matchStatus =
        activeStatus === "all" ? true : a.status === activeStatus;

      const matchQuery =
        q.length === 0
          ? true
          : `${a.company} ${a.role} ${a.location}`.toLowerCase().includes(q);

      return matchStatus && matchQuery;
    });

    rows.sort((a, b) => {
      if (sortKey === "companyAsc") return a.company.localeCompare(b.company);
      if (sortKey === "statusAsc") return a.status.localeCompare(b.status);

      if (sortKey === "nextEventAsc") {
        const aTime = a.nextEventAt
          ? new Date(a.nextEventAt).getTime()
          : Number.POSITIVE_INFINITY;
        const bTime = b.nextEventAt
          ? new Date(b.nextEventAt).getTime()
          : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      }

      const aTime = new Date(a.lastUpdate).getTime();
      const bTime = new Date(b.lastUpdate).getTime();
      return bTime - aTime;
    });

    return rows;
  }, [apps, query, activeStatus, sortKey]);

  const stats = useMemo(() => countByStatus(filtered), [filtered]);
  const nextUp = useMemo(() => getNextUpcoming(filtered), [filtered]);

  const total = filtered.length;

  const distribution = useMemo(() => {
    if (total === 0) return [];
    return statusMeta
      .map((s) => ({
        ...s,
        count: stats[s.key],
        pct: (stats[s.key] / total) * 100,
      }))
      .filter((x) => x.count > 0);
  }, [stats, total]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-600">Loading from database...</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur">
          <p className="text-sm text-slate-600">Please wait…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-600">Failed to load data.</p>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur">
          <p className="text-sm text-slate-700">
            Error: <span className="font-medium">{loadError}</span>
          </p>

          <div className="mt-4 flex gap-2">
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-slate-200 bg-white/60"
              asChild
            >
              <Link href="/dashboard">Back</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-600">
            Filter, search, and sort your applications.
          </p>
        </div>

        <Button
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
          asChild
        >
          <Link href="/dashboard/applications/new">
            <span className="inline-flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Add application
            </span>
          </Link>
        </Button>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company, role, or location..."
              className="rounded-xl bg-white/60 pl-9"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              className="rounded-xl border-slate-200 bg-white/60"
              onClick={() => setSortOpen((v) => !v)}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort
            </Button>

            {sortOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSortKey(opt.key);
                      setSortOpen(false);
                    }}
                    className={[
                      "w-full px-4 py-2 text-left text-sm hover:bg-slate-50",
                      sortKey === opt.key
                        ? "bg-slate-50 font-medium text-slate-900"
                        : "text-slate-700",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {statusTabs.map((t) => {
            const active = t.key === activeStatus;
            return (
              <button
                key={t.key}
                onClick={() => setActiveStatus(t.key)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  active
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200/70 bg-white/60 text-slate-700 hover:bg-white",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        <p className="mt-3 text-xs text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-700">{filtered.length}</span>{" "}
          result{filtered.length === 1 ? "" : "s"} · Sort:{" "}
          <span className="font-medium text-slate-700">
            {sortOptions.find((s) => s.key === sortKey)?.label}
          </span>
        </p>
      </div>

      {/* Mini Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {filtered.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Apps in current filter
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Interview</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {stats.interview}
            </p>
            <button
              onClick={() => setActiveStatus("interview")}
              className="mt-2 text-xs font-medium text-indigo-700 hover:underline"
            >
              Filter interview →
            </button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Technical Test</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {stats.technical_test}
            </p>
            <button
              onClick={() => setActiveStatus("technical_test")}
              className="mt-2 text-xs font-medium text-indigo-700 hover:underline"
            >
              Filter test →
            </button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Next up</p>
            {nextUp ? (
              <>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">
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
                  View details →
                </Link>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm font-semibold text-slate-900">-</p>
                <p className="mt-1 text-xs text-slate-500">No upcoming event</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status distribution */}
      <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Status distribution
              </p>
              <p className="text-xs text-slate-500">
                Breakdown based on current filter.
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
                  className={`h-full ${d.barClass} inline-block`}
                  style={{ width: `${d.pct}%` }}
                  title={`${d.label}: ${d.count}`}
                />
              ))
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {statusMeta.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveStatus(s.key)}
                className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 text-xs text-slate-700 hover:bg-white"
              >
                <span className={`h-2 w-2 rounded-full ${s.barClass}`} />
                <span className="font-medium">{s.label}</span>
                <span className="text-slate-500">({stats[s.key]})</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-500">Quick actions:</div>

        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
            asChild
          >
            <Link href="/dashboard/applications/new">
              <span className="inline-flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add application
              </span>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="rounded-xl border-slate-200 bg-white/60"
            onClick={() => {
              setQuery("");
              setActiveStatus("all");
              setSortKey("lastUpdateDesc");
            }}
          >
            Reset filters
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/applications/${a.id}`}
            className="block"
          >
            <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {a.company}
                      </p>
                      <span className="text-xs text-slate-500">
                        • {a.location} • {a.workSetup}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-600">{a.role}</p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        Applied:{" "}
                        <ClientDateTime value={a.appliedAt} showTime={false} />
                      </span>
                      <span>
                        Last update:{" "}
                        <ClientDateTime value={a.lastUpdate} showTime={false} />
                      </span>
                      {a.nextEventAt ? (
                        <span className="text-slate-700">
                          Next:{" "}
                          <span className="font-medium">
                            {a.nextEventTitle ?? "Upcoming event"} ·{" "}
                            <ClientDateTime value={a.nextEventAt} />
                          </span>
                        </span>
                      ) : (
                        <span>Next: -</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 md:flex-col md:items-end">
                    <StatusBadge status={a.status} />
                    <span className="text-xs text-indigo-700 hover:underline">
                      View details
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-10 text-center shadow-sm backdrop-blur">
            <p className="text-sm font-semibold text-slate-900">
              Nothing here yet
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {query.trim()
                ? "No results match your keyword. Try a different search."
                : activeStatus !== "all"
                ? `No applications in "${activeStatus}" status yet.`
                : "Start by adding your first application."}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                asChild
              >
                <Link href="/dashboard/applications/new">Add application</Link>
              </Button>

              <Button
                variant="outline"
                className="rounded-xl border-slate-200 bg-white/60"
                onClick={() => {
                  setQuery("");
                  setActiveStatus("all");
                  setSortKey("lastUpdateDesc");
                }}
              >
                Reset filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
