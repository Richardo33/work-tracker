/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ClientDateTime from "@/components/common/ClientDateTime";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Video,
  MapPin,
  Pencil,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type EventType =
  | "interview_hr"
  | "interview_user"
  | "technical_test"
  | "psychotest"
  | "offer"
  | "follow_up"
  | "other";

type LocationType = "online" | "offline";

type CalEvent = {
  id: string;
  title: string;
  type: EventType;
  startAt: string; // ISO
  endAt?: string; // ISO
  company?: string;
  locationType?: LocationType;
  meetLink?: string;
  place?: string;
  note?: string;
};

type DraftEvent = {
  title: string;
  type: EventType;
  startAtLocal: string; // YYYY-MM-DDTHH:mm
  endAtLocal: string; // YYYY-MM-DDTHH:mm
  company: string;
  locationType: LocationType;
  meetLink: string;
  place: string;
  note: string;
};

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
};

type CalendarEventDTO = {
  id: string;
  title: string;
  type: EventType;
  company: string | null;
  startAt: string; // ISO
  endAt: string | null; // ISO
  locationType: LocationType | null;
  meetLink: string | null;
  place: string | null;
  note: string | null;
  applicationId: string | null;
};

type CalendarListResponse = { items: CalendarEventDTO[] };
type CalendarItemResponse = { item: CalendarEventDTO };
type ApiError = { message?: string };

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

const DOW_SHORT_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;
const WORK_WEEK_IDX = [1, 2, 3, 4, 5] as const;

const GRID_START_HOUR = 8;
const GRID_END_HOUR = 18;
const SLOT_MINUTES = 30;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function addDays(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeekMonday(d: Date) {
  const day = d.getDay(); // 0 Sunday
  const offset = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(d, offset));
}

function parseSafeDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function minutesFromGridStart(d: Date) {
  return (d.getHours() - GRID_START_HOUR) * 60 + d.getMinutes();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toDateTimeLocalValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
    d.getDate()
  )}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function localValueToISO(localValue: string) {
  // input datetime-local => local time
  const d = new Date(localValue);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function isoToLocalValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return toDateTimeLocalValue(d);
}

function colIndexForDay(d: Date) {
  const dow = d.getDay();
  if (dow < 1 || dow > 5) return -1;
  return dow - 1; // Mon=0..Fri=4
}

function eventLabel(t: EventType) {
  switch (t) {
    case "interview_hr":
      return "HR Interview";
    case "interview_user":
      return "User Interview";
    case "technical_test":
      return "Technical Test";
    case "psychotest":
      return "Psychotest";
    case "offer":
      return "Offer";
    case "follow_up":
      return "Follow-up";
    default:
      return "Other";
  }
}

function dotClass(t: EventType) {
  switch (t) {
    case "interview_hr":
    case "interview_user":
      return "bg-indigo-500";
    case "technical_test":
      return "bg-amber-500";
    case "psychotest":
      return "bg-sky-500";
    case "offer":
      return "bg-emerald-500";
    case "follow_up":
      return "bg-violet-500";
    default:
      return "bg-slate-400";
  }
}

