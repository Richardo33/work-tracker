"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/ui/Statusbadge";
import ClientDateTime from "@/components/common/ClientDateTime";
import { Search, Plus, ArrowUpDown } from "lucide-react";

type Status =
  | "applied"
  | "screening"
  | "interview"
  | "technical_test"
  | "offer"
  | "rejected"
  | "ghosting";

type Application = {
  id: string;
  company: string;
  role: string;
  location: string;
  workSetup: "Onsite" | "Hybrid" | "Remote";
  status: Status;
  appliedAt: string; // YYYY-MM-DD or ISO
  lastUpdate: string; // YYYY-MM-DD or ISO
  nextEventAt?: string; // ISO (optional)
  nextEventTitle?: string;
};

const data: Application[] = [
  {
    id: "a1",
    company: "PT Example",
    role: "Frontend Developer",
    location: "Jakarta",
    workSetup: "Hybrid",
    status: "interview",
    appliedAt: "2025-12-21",
    lastUpdate: "2025-12-26",
    nextEventAt: "2026-01-04T14:00:00",
    nextEventTitle: "HR Interview",
  },
  {
    id: "a2",
    company: "Company A",
    role: "Fullstack Developer",
    location: "Remote",
    workSetup: "Remote",
    status: "technical_test",
    appliedAt: "2025-12-15",
    lastUpdate: "2025-12-27",
    nextEventAt: "2026-01-05T10:00:00",
    nextEventTitle: "Technical Test",
  },
  {
    id: "a3",
    company: "Startup B",
    role: "Backend Developer",
    location: "Bandung",
    workSetup: "Onsite",
    status: "screening",
    appliedAt: "2025-12-10",
    lastUpdate: "2025-12-12",
  },
];

const statusTabs: Array<{ key: "all" | Status; label: string }> = [
  { key: "all", label: "All" },
  { key: "applied", label: "Applied" },
  { key: "screening", label: "Screening" },
  { key: "interview", label: "Interview" },
  { key: "technical_test", label: "Test" },
  { key: "offer", label: "Offer" },
  { key: "ghosting", label: "Ghosting" },
  { key: "rejected", label: "Rejected" },
];

type SortKey = "lastUpdateDesc" | "companyAsc" | "nextEventAsc" | "statusAsc";

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: "lastUpdateDesc", label: "Last update (newest)" },
  { key: "nextEventAsc", label: "Next event (soonest)" },
  { key: "companyAsc", label: "Company (A–Z)" },
  { key: "statusAsc", label: "Status" },
];

function countByStatus(rows: Application[]) {
  const init: Record<Status, number> = {
    applied: 0,
    screening: 0,
    interview: 0,
    technical_test: 0,
    offer: 0,
    rejected: 0,
    ghosting: 0,
  };

  for (const r of rows) init[r.status] += 1;
  return init;
}

function getNextUpcoming(rows: Application[]) {
  const upcoming = rows
    .filter((r) => r.nextEventAt)
    .map((r) => ({
      ...r,
      t: new Date(r.nextEventAt as string).getTime(),
    }))
    .filter((r) => !Number.isNaN(r.t))
    .sort((a, b) => a.t - b.t);

  return upcoming[0] ?? null;
}

export default function ApplicationsPage() {
  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<"all" | Status>("all");
  const [sortKey, setSortKey] = useState<SortKey>("lastUpdateDesc");
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const rows = data.filter((a) => {
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
  }, [query, activeStatus, sortKey]);

  const stats = useMemo(() => countByStatus(filtered), [filtered]);
  const nextUp = useMemo(() => getNextUpcoming(filtered), [filtered]);

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
                <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
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
                            {a.nextEventTitle} ·{" "}
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
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-10 text-center text-sm text-slate-600 shadow-sm backdrop-blur">
            No applications found. Try a different keyword or filter.
          </div>
        )}
      </div>
    </div>
  );
}
