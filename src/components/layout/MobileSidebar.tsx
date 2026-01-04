"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  User,
  Menu,
  X,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/applications", label: "Applications", icon: ListChecks },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export default function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Topbar (mobile only) */}
      <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/60"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </button>

          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-600" />
            <div className="leading-tight">
              <p className="text-[10px] text-slate-500">WGN</p>
              <p className="text-sm font-semibold text-slate-900">
                Work Tracker
              </p>
            </div>
          </Link>

          {/* spacer to balance */}
          <div className="h-10 w-10" />
        </div>
      </div>

      {/* Backdrop */}
      {open && (
        <button
          className="fixed inset-0 z-50 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu overlay"
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200/70 bg-white/80 backdrop-blur transition-transform md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col px-4 py-5">
          {/* header */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <div className="h-9 w-9 rounded-xl bg-indigo-600" />
              <div className="leading-tight">
                <p className="text-xs text-slate-500">WGN</p>
                <p className="text-sm font-semibold text-slate-900">
                  Work Tracker
                </p>
              </div>
            </Link>

            <button
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/60"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-slate-700" />
            </button>
          </div>

          {/* nav */}
          <nav className="mt-6 space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-slate-100/80 text-slate-900"
                      : "text-slate-700 hover:bg-slate-100/70"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl transition",
                      isActive
                        ? "bg-white text-slate-900"
                        : "bg-slate-100 text-slate-700 group-hover:bg-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* bottom */}
          <div className="mt-auto pt-4">
            <div className="rounded-xl bg-linear-to-r from-indigo-50 to-emerald-50 p-3">
              <p className="text-xs font-medium text-slate-900">Tip</p>
              <p className="mt-1 text-xs text-slate-600">
                Add an event for every interview to stay on track.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
