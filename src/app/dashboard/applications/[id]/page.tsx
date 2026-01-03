"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/ui/Statusbadge";
import ClientDateTime from "@/components/common/ClientDateTime";

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

type InterviewType = "hr" | "user" | "technical" | "cultural" | "other";
type TestType = "live_code" | "take_home" | "offline" | "psychotest" | "other";

type EventMode = "online" | "offline";

type TimelineEvent = {
  id: string;
  stage: Stage;
  detail?: InterviewType | TestType; // sub-type for interview/test
  at: string; // ISO
  mode?: EventMode;
  meetLink?: string;
  location?: string;
  notes?: string;
};

const stageOptions: Array<{ value: Stage; label: string }> = [
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "test", label: "Test" },
  { value: "offered", label: "Offered" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "ghosting", label: "Ghosting" },
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

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "unknown";

  // Dummy application
  const [app, setApp] = useState({
    id,
    company: "PT Example",
    role: "Frontend Developer",
    status: "interview" as Stage,
    statusDetail: "hr" as InterviewType | TestType | undefined,
    location: "Jakarta (Hybrid)",
    source: "LinkedIn",
    jobLink: "https://linkedin.com/jobs/xxxx",
    requiredSkills: ["React", "TypeScript", "Tailwind", "REST API"],
    niceToHave: ["Next.js", "Testing", "CI/CD"],
    notes:
      "HR mentioned they focus on product speed. Prepare project story + system design basic.",
  });

  // Dummy timeline
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
  const [stage, setStage] = useState<Stage>(app.status);

  const [interviewType, setInterviewType] = useState<InterviewType>(
    app.status === "interview" &&
      app.statusDetail &&
      !String(app.statusDetail).includes("_")
      ? (app.statusDetail as InterviewType)
      : "hr"
  );

  const [testType, setTestType] = useState<TestType>(
    app.status === "test" && app.statusDetail
      ? (app.statusDetail as TestType)
      : "live_code"
  );

  const [at, setAt] = useState<string>(nowLocal); // datetime-local
  const [mode, setMode] = useState<EventMode>("online");
  const [meetLink, setMeetLink] = useState("");
  const [place, setPlace] = useState("");
  const [eventNotes, setEventNotes] = useState("");

  const needsMode = stage === "interview" || stage === "test";

  const selectedDetail: InterviewType | TestType | undefined =
    stage === "interview"
      ? interviewType
      : stage === "test"
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

    // Update current status on application
    setApp((prev) => ({
      ...prev,
      status: stage,
      statusDetail: selectedDetail,
    }));

    // Add event (newest first)
    setEvents((prev) => [newEvent, ...prev]);

    // Reset lightweight fields
    setAt(toDatetimeLocalValue(new Date()));
    setMeetLink("");
    setPlace("");
    setEventNotes("");
  }

  return (
    <div className="space-y-6">
      {/* header */}
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
              (app.status === "interview" || app.status === "test") && (
                <p className="mt-2 text-xs text-slate-600">
                  Current:{" "}
                  <span className="font-medium text-slate-800">
                    {app.status.toUpperCase()} ·{" "}
                    {prettyDetail(app.statusDetail)}
                  </span>
                </p>
              )}
          </div>

          <StatusBadge status={app.status} />
        </div>
      </div>

      {/* update stage */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
        <h2 className="text-sm font-semibold text-slate-900">Update stage</h2>
        <p className="mt-1 text-xs text-slate-600">
          Pick any stage (no strict order). Interview/Test will ask for more
          details.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {/* stage */}
          <div className="space-y-2">
            <Label>Stage</Label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white/60 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
            >
              {stageOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* time */}
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

          {/* mode */}
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

        {/* sub-options */}
        {(stage === "interview" || stage === "test") && (
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

            {/* online/offline fields */}
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

        {/* notes */}
        <div className="mt-4 space-y-2">
          <Label>Notes</Label>
          <Textarea
            placeholder="What happened? What to prepare next? Any special instruction?"
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

      {/* company + requirements */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
          <h2 className="text-sm font-semibold text-slate-900">
            Company details
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200/70 bg-white/60 p-4">
              <p className="text-xs text-slate-500">Job post link</p>
              <p className="mt-1 text-sm text-slate-700 break-all">
                {app.jobLink}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-white/60 p-4">
              <p className="text-xs text-slate-500">Application notes</p>
              <p className="mt-1 text-sm text-slate-700">{app.notes}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
          <h2 className="text-sm font-semibold text-slate-900">Requirements</h2>

          <div className="mt-4">
            <p className="text-xs text-slate-500">Required skills</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {app.requiredSkills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs text-slate-500">Nice to have</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {app.niceToHave.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* timeline */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
        <h2 className="text-sm font-semibold text-slate-900">Timeline</h2>

        <div className="mt-4 space-y-3">
          {events.map((e) => (
            <div
              key={e.id}
              className="rounded-2xl border border-slate-200/70 bg-white/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {/* ✅ FIX HYDRATION: gunakan ClientDateTime */}
                  <p className="text-xs text-slate-600">
                    <ClientDateTime value={e.at} />
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {stageOptions.find((s) => s.value === e.stage)?.label ??
                      e.stage}
                    {e.detail ? (
                      <span className="ml-2 text-xs font-medium text-slate-600">
                        · {prettyDetail(String(e.detail))}
                      </span>
                    ) : null}
                  </p>

                  {e.stage === "interview" || e.stage === "test" ? (
                    <>
                      {e.mode === "online" && e.meetLink ? (
                        <p className="mt-1 text-sm text-slate-600 break-all">
                          Online · {e.meetLink}
                        </p>
                      ) : null}

                      {e.mode === "offline" && e.location ? (
                        <p className="mt-1 text-sm text-slate-600">
                          Offline · {e.location}
                        </p>
                      ) : null}
                    </>
                  ) : null}

                  {e.notes ? (
                    <p className="mt-2 text-sm text-slate-600">{e.notes}</p>
                  ) : null}
                </div>

                <div className="shrink-0">
                  <StatusBadge status={e.stage} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
