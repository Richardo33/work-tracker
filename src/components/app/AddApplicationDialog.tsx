"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

type WorkSetup = "Onsite" | "Hybrid" | "Remote";
type Status =
  | "applied"
  | "screening"
  | "interview"
  | "technical_test"
  | "offer"
  | "rejected"
  | "ghosting";

export type NewApplicationPayload = {
  company: string;
  role: string;
  location: string;
  workSetup: WorkSetup;
  status: Status;
  appliedAt: string; // YYYY-MM-DD
  nextEventTitle?: string;
  nextEventAt?: string; // datetime-local value
  jobLink?: string;
  requiredSkills?: string[]; // split by comma
  notes?: string;
};

export default function AddApplicationDialog({
  triggerText = "Add",
  triggerVariant = "default",
  triggerClassName = "rounded-xl bg-indigo-600 hover:bg-indigo-700",
  onCreate,
}: {
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  triggerClassName?: string;
  onCreate?: (payload: NewApplicationPayload) => void;
}) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<NewApplicationPayload>({
    company: "",
    role: "",
    location: "",
    workSetup: "Hybrid",
    status: "applied",
    appliedAt: today,
    nextEventTitle: "",
    nextEventAt: "",
    jobLink: "",
    requiredSkills: [],
    notes: "",
  });

  function set<K extends keyof NewApplicationPayload>(
    key: K,
    value: NewApplicationPayload[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setForm({
      company: "",
      role: "",
      location: "",
      workSetup: "Hybrid",
      status: "applied",
      appliedAt: today,
      nextEventTitle: "",
      nextEventAt: "",
      jobLink: "",
      requiredSkills: [],
      notes: "",
    });
  }

  function handleCreate() {
    const payload: NewApplicationPayload = {
      ...form,
      company: form.company.trim(),
      role: form.role.trim(),
      location: form.location.trim(),
      jobLink: form.jobLink?.trim() || undefined,
      nextEventTitle: form.nextEventTitle?.trim() || undefined,
      nextEventAt: form.nextEventAt?.trim() || undefined,
      requiredSkills:
        (Array.isArray(form.requiredSkills) ? form.requiredSkills : [])
          .map((s) => s.trim())
          .filter(Boolean) || undefined,
      notes: form.notes?.trim() || undefined,
    };

    if (!payload.company || !payload.role) return;

    // UI-only for now
    console.log("NEW APPLICATION:", payload);
    onCreate?.(payload);

    setOpen(false);
    reset();
  }

  const canSubmit =
    form.company.trim().length > 0 && form.role.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className={triggerClassName}>
          <Plus className="mr-2 h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle>Add application</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* row 1 */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                placeholder="e.g. Tokopedia"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                placeholder="e.g. Backend Developer"
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
              />
            </div>
          </div>

          {/* row 2 */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Jakarta / Remote"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Work setup</Label>
              <select
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                value={form.workSetup}
                onChange={(e) => set("workSetup", e.target.value as WorkSetup)}
              >
                <option value="Onsite">Onsite</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                value={form.status}
                onChange={(e) => set("status", e.target.value as Status)}
              >
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="technical_test">Technical test</option>
                <option value="offer">Offer</option>
                <option value="ghosting">Ghosting</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* row 3 */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="appliedAt">Applied date</Label>
              <Input
                id="appliedAt"
                type="date"
                value={form.appliedAt}
                onChange={(e) => set("appliedAt", e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="jobLink">Job post link</Label>
              <Input
                id="jobLink"
                placeholder="https://..."
                value={form.jobLink ?? ""}
                onChange={(e) => set("jobLink", e.target.value)}
              />
            </div>
          </div>

          {/* row 4 (agenda) */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="nextEventTitle">Next agenda title</Label>
              <Input
                id="nextEventTitle"
                placeholder="e.g. HR Interview"
                value={form.nextEventTitle ?? ""}
                onChange={(e) => set("nextEventTitle", e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nextEventAt">Next agenda time</Label>
              <Input
                id="nextEventAt"
                type="datetime-local"
                value={form.nextEventAt ?? ""}
                onChange={(e) => set("nextEventAt", e.target.value)}
              />
            </div>
          </div>

          {/* skills */}
          <div className="space-y-2">
            <Label htmlFor="skills">Required skills (comma separated)</Label>
            <Input
              id="skills"
              placeholder="React, TypeScript, PostgreSQL"
              onChange={(e) =>
                set(
                  "requiredSkills",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>

          {/* notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Company notes, interview tips, preparation checklist..."
              className="min-h-22.5"
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {/* actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>

            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
              disabled={!canSubmit}
              onClick={handleCreate}
            >
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
