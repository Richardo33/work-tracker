"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/ui/Statusbadge";
import { Search, Plus, ArrowUpDown } from "lucide-react";
import ClientDateTime from "@/components/common/ClientDateTime";

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
  appliedAt: string; // ISO date string
  lastUpdate: string; // ISO date string
  nextEventAt?: string; // ISO date string (optional)
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
  {
    id: "a4",
    company: "Fintech C",
    role: "Junior Software Engineer",
    location: "Jakarta",
    workSetup: "Hybrid",
    status: "ghosting",
    appliedAt: "2025-11-20",
    lastUpdate: "2025-11-25",
  },
  {
    id: "a5",
    company: "Agency D",
    role: "React Developer",
    location: "Tangerang",
    workSetup: "Onsite",
    status: "rejected",
    appliedAt: "2025-12-01",
    lastUpdate: "2025-12-05",
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

export default function TrackerPage() {
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
      if (sortKey === "companyAsc") {
        return a.company.localeCompare(b.company);
      }

      if (sortKey === "statusAsc") {
        return a.status.localeCompare(b.status);
      }

      if (sortKey === "nextEventAsc") {
        // Put items WITHOUT nextEvent at the bottom
        const aTime = a.nextEventAt
          ? new Date(a.nextEventAt).getTime()
          : Number.POSITIVE_INFINITY;
        const bTime = b.nextEventAt
          ? new Date(b.nextEventAt).getTime()
          : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      }

      // lastUpdateDesc (default)
      const aTime = new Date(a.lastUpdate).getTime();
      const bTime = new Date(b.lastUpdate).getTime();
      return bTime - aTime;
    });

    return rows;
  }, [query, activeStatus, sortKey]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Tracker</h1>
          <p className="text-sm text-slate-600">
            Filter, search, and sort your applications.
          </p>
        </div>

        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          Add application
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
