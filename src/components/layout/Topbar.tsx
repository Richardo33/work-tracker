"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AddApplicationDialog from "@/components/app/AddApplicationDialog";

type MeResponse = {
  user: null | {
    id: string;
    email: string;
    profile: null | {
      name: string | null;
      avatarUrl: string | null;
    };
  };
};

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

export default function Topbar() {
  const [me, setMe] = useState<MeResponse["user"]>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json() as Promise<MeResponse>)
      .then((d) => {
        if (alive) setMe(d.user);
      })
      .catch(() => {
        if (alive) setMe(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const displayName = useMemo(() => {
    const name = me?.profile?.name?.trim();
    if (name) return name;
    const email = me?.email?.trim();
    return email ?? "User";
  }, [me]);

  const fallback = useMemo(() => initials(displayName), [displayName]);

  return (
    <div className="sticky top-4 z-30 rounded-2xl border-b border-slate-200 bg-slate-50/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            Dashboard
            <span className="ml-2 text-xs font-medium text-slate-600">
              · {displayName}
            </span>
          </p>
          <p className="text-xs text-slate-600">
            Track applications & schedule interviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AddApplicationDialog
            triggerText="Add"
            triggerVariant="default"
            triggerClassName="rounded-xl bg-indigo-600 hover:bg-indigo-700"
          />

          <Link href="/dashboard/profile" className="rounded-xl">
            <Avatar className="h-9 w-9 border border-slate-200">
              {/* kalau avatarUrl ada, tampil gambar */}
              {me?.profile?.avatarUrl ? (
                <AvatarImage src={me.profile.avatarUrl} alt={displayName} />
              ) : null}

              <AvatarFallback className="bg-slate-100 text-slate-700">
                {fallback}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </div>
  );
}
