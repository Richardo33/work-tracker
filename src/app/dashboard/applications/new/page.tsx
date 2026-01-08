/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { AppStatus } from "@/lib/applicationStatus";

type WorkSetup = "Onsite" | "Hybrid" | "Remote";

function toDateLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  return `${yyyy}-${MM}-${dd}`;
}

type CreatePayload = {
  company: string;
  role: string;
  location: string;
  workSetup: WorkSetup;
  status: AppStatus;
  appliedAt: string; // YYYY-MM-DD
  jobLink?: string | null;
  notes?: string | null;
  requiredSkills?: string[];
};

export default function NewApplicationPage() {
  const router = useRouter();

  const [appliedAt, setAppliedAt] = useState<string>("");

  useEffect(() => {
    setAppliedAt(toDateLocalValue(new Date()));
  }, []);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [workSetup, setWorkSetup] = useState<WorkSetup>("Hybrid");
  const [status, setStatus] = useState<AppStatus>("applied");
  const [jobLink, setJobLink] = useState("");
  const [notes, setNotes] = useState("");
  const [skills, setSkills] = useState(""); // comma separated
  const [saving, setSaving] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!company.trim()) e.company = "Company wajib diisi";
    if (!role.trim()) e.role = "Role wajib diisi";
    if (!location.trim()) e.location = "Location wajib diisi";
    if (!appliedAt) e.appliedAt = "Applied date wajib diisi";

    if (jobLink.trim()) {
      try {
        // eslint-disable-next-line no-new
        new URL(jobLink);
      } catch {
        e.jobLink = "Job link tidak valid (contoh: https://...)";
      }
    }
    return e;
  }, [company, role, location, appliedAt, jobLink]);

  const canSubmit = Object.keys(errors).length === 0;

  async function handleSubmit() {
    if (!canSubmit || saving) return;

    const payload: CreatePayload = {
      company: company.trim(),
      role: role.trim(),
      location: location.trim(),
      workSetup,
      status,
      appliedAt, // YYYY-MM-DD
      jobLink: jobLink.trim() || null,
      notes: notes.trim() || null,
      requiredSkills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      setSaving(true);

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const json = (await res.json()) as { application: { id: string } };
      router.push(`/dashboard/applications/${json.application.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Add Application
          </h1>
          <p className="text-sm text-slate-600">
            Tambah lamaran baru ke tracker kamu.
          </p>
        </div>

        <Button variant="outline" className="rounded-xl" asChild>
          <Link href="/dashboard/applications">Back</Link>
        </Button>
      </div>

      <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
        <CardContent className="space-y-5 p-5">
          {/* Row 1 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. PT Example"
                className="rounded-xl bg-white/60"
              />
              {errors.company && (
                <p className="text-xs text-red-600">{errors.company}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Frontend Developer"
                className="rounded-xl bg-white/60"
              />
              {errors.role && (
                <p className="text-xs text-red-600">{errors.role}</p>
              )}
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label>Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Jakarta"
                className="rounded-xl bg-white/60"
              />
              {errors.location && (
                <p className="text-xs text-red-600">{errors.location}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label>Work setup</Label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white/60 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                value={workSetup}
                onChange={(e) => setWorkSetup(e.target.value as WorkSetup)}
              >
                <option value="Onsite">Onsite</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label>Applied date</Label>
              <Input
                type="date"
                value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)}
                className="rounded-xl bg-white/60"
              />
              {errors.appliedAt && (
                <p className="text-xs text-red-600">{errors.appliedAt}</p>
              )}
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label>Status</Label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white/60 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                value={status}
                onChange={(e) => setStatus(e.target.value as AppStatus)}
              >
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="technical_test">Technical Test</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="ghosting">Ghosting</option>
                <option value="hired">Hired</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Job link (optional)</Label>
              <Input
                value={jobLink}
                onChange={(e) => setJobLink(e.target.value)}
                placeholder="https://..."
                className="rounded-xl bg-white/60"
              />
              {errors.jobLink && (
                <p className="text-xs text-red-600">{errors.jobLink}</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Required skills (optional)</Label>
            <Input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="React, TypeScript, Tailwind, REST API"
              className="rounded-xl bg-white/60"
            />
            <p className="text-xs text-slate-500">Pisahkan dengan koma.</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan: siapa HR-nya, apa yang harus dipersiapkan, dll."
              className="min-h-[110px] rounded-xl bg-white/60"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" className="rounded-xl" asChild>
              <Link href="/dashboard/applications">Cancel</Link>
            </Button>
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
              disabled={!canSubmit || saving}
              onClick={handleSubmit}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>

          {!canSubmit && (
            <p className="text-xs text-slate-500">
              Isi field wajib dulu biar bisa Save.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
