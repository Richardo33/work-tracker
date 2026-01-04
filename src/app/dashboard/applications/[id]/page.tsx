"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/ui/Statusbadge";
import ClientDateTime from "@/components/common/ClientDateTime";
import { STATUS_META, type AppStatus } from "@/lib/applicationStatus";
import {
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  TestTube2,
  Gift,
  XCircle,
  Ghost,
} from "lucide-react";

type InterviewType = "hr" | "user" | "technical" | "cultural" | "other";
type TestType = "live_code" | "take_home" | "offline" | "psychotest" | "other";
type EventMode = "online" | "offline";

type TimelineEvent = {
  id: string;
  stage: AppStatus;
  detail?: InterviewType | TestType;
  at: string; // ISO
  mode?: EventMode;
  meetLink?: string;
  location?: string;
  notes?: string;
};

const stageOptions: Array<{ value: AppStatus; label: string }> = [
  { value: "applied", label: STATUS_META.applied.label },
  { value: "screening", label: STATUS_META.screening.label },
  { value: "interview", label: STATUS_META.interview.label },
  { value: "technical_test", label: STATUS_META.technical_test.label },
  { value: "offer", label: STATUS_META.offer.label },
  { value: "ghosting", label: STATUS_META.ghosting.label },
  { value: "rejected", label: STATUS_META.rejected.label },
];

const interviewOptions: Array<{ value: InterviewType; label: string }> = [
  { value: "hr", label: "HR Interview" },
  { value: "user", label: "User Interview" },
  { value: "technical", label: "Technical Interview" },
  { value: "cultural", label: "Cultural / Fit" },
  { value: "other", label: "Other" },
];

const testOptions: Array<{ value: TestType; label: string }> = [
  { value: "live_code", label: "Live Coding" },
  { value: "take_home", label: "Take-home Test" },
  { value: "offline", label: "Offline Technical Test" },
  { value: "psychotest", label: "Psychotest" },
  { value: "other", label: "Other" },
];

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

function prettyDetail(detail?: string) {
  if (!detail) return "";
  return detail.replaceAll("_", " ").toUpperCase();
}

