"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ClientDateTime from "@/components/common/ClientDateTime";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Mail, MapPin, User, Pencil, Save, X, ArrowRight } from "lucide-react";

type Stage =
  | "applied"
  | "screening"
  | "interview"
  | "test"
  | "offered"
  | "hired"
  | "rejected"
  | "withdrawn"
  | "ghosting";

type Application = {
  id: string;
  company: string;
  role: string;
  status: Stage;
  lastUpdate: string; // ISO date/datetime
};

const mockUser = {
  name: "Alvin Rikardo",
  headline: "Fullstack Developer (Backend-leaning)",
  email: "richardoalvin9@gmail.com",
  location: "Indonesia",
  bio: "Building NextStep2 (HR automation + recruitment tracker). Interested in backend, database design, and workflow automation (n8n + Supabase).",
};

const mockApplications: Application[] = [
  {
    id: "a1",
    company: "PT Example",
    role: "Frontend Developer",
    status: "interview",
    lastUpdate: "2026-01-07T09:15:00",
  },
  {
    id: "a2",
    company: "Company A",
    role: "Fullstack Developer",
    status: "test",
    lastUpdate: "2026-01-08T10:00:00",
  },
  {
    id: "a3",
    company: "Startup B",
    role: "Backend Developer",
    status: "screening",
    lastUpdate: "2026-01-05T16:40:00",
  },
  {
    id: "a4",
    company: "Fintech C",
    role: "Junior Software Engineer",
    status: "ghosting",
    lastUpdate: "2025-11-25T11:10:00",
  },
  {
    id: "a5",
    company: "Agency D",
    role: "React Developer",
    status: "rejected",
    lastUpdate: "2025-12-05T14:22:00",
  },
];

function labelStatus(s: Stage) {
  switch (s) {
    case "applied":
      return "Applied";
    case "screening":
      return "Screening";
    case "interview":
      return "Interview";
    case "test":
      return "Test";
    case "offered":
      return "Offered";
    case "hired":
      return "Hired";
    case "rejected":
      return "Rejected";
    case "withdrawn":
      return "Withdrawn";
    case "ghosting":
      return "Ghosting";
    default:
      return s;
  }
}

// Warna jangan terlalu rame: cukup 6-8 warna netral.
const STAGE_COLORS: Record<Stage, string> = {
  applied: "#6366F1",
  screening: "#0EA5E9",
  interview: "#22C55E",
  test: "#F59E0B",
  offered: "#A855F7",
  hired: "#10B981",
  rejected: "#EF4444",
  withdrawn: "#94A3B8",
  ghosting: "#64748B",
};

