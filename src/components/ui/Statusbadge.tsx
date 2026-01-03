export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    applied: "bg-slate-100 text-slate-700",
    screening: "bg-sky-100 text-sky-700",
    interview: "bg-indigo-100 text-indigo-700",
    test: "bg-amber-100 text-amber-700",
    offered: "bg-emerald-100 text-emerald-700",
    hired: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
    withdrawn: "bg-slate-100 text-slate-700",
    ghosting: "bg-violet-100 text-violet-700",
  };

  const cls = map[status] ?? "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}
    >
      {status.replaceAll("_", " ").toUpperCase()}
    </span>
  );
}