function stageIcon(stage: AppStatus) {
  const cls = "h-4 w-4";
  switch (stage) {
    case "applied":
      return <ClipboardList className={cls} />;
    case "screening":
      return <MessageSquare className={cls} />;
    case "interview":
      return <CheckCircle2 className={cls} />;
    case "technical_test":
      return <TestTube2 className={cls} />;
    case "offer":
      return <Gift className={cls} />;
    case "rejected":
      return <XCircle className={cls} />;
    case "ghosting":
      return <Ghost className={cls} />;
    default:
      return <ClipboardList className={cls} />;
  }
}

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "unknown";

  const [app, setApp] = useState({
    id,
    company: "PT Example",
    role: "Frontend Developer",
    status: "interview" as AppStatus,
    statusDetail: "hr" as InterviewType | TestType | undefined,
    location: "Jakarta (Hybrid)",
    source: "LinkedIn",
    jobLink: "https://linkedin.com/jobs/xxxx",
    requiredSkills: ["React", "TypeScript", "Tailwind", "REST API"],
    niceToHave: ["Next.js", "Testing", "CI/CD"],
    notes:
      "HR mentioned they focus on product speed. Prepare project story + system design basic.",
  });

  const [events, setEvents] = useState<TimelineEvent[]>([
    {
      id: "e1",
      stage: "applied",
      at: new Date("2025-12-21T09:30:00").toISOString(),
      notes: "Applied via LinkedIn.",
    },
    {
      id: "e2",
      stage: "interview",
      detail: "hr",
      at: new Date("2026-01-04T14:00:00").toISOString(),
      mode: "online",
      meetLink: "https://meet.google.com/xxx-xxxx-xxx",
      notes: "Prepare intro + portfolio story.",
    },
  ]);

  // Form state
  const nowLocal = useMemo(() => toDatetimeLocalValue(new Date()), []);
  const [stage, setStage] = useState<AppStatus>(app.status);

  const [interviewType, setInterviewType] = useState<InterviewType>(
    app.status === "interview" && app.statusDetail
      ? (app.statusDetail as InterviewType)
      : "hr"
  );
  const [testType, setTestType] = useState<TestType>("live_code");

  const [at, setAt] = useState<string>(nowLocal);
  const [mode, setMode] = useState<EventMode>("online");
  const [meetLink, setMeetLink] = useState("");
  const [place, setPlace] = useState("");
  const [eventNotes, setEventNotes] = useState("");

  const needsMode = stage === "interview" || stage === "technical_test";

  const selectedDetail: InterviewType | TestType | undefined =
    stage === "interview"
      ? interviewType
      : stage === "technical_test"
      ? testType
      : undefined;

  function handleSaveStage() {
    const iso = new Date(at).toISOString();

    const newEvent: TimelineEvent = {
      id: crypto.randomUUID(),
      stage,
      detail: selectedDetail,
      at: iso,
      mode: needsMode ? mode : undefined,
      meetLink:
        needsMode && mode === "online"
          ? meetLink.trim() || undefined
          : undefined,
      location:
        needsMode && mode === "offline" ? place.trim() || undefined : undefined,
      notes: eventNotes.trim() || undefined,
    };

    setApp((prev) => ({
      ...prev,
      status: stage,
      statusDetail: selectedDetail,
    }));

    setEvents((prev) => [newEvent, ...prev]);

    setAt(toDatetimeLocalValue(new Date()));
    setMeetLink("");
    setPlace("");
    setEventNotes("");
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Button variant="outline" className="rounded-xl" asChild>
          <Link href="/dashboard/applications">← Back</Link>
        </Button>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Company</p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900">
              {app.company}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{app.role}</p>
            <p className="mt-3 text-xs text-slate-500">
              {app.location} · Source: {app.source}
            </p>

            {app.statusDetail &&
              (app.status === "interview" ||
                app.status === "technical_test") && (
                <p className="mt-2 text-xs text-slate-600">
                  Current:{" "}
                  <span className="font-medium text-slate-800">
                    {STATUS_META[app.status].label} ·{" "}
                    {prettyDetail(app.statusDetail)}
                  </span>
                </p>
              )}
          </div>

          <StatusBadge status={app.status} />
        </div>
      </div>

      {/* Update stage */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
        <h2 className="text-sm font-semibold text-slate-900">Update stage</h2>
        <p className="mt-1 text-xs text-slate-600">
          Pick any stage (no strict order). Interview/Test will ask for more
          details.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Stage</Label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white/60 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              value={stage}
              onChange={(e) => setStage(e.target.value as AppStatus)}
            >
              {stageOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Time</Label>
            <Input
              type="datetime-local"
              value={at}
              onChange={(e) => setAt(e.target.value)}
              className="rounded-xl bg-white/60"
            />
            <p className="text-xs text-slate-500">
              Default is now — edit if the event already happened.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Mode</Label>
            {needsMode ? (
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white/60 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                value={mode}
                onChange={(e) => setMode(e.target.value as EventMode)}
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            ) : (
              <Input disabled value="-" className="rounded-xl bg-white/60" />
            )}
          </div>
        </div>

        {(stage === "interview" || stage === "technical_test") && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {stage === "interview" ? (
              <div className="space-y-2 md:col-span-1">
                <Label>Interview type</Label>
                <select
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white/60 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  value={interviewType}
                  onChange={(e) =>
                    setInterviewType(e.target.value as InterviewType)
                  }
                >
                  {interviewOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2 md:col-span-1">
                <Label>Test type</Label>
                <select
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white/60 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as TestType)}
                >
                  {testOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === "online" ? (
              <div className="space-y-2 md:col-span-2">
                <Label>Meet link</Label>
                <Input
                  placeholder="https://meet.google.com/..."
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  className="rounded-xl bg-white/60"
                />
              </div>
            ) : (
              <div className="space-y-2 md:col-span-2">
                <Label>Location</Label>
                <Input
                  placeholder="e.g. Sudirman, Jakarta"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="rounded-xl bg-white/60"
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-4 space-y-2">
          <Label>Notes</Label>
          <Textarea
            placeholder="What happened? What to prepare next?"
            className="min-h-22.5 rounded-xl bg-white/60"
            value={eventNotes}
            onChange={(e) => setEventNotes(e.target.value)}
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
            onClick={handleSaveStage}
          >
            Save stage
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Timeline</h2>
          <p className="text-xs text-slate-500">Latest updates on top</p>
        </div>

        <div className="mt-5 space-y-5">
          {events.map((e, idx) => {
            const meta =
              STATUS_META[e.stage] ??
              ({
                label: e.stage,
                dot: "bg-slate-300",
                badge: "bg-slate-100",
                text: "text-slate-700",
              } as const);

            const isLast = idx === events.length - 1;

            return (
              <div key={e.id} className="relative flex gap-4">
                {/* Left rail */}
                <div className="relative flex w-10 flex-col items-center">
                  <div
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      meta.badge,
                      meta.text,
                      "ring-1 ring-slate-200",
                    ].join(" ")}
                  >
                    {stageIcon(e.stage)}
                  </div>

                  {!isLast && (
                    <div className="mt-2 h-full w-0.5 bg-slate-200" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 rounded-2xl border border-slate-200/70 bg-white/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={["h-2 w-2 rounded-full", meta.dot].join(
                            " "
                          )}
                        />
                        <p className="text-sm font-semibold text-slate-900">
                          {meta.label}
                          {e.detail ? (
                            <span className="ml-2 text-xs font-medium text-slate-600">
                              · {prettyDetail(String(e.detail))}
                            </span>
                          ) : null}
                        </p>
                      </div>

                      <p className="mt-1 text-xs text-slate-600">
                        <ClientDateTime value={e.at} />
                      </p>

                      {(e.stage === "interview" ||
                        e.stage === "technical_test") && (
                        <div className="mt-2 space-y-1">
                          {e.mode === "online" && e.meetLink ? (
                            <p className="text-sm text-slate-600 break-all">
                              Online · {e.meetLink}
                            </p>
                          ) : null}
                          {e.mode === "offline" && e.location ? (
                            <p className="text-sm text-slate-600">
                              Offline · {e.location}
                            </p>
                          ) : null}
                        </div>
                      )}

                      {e.notes ? (
                        <p className="mt-3 text-sm text-slate-600">{e.notes}</p>
                      ) : null}
                    </div>

                    <div className="shrink-0">
                      <StatusBadge status={e.stage} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {events.length === 0 && (
            <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-8 text-center text-sm text-slate-600">
              No timeline yet. Add your first stage update above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
