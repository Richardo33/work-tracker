import Link from "next/link";
import { LayoutDashboard, ListChecks, CalendarDays, User } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tracker", label: "Tracker", icon: ListChecks },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200/70 bg-white/70 backdrop-blur md:block">
      <div className="flex h-full flex-col px-4 py-5">
        {/* Brand */}
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-indigo-600" />
          <div className="leading-tight">
            <p className="text-xs text-slate-500">WGN</p>
            <p className="text-sm font-semibold text-slate-900">Work Tracker</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100/70"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-white">
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
  );
}
