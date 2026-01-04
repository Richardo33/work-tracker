export type AppStatus =
  | "applied"
  | "screening"
  | "interview"
  | "technical_test"
  | "offer"
  | "rejected"
  | "ghosting"
  // optional extras (kalau suatu saat kamu pakai)
  | "hired"
  | "withdrawn";

export const STATUS_META: Record<
  AppStatus,
  { label: string; dot: string; badge: string; text: string }
> = {
  applied: {
    label: "Applied",
    dot: "bg-slate-300",
    badge: "bg-slate-100",
    text: "text-slate-700",
  },
  screening: {
    label: "Screening",
    dot: "bg-sky-300",
    badge: "bg-sky-100",
    text: "text-sky-800",
  },
  interview: {
    label: "Interview",
    dot: "bg-indigo-400",
    badge: "bg-indigo-100",
    text: "text-indigo-800",
  },
  technical_test: {
    label: "Technical Test",
    dot: "bg-amber-300",
    badge: "bg-amber-100",
    text: "text-amber-800",
  },
  offer: {
    label: "Offer",
    dot: "bg-emerald-400",
    badge: "bg-emerald-100",
    text: "text-emerald-800",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-rose-300",
    badge: "bg-rose-100",
    text: "text-rose-800",
  },
  ghosting: {
    label: "Ghosting",
    dot: "bg-slate-400",
    badge: "bg-slate-100",
    text: "text-slate-700",
  },

  // optional extras:
  hired: {
    label: "Hired",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100",
    text: "text-emerald-900",
  },
  withdrawn: {
    label: "Withdrawn",
    dot: "bg-slate-300",
    badge: "bg-slate-100",
    text: "text-slate-700",
  },
};
