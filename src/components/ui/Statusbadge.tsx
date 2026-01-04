import { STATUS_META, type AppStatus } from "@/lib/applicationStatus";

export default function StatusBadge({ status }: { status: string }) {
  const s = status as AppStatus;

  const meta =
    STATUS_META[s] ??
    ({
      label: String(status ?? "Unknown"),
      dot: "bg-slate-300",
      badge: "bg-slate-100",
      text: "text-slate-700",
    } as const);

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        meta.badge,
        meta.text,
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full", meta.dot].join(" ")} />
      {meta.label}
    </span>
  );
}