function pickKeyStagesForChart(apps: Application[]) {
  // Fokus ke pipeline yang relevan biar chart ga terlalu rame
  const keys: Stage[] = [
    "applied",
    "screening",
    "interview",
    "test",
    "offered",
    "hired",
    "rejected",
    "ghosting",
  ];
  const counts = new Map<Stage, number>();
  keys.forEach((k) => counts.set(k, 0));
  for (const a of apps) counts.set(a.status, (counts.get(a.status) ?? 0) + 1);

  // Buang yang 0 agar legend rapi
  return keys
    .map((k) => ({
      key: k,
      name: labelStatus(k),
      value: counts.get(k) ?? 0,
      color: STAGE_COLORS[k],
    }))
    .filter((x) => x.value > 0);
}

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState(mockUser);
  const [draft, setDraft] = useState(mockUser);

  const apps = mockApplications;

  const recent = useMemo(() => {
    return [...apps]
      .sort(
        (a, b) =>
          new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()
      )
      .slice(0, 4);
  }, [apps]);

  const total = apps.length;

  const chartData = useMemo(() => pickKeyStagesForChart(apps), [apps]);

  const top2 = useMemo(() => {
    // Ambil 2 status terbesar buat highlight cepat
    const arr = [...chartData].sort((a, b) => b.value - a.value);
    return arr.slice(0, 2);
  }, [chartData]);

  function onEdit() {
    setDraft(profile);
    setEditing(true);
  }

  function onCancel() {
    setDraft(profile);
    setEditing(false);
  }

  function onSave() {
    // nanti: call API / supabase update
    setProfile(draft);
    setEditing(false);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Profile</h1>
          <p className="text-sm text-slate-600">
            Overview + quick insights from your tracker.
          </p>
        </div>

        {!editing ? (
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 bg-white/60"
            onClick={onEdit}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
              onClick={onSave}
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-slate-200 bg-white/60"
              onClick={onCancel}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Top grid: Profile + Chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                <User className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                {!editing ? (
                  <>
                    <p className="truncate text-base font-semibold text-slate-900">
                      {profile.name}
                    </p>
                    <p className="truncate text-sm text-slate-600">
                      {profile.headline}
                    </p>
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input
                      value={draft.name}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, name: e.target.value }))
                      }
                      className="h-9 rounded-xl bg-white/60"
                      placeholder="Name"
                    />
                    <Input
                      value={draft.headline}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, headline: e.target.value }))
                      }
                      className="h-9 rounded-xl bg-white/60"
                      placeholder="Headline"
                    />
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
                    <p className="text-xs font-medium text-slate-600">
                      Contact
                    </p>
                    <div className="mt-2 space-y-2 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {!editing ? (
                          <span className="truncate">{profile.email}</span>
                        ) : (
                          <Input
                            value={draft.email}
                            onChange={(e) =>
                              setDraft((p) => ({ ...p, email: e.target.value }))
                            }
                            className="h-9 rounded-xl bg-white/60"
                            placeholder="Email"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {!editing ? (
                          <span className="truncate">{profile.location}</span>
                        ) : (
                          <Input
                            value={draft.location}
                            onChange={(e) =>
                              setDraft((p) => ({
                                ...p,
                                location: e.target.value,
                              }))
                            }
                            className="h-9 rounded-xl bg-white/60"
                            placeholder="Location"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
                    <p className="text-xs font-medium text-slate-600">About</p>
                    {!editing ? (
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">
                        {profile.bio}
                      </p>
                    ) : (
                      <Input
                        value={draft.bio}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, bio: e.target.value }))
                        }
                        className="mt-2 h-9 rounded-xl bg-white/60"
                        placeholder="Short bio"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full border border-slate-200/70 bg-white/60 px-3 py-1">
                    Total tracked:{" "}
                    <span className="font-medium text-slate-700">{total}</span>
                  </span>
                  {top2.map((x) => (
                    <span
                      key={x.key}
                      className="rounded-full border border-slate-200/70 bg-white/60 px-3 py-1"
                    >
                      {x.name}:{" "}
                      <span className="font-medium text-slate-700">
                        {x.value}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donut chart card */}
        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Pipeline distribution
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Based on current statuses
                </p>
              </div>

              <Link
                href="/dashboard/tracker"
                className="text-xs font-medium text-indigo-700 hover:underline"
              >
                Tracker <ArrowRight className="ml-1 inline h-3 w-3" />
              </Link>
            </div>

            <div className="mt-4 h-44">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200/70 bg-white/60 text-sm text-slate-600">
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(
                        value: string | number | undefined,
                        name: string | undefined
                      ) => [value ?? 0, name ?? ""]}
                      contentStyle={{ borderRadius: 12 }}
                    />

                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      stroke="transparent"
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {chartData.slice(0, 6).map((x) => (
                <div
                  key={x.key}
                  className="flex items-center gap-2 text-slate-600"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: x.color }}
                  />
                  <span className="truncate">
                    {x.name} <span className="text-slate-400">({x.value})</span>
                  </span>
                </div>
              ))}
            </div>

            {chartData.length > 6 && (
              <p className="mt-2 text-[11px] text-slate-400">
                Showing top 6 labels.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Recent activity
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Latest updates from your applications
              </p>
            </div>

            <Link
              href="/dashboard/tracker"
              className="text-xs font-medium text-indigo-700 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {recent.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-slate-200/70 bg-white/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {a.company}
                    </p>
                    <p className="truncate text-sm text-slate-600">{a.role}</p>

                    <p className="mt-2 text-xs text-slate-500">
                      Status:{" "}
                      <span className="font-medium text-slate-700">
                        {labelStatus(a.status)}
                      </span>
                    </p>
                  </div>

                  <div className="shrink-0 text-right text-xs text-slate-500">
                    <ClientDateTime value={a.lastUpdate} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {recent.length === 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/60 p-10 text-center text-sm text-slate-600">
              No activity yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
