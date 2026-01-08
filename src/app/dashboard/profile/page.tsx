"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ClientDateTime from "@/components/common/ClientDateTime";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Mail,
  MapPin,
  Pencil,
  Save,
  X,
  ArrowRight,
  ImageUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AppStatus } from "@prisma/client";

type Application = {
  id: string;
  company: string;
  role: string;
  status: AppStatus;
  lastUpdate: string;
};

type MeUser = {
  id: string;
  email: string;
  profile: null | {
    name: string | null;
    headline: string | null;
    location: string | null;
    bio: string | null;
    avatarUrl: string | null;
  };
};

type ProfileDraft = {
  name: string;
  headline: string;
  email: string;
  location: string;
  bio: string;
  avatarUrl: string | null;
};

function labelStatus(s: AppStatus) {
  switch (s) {
    case "applied":
      return "Applied";
    case "screening":
      return "Screening";
    case "interview":
      return "Interview";
    case "technical_test":
      return "Test";
    case "offer":
      return "Offer";
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

const STAGE_COLORS: Record<AppStatus, string> = {
  applied: "#6366F1",
  screening: "#0EA5E9",
  interview: "#22C55E",
  technical_test: "#F59E0B",
  offer: "#A855F7",
  hired: "#10B981",
  rejected: "#EF4444",
  withdrawn: "#94A3B8",
  ghosting: "#64748B",
};

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function pickKeyStagesForChart(apps: Application[]) {
  const keys: AppStatus[] = [
    "applied",
    "screening",
    "interview",
    "technical_test",
    "offer",
    "hired",
    "rejected",
    "ghosting",
  ];

  const counts = new Map<AppStatus, number>();
  keys.forEach((k) => counts.set(k, 0));

  for (const a of apps) counts.set(a.status, (counts.get(a.status) ?? 0) + 1);

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
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [user, setUser] = useState<MeUser | null>(null);
  const [apps, setApps] = useState<Application[]>([]);

  const [draft, setDraft] = useState<ProfileDraft>({
    name: "",
    headline: "",
    email: "",
    location: "",
    bio: "",
    avatarUrl: null,
  });

  // foto preview (local) sebelum upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  async function loadAll() {
    const meRes = await fetch("/api/profile", { cache: "no-store" });
    const meData = (await meRes.json()) as { user: MeUser | null };
    setUser(meData.user);

    const name = meData.user?.profile?.name ?? "";
    const headline = meData.user?.profile?.headline ?? "";
    const email = meData.user?.email ?? "";
    const location = meData.user?.profile?.location ?? "";
    const bio = meData.user?.profile?.bio ?? "";
    const avatarUrl = meData.user?.profile?.avatarUrl ?? null;

    setDraft({ name, headline, email, location, bio, avatarUrl });

    const appsRes = await fetch("/api/applications", { cache: "no-store" });
    if (appsRes.ok) {
      const appsData = (await appsRes.json()) as { items: Application[] };
      setApps(appsData.items ?? []);
    } else {
      setApps([]);
    }
  }

  useEffect(() => {
    loadAll().catch(() => {});
  }, []);

  // bersihin object URL preview
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

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
    const arr = [...chartData].sort((a, b) => b.value - a.value);
    return arr.slice(0, 2);
  }, [chartData]);

  const displayName = useMemo(() => {
    const name = (user?.profile?.name ?? "").trim();
    if (name) return name;
    return (user?.email ?? "User").trim();
  }, [user]);

  const fallback = useMemo(() => initials(displayName), [displayName]);

  function onEdit() {
    if (!user) return;
    setEditing(true);
  }

  function onCancel() {
    if (!user) return;

    // reset draft ke data asli
    setDraft({
      name: user.profile?.name ?? "",
      headline: user.profile?.headline ?? "",
      email: user.email ?? "",
      location: user.profile?.location ?? "",
      bio: user.profile?.bio ?? "",
      avatarUrl: user.profile?.avatarUrl ?? null,
    });

    // reset avatar preview/file
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);

    setEditing(false);
  }

  async function uploadAvatarIfNeeded(): Promise<string | null> {
    if (!avatarFile) return draft.avatarUrl ?? null;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", avatarFile);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: fd,
      });

      const data = (await res.json().catch(() => null)) as
        | { ok: true; avatarUrl: string }
        | { message?: string }
        | null;

      if (!res.ok || !data || !("ok" in data)) {
        const msg =
          data && "message" in data
            ? data.message ?? "Upload failed"
            : "Upload failed";
        throw new Error(msg);
      }

      return data.avatarUrl;
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (!user || saving) return;

    setSaving(true);
    try {
      // 1) upload avatar dulu (kalau ada file baru)
      const avatarUrl = await uploadAvatarIfNeeded();

      // 2) save profile fields
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          headline: draft.headline,
          location: draft.location,
          bio: draft.bio,
          avatarUrl, // pastikan DB kebaca juga
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        alert(data?.message ?? "Failed to save profile");
        return;
      }

      // reset preview after save
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setAvatarFile(null);

      await loadAll();
      setEditing(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  const disabled = !user;
  const shownAvatarSrc = avatarPreview ?? draft.avatarUrl ?? undefined;

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
      </div>

      {/* Top grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur lg:col-span-2">
          <CardContent className="p-5">
            {/* Top row: identity + actions (action masuk card) */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <Avatar className="h-14 w-14 border border-slate-200">
                  {shownAvatarSrc ? (
                    <AvatarImage src={shownAvatarSrc} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="bg-slate-100 text-slate-700">
                    {fallback}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  {!editing ? (
                    <>
                      <p className="truncate text-base font-semibold text-slate-900">
                        {user?.profile?.name ?? "—"}
                      </p>
                      <p className="truncate text-sm text-slate-600">
                        {user?.profile?.headline ?? "—"}
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
                </div>
              </div>

              {/* Actions */}
              {!editing ? (
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-slate-200 bg-white/60 sm:w-auto"
                  onClick={onEdit}
                  disabled={disabled}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit profile
                </Button>
              ) : (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <Button
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
                    onClick={onSave}
                    disabled={saving || uploading}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-slate-200 bg-white/60 sm:w-auto"
                    onClick={onCancel}
                    disabled={saving || uploading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Change photo (edit mode) */}
            {editing ? (
              <div className="mt-4">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;

                    // preview
                    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                    const url = URL.createObjectURL(f);
                    setAvatarPreview(url);
                    setAvatarFile(f);

                    // reset input supaya bisa pilih file sama lagi
                    e.currentTarget.value = "";
                  }}
                />

                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl border-slate-200 bg-white/60"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  <ImageUp className="mr-2 h-4 w-4" />
                  Choose photo
                </Button>

                <p className="mt-2 text-xs text-slate-500">
                  Preview will show instantly. Upload happens when you click{" "}
                  <b>Save</b>.
                </p>
              </div>
            ) : null}

            {/* Info grid (mobile rapih: stack, desktop: 2 kolom) */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
                <p className="text-xs font-medium text-slate-600">Contact</p>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{user?.email ?? "—"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {!editing ? (
                      <span className="truncate">
                        {user?.profile?.location ?? "—"}
                      </span>
                    ) : (
                      <Input
                        value={draft.location}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, location: e.target.value }))
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
                    {user?.profile?.bio ?? "—"}
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
                  <span className="font-medium text-slate-700">{x.value}</span>
                </span>
              ))}
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

            {chartData.length > 6 ? (
              <p className="mt-2 text-[11px] text-slate-400">
                Showing top 6 labels.
              </p>
            ) : null}
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

          {recent.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/60 p-10 text-center text-sm text-slate-600">
              No activity yet.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