function weekRangeISO(anchor: Date) {
  const start = startOfWeekMonday(anchor);
  const end = addDays(start, 7);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

/** ---------- Tiny Toast (no external deps) ---------- */
function ToastStack({
  toasts,
  onClose,
}: {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}) {
  return (
    <div className="fixed right-4 top-4 z-80 flex w-[92vw] max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const isSuccess = t.variant === "success";
        const isDestructive = t.variant === "destructive";
        return (
          <div
            key={t.id}
            className={[
              "rounded-2xl border bg-white/95 p-4 shadow-lg backdrop-blur",
              isDestructive ? "border-rose-200" : "border-slate-200/70",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {isSuccess ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : isDestructive ? (
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-slate-200" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {t.title}
                </p>
                {t.description ? (
                  <p className="mt-1 text-xs text-slate-600">{t.description}</p>
                ) : null}
              </div>

              <button
                onClick={() => onClose(t.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                aria-label="Close toast"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** ---------- Confirm Delete Dialog ---------- */
function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <button
        className="fixed inset-0 z-70 bg-black/30"
        onClick={onCancel}
        aria-label="Close confirm overlay"
      />
      <div className="fixed left-1/2 top-1/2 z-71 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
        <Card className="rounded-2xl border-slate-200/70 bg-white/95 shadow-xl backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-slate-900">
                  {title}
                </p>
                {description ? (
                  <p className="mt-1 text-sm text-slate-600">{description}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="h-10 rounded-2xl border-slate-200 bg-white"
                onClick={onCancel}
              >
                {cancelText}
              </Button>
              <Button
                className="h-10 rounded-2xl bg-rose-600 hover:bg-rose-700"
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function CalendarPage() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [weekAnchor, setWeekAnchor] = useState<Date>(today);
  const [monthCursor, setMonthCursor] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  async function loadWeek(anchor: Date) {
    setLoadingEvents(true);
    try {
      const { startISO, endISO } = weekRangeISO(anchor);

      const res = await fetch(
        `/api/calendar-events?start=${encodeURIComponent(
          startISO
        )}&end=${encodeURIComponent(endISO)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        setEvents([]);
        return;
      }

      const data = (await res.json()) as CalendarListResponse;
      const items = Array.isArray(data.items) ? data.items : [];

      const mapped: CalEvent[] = items.map((x) => ({
        id: x.id,
        title: x.title,
        type: x.type,
        startAt: x.startAt,
        endAt: x.endAt ?? undefined,
        company: x.company ?? undefined,
        locationType: x.locationType ?? undefined,
        meetLink: x.meetLink ?? undefined,
        place: x.place ?? undefined,
        note: x.note ?? undefined,
      }));

      setEvents(mapped);
    } finally {
      setLoadingEvents(false);
    }
  }

  useEffect(() => {
    loadWeek(weekAnchor).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekAnchor]);

  // now updater
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  // toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  function pushToast(item: Omit<ToastItem, "id">) {
    const id = `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const toast: ToastItem = { id, ...item };
    setToasts((prev) => [toast, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3000);
  }
  function closeToast(id: string) {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }

  // confirm delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CalEvent | null>(null);

  function askDelete(ev: CalEvent) {
    setPendingDelete(ev);
    setConfirmOpen(true);
  }

  async function doDelete() {
    if (!pendingDelete) return;

    const ev = pendingDelete;
    try {
      const res = await fetch(`/api/calendar-events/${ev.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as ApiError | null;
        pushToast({
          title: "Failed to delete",
          description: data?.message ?? "Please try again.",
          variant: "destructive",
        });
        return;
      }

      pushToast({
        title: "Event deleted",
        description: ev.title,
        variant: "destructive",
      });

      setConfirmOpen(false);
      setPendingDelete(null);

      await loadWeek(weekAnchor);
    } catch {
      pushToast({
        title: "Failed to delete",
        description: "Network error.",
        variant: "destructive",
      });
    }
  }

  // unified modal (ADD / EDIT)
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [draft, setDraft] = useState<DraftEvent>(() => {
    const s = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      10,
      0,
      0
    );
    const e = new Date(s.getTime() + 60 * 60 * 1000);
    return {
      title: "",
      type: "interview_hr",
      startAtLocal: toDateTimeLocalValue(s),
      endAtLocal: toDateTimeLocalValue(e),
      company: "",
      locationType: "online",
      meetLink: "",
      place: "",
      note: "",
    };
  });

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<CalEvent | null>(null);

  const weekStart = useMemo(() => startOfWeekMonday(weekAnchor), [weekAnchor]);
  const workWeekDays = useMemo(
    () => WORK_WEEK_IDX.map((idx) => addDays(weekStart, idx - 1)),
    [weekStart]
  );

  // ===== Pixel-perfect grid sizing =====
  const HOUR_ROW_PX = 56; // 1 hour height
  const SLOT_PX = HOUR_ROW_PX / 2; // 30 mins
  const HOURS_COUNT = GRID_END_HOUR - GRID_START_HOUR; // e.g. 10
  const GRID_BODY_HEIGHT_PX = HOURS_COUNT * HOUR_ROW_PX; // 560
  const SLOT_COUNT = (HOURS_COUNT * 60) / SLOT_MINUTES; // 20
  const gridMinutesTotal = HOURS_COUNT * 60;

  const eventsInWeek = useMemo(() => {
    const start = workWeekDays[0];
    const end = addDays(workWeekDays[workWeekDays.length - 1], 1);
    const startMs = start.getTime();
    const endMs = end.getTime();

    return events
      .map((ev) => {
        const s = parseSafeDate(ev.startAt);
        const e = ev.endAt ? parseSafeDate(ev.endAt) : null;
        if (!s) return null;
        const endDate = e ?? new Date(s.getTime() + 60 * 60 * 1000);
        return { ...ev, _s: s, _e: endDate };
      })
      .filter((x): x is CalEvent & { _s: Date; _e: Date } => !!x)
      .filter((ev) => ev._s.getTime() >= startMs && ev._s.getTime() < endMs)
      .sort((a, b) => a._s.getTime() - b._s.getTime());
  }, [events, workWeekDays]);

  const eventsByYMD = useMemo(() => {
    const map = new Map<string, Array<CalEvent & { _s: Date; _e: Date }>>();
    for (const ev of eventsInWeek) {
      const key = toYMD(ev._s);
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    return map;
  }, [eventsInWeek]);

  const monthDays = useMemo(() => {
    const first = new Date(
      monthCursor.getFullYear(),
      monthCursor.getMonth(),
      1
    );
    const firstDow = first.getDay();
    const start = addDays(first, -firstDow);

    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) cells.push(addDays(start, i));
    return cells;
  }, [monthCursor]);

  const activeMonth = monthCursor.getMonth();
  const activeYear = monthCursor.getFullYear();

  const nowLine = useMemo(() => {
    const minutes = minutesFromGridStart(now);
    const inRange = minutes >= 0 && minutes <= gridMinutesTotal;
    return {
      show: inRange,
      col: colIndexForDay(now),
      topPx: clamp(
        (minutes / gridMinutesTotal) * GRID_BODY_HEIGHT_PX,
        0,
        GRID_BODY_HEIGHT_PX
      ),
    };
  }, [now, GRID_BODY_HEIGHT_PX, gridMinutesTotal]);

  function goToday() {
    setWeekAnchor(today);
    setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  function resetDraftFor(day: Date, hour: number, minute: number) {
    const s = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      hour,
      minute,
      0
    );
    const e = new Date(s.getTime() + 60 * 60 * 1000);
    setDraft({
      title: "",
      type: "interview_hr",
      startAtLocal: toDateTimeLocalValue(s),
      endAtLocal: toDateTimeLocalValue(e),
      company: "",
      locationType: "online",
      meetLink: "",
      place: "",
      note: "",
    });
  }

  function openAddAt(day: Date, hour: number, minute: number) {
    setFormMode("add");
    setEditingId(null);
    resetDraftFor(day, hour, minute);
    setDetailOpen(false);
    setFormOpen(true);
  }

  function openDetail(ev: CalEvent) {
    setSelected(ev);
    setDetailOpen(true);
  }

  function openEditFromDetail(ev: CalEvent) {
    setFormMode("edit");
    setEditingId(ev.id);

    const startLocal = isoToLocalValue(ev.startAt);
    const endLocal = ev.endAt ? isoToLocalValue(ev.endAt) : "";

    setDraft({
      title: ev.title ?? "",
      type: ev.type ?? "other",
      startAtLocal: startLocal,
      endAtLocal: endLocal || startLocal,
      company: ev.company ?? "",
      locationType: ev.locationType ?? "online",
      meetLink: ev.meetLink ?? "",
      place: ev.place ?? "",
      note: ev.note ?? "",
    });

    setDetailOpen(false);
    setFormOpen(true);
  }

  type UpsertBody = {
    title: string;
    type: EventType;
    startAt: string;
    endAt: string | null;
    company: string | null;
    locationType: LocationType | null;
    meetLink: string | null;
    place: string | null;
    note: string | null;
  };

  async function saveForm() {
    if (!draft.title.trim()) {
      pushToast({
        title: "Title is required",
        description: "Please fill event title.",
        variant: "destructive",
      });
      return;
    }

    const startIso = localValueToISO(draft.startAtLocal);
    const endIso = localValueToISO(draft.endAtLocal);

    if (!startIso || !endIso) {
      pushToast({
        title: "Invalid date/time",
        description: "Please choose valid start/end time.",
        variant: "destructive",
      });
      return;
    }

    const s = new Date(startIso);
    const e = new Date(endIso);
    if (e.getTime() <= s.getTime()) {
      pushToast({
        title: "End time must be after start",
        description: "Please adjust the end time.",
        variant: "destructive",
      });
      return;
    }

    const body: UpsertBody = {
      title: draft.title.trim(),
      type: draft.type,
      startAt: startIso,
      endAt: endIso,
      company: draft.company.trim() ? draft.company.trim() : null,
      locationType: draft.locationType,
      meetLink:
        draft.locationType === "online" && draft.meetLink.trim()
          ? draft.meetLink.trim()
          : null,
      place:
        draft.locationType === "offline" && draft.place.trim()
          ? draft.place.trim()
          : null,
      note: draft.note.trim() ? draft.note.trim() : null,
    };

    // ADD
    if (formMode === "add") {
      try {
        const res = await fetch("/api/calendar-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = (await res.json().catch(() => null)) as
          | CalendarItemResponse
          | ApiError
          | null;

        if (!res.ok || !data || !("item" in data)) {
          const msg =
            data && "message" in data
              ? data.message ?? "Please try again."
              : "Please try again.";
          pushToast({
            title: "Failed to create",
            description: msg,
            variant: "destructive",
          });
          return;
        }

        setFormOpen(false);
        pushToast({
          title: "Event created",
          description: data.item.title,
          variant: "success",
        });

        const newAnchor = startOfDay(new Date(data.item.startAt));
        setWeekAnchor(newAnchor);
        await loadWeek(newAnchor);
      } catch {
        pushToast({
          title: "Failed to create",
          description: "Network error.",
          variant: "destructive",
        });
      }
      return;
    }

    // EDIT
    if (!editingId) return;

    try {
      const res = await fetch(`/api/calendar-events/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json().catch(() => null)) as
        | CalendarItemResponse
        | ApiError
        | null;

      if (!res.ok || !data || !("item" in data)) {
        const msg =
          data && "message" in data
            ? data.message ?? "Please try again."
            : "Please try again.";
        pushToast({
          title: "Failed to update",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      setFormOpen(false);
      setEditingId(null);

      pushToast({
        title: "Event updated",
        description: data.item.title,
        variant: "success",
      });

      const newAnchor = startOfDay(new Date(data.item.startAt));
      setWeekAnchor(newAnchor);
      await loadWeek(newAnchor);
    } catch {
      pushToast({
        title: "Failed to update",
        description: "Network error.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-4">
      <ToastStack toasts={toasts} onClose={closeToast} />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this event?"
        description={
          pendingDelete
            ? `This will permanently delete "${pendingDelete.title}".`
            : "This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDelete(null);
        }}
        onConfirm={doDelete}
      />

      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-600">
            Teams-like simple work week view.
          </p>
          {loadingEvents ? (
            <p className="mt-1 text-xs text-slate-500">Loading events...</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-xl border-slate-200 bg-white/60 px-3"
            onClick={() => setWeekAnchor((d) => addDays(d, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="h-9 rounded-xl border-slate-200 bg-white/60"
            onClick={goToday}
          >
            Today
          </Button>

          <Button
            variant="outline"
            className="h-9 rounded-xl border-slate-200 bg-white/60 px-3"
            onClick={() => setWeekAnchor((d) => addDays(d, 7))}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700"
            onClick={() => openAddAt(today, 10, 0)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        {/* left mini month */}
        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Calendar</p>
                <p className="text-xs text-slate-500">
                  {MONTHS_ID[monthCursor.getMonth()]}{" "}
                  {monthCursor.getFullYear()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/60"
                  onClick={() =>
                    setMonthCursor(
                      new Date(
                        monthCursor.getFullYear(),
                        monthCursor.getMonth() - 1,
                        1
                      )
                    )
                  }
                  aria-label="Prev month"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-700" />
                </button>
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/60"
                  onClick={() =>
                    setMonthCursor(
                      new Date(
                        monthCursor.getFullYear(),
                        monthCursor.getMonth() + 1,
                        1
                      )
                    )
                  }
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4 text-slate-700" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] text-slate-500">
              {DOW_SHORT_ID.map((d) => (
                <div key={d} className="py-1 font-medium">
                  {d}
                </div>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {monthDays.map((d) => {
                const inMonth = d.getMonth() === monthCursor.getMonth();
                const isToday = isSameDay(d, today);

                return (
                  <button
                    key={toYMD(d)}
                    onClick={() => setWeekAnchor(d)}
                    className={[
                      "h-9 rounded-xl text-xs transition",
                      inMonth ? "text-slate-800" : "text-slate-400",
                      isToday
                        ? "bg-indigo-600 text-white"
                        : "hover:bg-slate-100/70",
                    ].join(" ")}
                    title={toYMD(d)}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/60 p-4">
              <p className="text-xs font-medium text-slate-900">Now</p>
              <p className="mt-1 text-xs text-slate-600">
                <ClientDateTime value={now.toISOString()} />
              </p>
            </div>
          </CardContent>
        </Card>

        {/* right grid */}
        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
          <CardContent className="p-0">
            {/* header row */}
            <div className="grid grid-cols-[70px_1fr] border-b border-slate-200/70">
              <div className="px-3 py-3 text-xs font-medium text-slate-500">
                Time
              </div>

              <div className="grid grid-cols-5">
                {workWeekDays.map((d) => {
                  const key = toYMD(d);
                  const count = (eventsByYMD.get(key) ?? []).length;

                  return (
                    <div
                      key={key}
                      className="border-l border-slate-200/70 px-3 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {DOW_SHORT_ID[d.getDay()]}{" "}
                        <span className="text-slate-400">
                          {pad2(d.getDate())}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {count === 0
                          ? "No events"
                          : `${count} event${count > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* body */}
            <div className="relative grid grid-cols-[70px_1fr]">
              {/* time gutter */}
              <div
                className="relative border-r border-slate-200/70"
                style={{ height: `${GRID_BODY_HEIGHT_PX}px` }}
              >
                {Array.from({ length: HOURS_COUNT + 1 }).map((_, i) => {
                  const hour = GRID_START_HOUR + i;
                  return (
                    <div
                      key={hour}
                      className="absolute left-0 right-0"
                      style={{ top: `${i * HOUR_ROW_PX}px` }}
                    >
                      <div className="relative -translate-y-1/2 px-3">
                        <span className="text-xs text-slate-500 tabular-nums">
                          {pad2(hour)}:00
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* columns */}
              <div
                className="relative grid grid-cols-5"
                style={{ height: `${GRID_BODY_HEIGHT_PX}px` }}
              >
                {/* hour lines */}
                <div className="pointer-events-none absolute inset-0">
                  {Array.from({ length: SLOT_COUNT + 1 }).map((_, i) => {
                    const isHour = i % 2 === 0;
                    return (
                      <div
                        key={i}
                        className={
                          isHour
                            ? "border-t border-slate-300/80"
                            : "border-t border-slate-200/60"
                        }
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: `${i * SLOT_PX}px`,
                          borderTopWidth: isHour ? 3 : 1,
                        }}
                      />
                    );
                  })}
                </div>

                {/* now line */}
                {nowLine.show && (
                  <div className="pointer-events-none absolute inset-0">
                    <div
                      className="absolute left-0 right-0 bg-rose-500"
                      style={{ top: `${nowLine.topPx}px`, height: "3px" }}
                    />
                    {nowLine.col >= 0 && nowLine.col <= 4 && (
                      <div
                        className="absolute h-3 w-3 -translate-y-1/2 rounded-full bg-rose-500"
                        style={{
                          top: `${nowLine.topPx}px`,
                          left: `calc(${(nowLine.col * 100) / 5}% + 10px)`,
                        }}
                      />
                    )}
                  </div>
                )}

                {workWeekDays.map((day) => {
                  const dayKey = toYMD(day);
                  const dayEvents = eventsByYMD.get(dayKey) ?? [];

                  return (
                    <div
                      key={dayKey}
                      className="relative border-l border-slate-200/70"
                    >
                      {/* slots */}
                      <div className="absolute inset-0 z-0">
                        {Array.from({ length: SLOT_COUNT }).map((_, i) => {
                          const minutes = i * SLOT_MINUTES;
                          const hour =
                            GRID_START_HOUR + Math.floor(minutes / 60);
                          const minute = minutes % 60;
                          return (
                            <button
                              key={i}
                              type="button"
                              className="block w-full border-b border-transparent hover:bg-slate-50/60"
                              style={{ height: `${SLOT_PX}px` }}
                              onClick={() => openAddAt(day, hour, minute)}
                              aria-label={`Add event ${dayKey} ${pad2(
                                hour
                              )}:${pad2(minute)}`}
                            />
                          );
                        })}
                      </div>

                      {/* EVENTS */}
                      {dayEvents.map((ev) => {
                        const s = ev._s;
                        const e = ev._e;

                        const startMin = clamp(
                          minutesFromGridStart(s),
                          0,
                          gridMinutesTotal
                        );
                        const endMin = clamp(
                          minutesFromGridStart(e),
                          0,
                          gridMinutesTotal
                        );
                        const dur = Math.max(24, endMin - startMin);

                        const topPx =
                          (startMin / gridMinutesTotal) * GRID_BODY_HEIGHT_PX;
                        const heightPx =
                          (dur / gridMinutesTotal) * GRID_BODY_HEIGHT_PX;

                        return (
                          <div
                            key={ev.id}
                            role="button"
                            tabIndex={0}
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              openDetail(ev);
                            }}
                            onKeyDown={(keyEvent) => {
                              if (
                                keyEvent.key === "Enter" ||
                                keyEvent.key === " "
                              ) {
                                keyEvent.preventDefault();
                                openDetail(ev);
                              }
                            }}
                            className="absolute left-2 right-2 z-10 cursor-pointer overflow-hidden rounded-xl border border-slate-200/70 bg-white/90 text-left shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                            }}
                            aria-label={`Open event ${ev.title}`}
                          >
                            <div className="flex h-full">
                              <div
                                className={["w-1.5", dotClass(ev.type)].join(
                                  " "
                                )}
                              />
                              <div className="min-w-0 flex-1 p-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-slate-900">
                                      {ev.title}
                                    </p>
                                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                      {ev.company ? `${ev.company} • ` : ""}
                                      {eventLabel(ev.type)}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(clickEvent) => {
                                      clickEvent.stopPropagation();
                                      askDelete(ev);
                                    }}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white/70 text-slate-600 hover:bg-white"
                                    aria-label="Delete event"
                                    title="Delete"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <div className="mt-1 text-[11px] text-slate-600">
                                  <ClientDateTime value={ev.startAt} />
                                </div>

                                {ev.locationType === "online" && ev.meetLink ? (
                                  <div className="mt-1 truncate text-[11px] text-slate-500">
                                    <Video className="mr-1 inline h-3 w-3 text-slate-400" />
                                    {ev.meetLink}
                                  </div>
                                ) : null}

                                {ev.locationType === "offline" && ev.place ? (
                                  <div className="mt-1 truncate text-[11px] text-slate-500">
                                    <MapPin className="mr-1 inline h-3 w-3 text-slate-400" />
                                    {ev.place}
                                  </div>
                                ) : null}

                                {ev.note ? (
                                  <div className="mt-1 truncate text-[11px] text-slate-500">
                                    {ev.note}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200/70 p-3 text-xs text-slate-500">
              Tip: click any slot to create an event.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FORM MODAL */}
      {formOpen && (
        <>
          <button
            className="fixed inset-0 z-60 bg-black/30"
            onClick={() => setFormOpen(false)}
            aria-label="Close overlay"
          />
          <div className="fixed left-1/2 top-1/2 z-61 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2">
            <Card className="rounded-2xl border-slate-200/70 bg-white/95 shadow-xl backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {formMode === "edit" ? "Edit event" : "New event"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formMode === "edit"
                        ? "Update the details and save."
                        : "Click a slot to auto-fill time."}
                    </p>
                  </div>
                  <button
                    onClick={() => setFormOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Title
                    </label>
                    <Input
                      value={draft.title}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, title: e.target.value }))
                      }
                      className="mt-2 h-11 rounded-2xl bg-white"
                      placeholder="e.g. HR Interview"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Company
                    </label>
                    <Input
                      value={draft.company}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, company: e.target.value }))
                      }
                      className="mt-2 h-11 rounded-2xl bg-white"
                      placeholder="e.g. PT Example"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Type
                    </label>
                    <select
                      value={draft.type}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          type: e.target.value as EventType,
                        }))
                      }
                      className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    >
                      <option value="interview_hr">HR Interview</option>
                      <option value="interview_user">User Interview</option>
                      <option value="technical_test">Technical Test</option>
                      <option value="psychotest">Psychotest</option>
                      <option value="offer">Offer</option>
                      <option value="follow_up">Follow-up</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Start
                      </label>
                      <Input
                        type="datetime-local"
                        value={draft.startAtLocal}
                        onChange={(e) => {
                          const nextStart = e.target.value;
                          const s = new Date(nextStart);
                          const valid = !Number.isNaN(s.getTime());
                          const nextEnd = valid
                            ? toDateTimeLocalValue(
                                new Date(s.getTime() + 60 * 60 * 1000)
                              )
                            : draft.endAtLocal;

                          setDraft((p) => ({
                            ...p,
                            startAtLocal: nextStart,
                            endAtLocal: nextEnd,
                          }));
                        }}
                        className="mt-2 h-11 rounded-2xl bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        End
                      </label>
                      <Input
                        type="datetime-local"
                        value={draft.endAtLocal}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            endAtLocal: e.target.value,
                          }))
                        }
                        className="mt-2 h-11 rounded-2xl bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Location
                    </label>
                    <select
                      value={draft.locationType}
                      onChange={(e) => {
                        const next = e.target.value as LocationType;
                        setDraft((p) => ({
                          ...p,
                          locationType: next,
                          meetLink: next === "online" ? p.meetLink : "",
                          place: next === "offline" ? p.place : "",
                        }));
                      }}
                      className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      {draft.locationType === "offline" ? "Place" : "Meet link"}
                    </label>
                    <Input
                      value={
                        draft.locationType === "offline"
                          ? draft.place
                          : draft.meetLink
                      }
                      onChange={(e) =>
                        setDraft((p) =>
                          p.locationType === "offline"
                            ? { ...p, place: e.target.value }
                            : { ...p, meetLink: e.target.value }
                        )
                      }
                      className="mt-2 h-11 rounded-2xl bg-white"
                      placeholder={
                        draft.locationType === "offline"
                          ? "e.g. Jakarta, SCBD"
                          : "https://meet.google.com/..."
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Note
                    </label>
                    <Input
                      value={draft.note}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, note: e.target.value }))
                      }
                      className="mt-2 h-11 rounded-2xl bg-white"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    className="h-10 rounded-2xl border-slate-200 bg-white"
                    onClick={() => setFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700"
                    onClick={saveForm}
                    disabled={!draft.title.trim()}
                  >
                    {formMode === "edit" ? "Save changes" : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* DETAIL MODAL */}
      {detailOpen && selected && (
        <>
          <button
            className="fixed inset-0 z-60 bg-black/30"
            onClick={() => setDetailOpen(false)}
            aria-label="Close detail overlay"
          />
          <div className="fixed left-1/2 top-1/2 z-61 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
            <Card className="rounded-2xl border-slate-200/70 bg-white/95 shadow-xl backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">
                      {selected.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {selected.company ? `${selected.company} • ` : ""}
                      {eventLabel(selected.type)}
                    </p>
                  </div>

                  <button
                    onClick={() => setDetailOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                    <p className="text-xs font-medium text-slate-500">Time</p>
                    <p className="mt-1 text-slate-900">
                      <ClientDateTime value={selected.startAt} />{" "}
                      {selected.endAt ? (
                        <>
                          <span className="text-slate-400">→</span>{" "}
                          <ClientDateTime value={selected.endAt} />
                        </>
                      ) : null}
                    </p>
                  </div>

                  {selected.locationType === "online" && selected.meetLink ? (
                    <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Meet link
                      </p>
                      <a
                        href={selected.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block break-all text-indigo-600 hover:underline"
                      >
                        {selected.meetLink}
                      </a>
                    </div>
                  ) : null}

                  {selected.locationType === "offline" && selected.place ? (
                    <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Place
                      </p>
                      <p className="mt-1 text-slate-900">{selected.place}</p>
                    </div>
                  ) : null}

                  {selected.note ? (
                    <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                      <p className="text-xs font-medium text-slate-500">Note</p>
                      <p className="mt-1 text-slate-900">{selected.note}</p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    className="h-10 rounded-2xl border-slate-200 bg-white"
                    onClick={() => setDetailOpen(false)}
                  >
                    Close
                  </Button>

                  <Button
                    variant="outline"
                    className="h-10 rounded-2xl border-slate-200 bg-white"
                    onClick={() => openEditFromDetail(selected)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>

                  <Button
                    className="h-10 rounded-2xl bg-rose-600 hover:bg-rose-700"
                    onClick={() => {
                      setDetailOpen(false);
                      askDelete(selected);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
