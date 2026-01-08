import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import type { AppStatus } from "@/lib/applicationStatus";

export const runtime = "nodejs";

type ApplicationDTO = {
  id: string;
  company: string;
  role: string;
  location: string;
  workSetup: "Onsite" | "Hybrid" | "Remote";
  status: AppStatus;
  statusDetail?: string | null;
  source?: string | null;
  jobLink?: string | null;
  requiredSkills: string[];
  niceToHave: string[];
  notes?: string | null;
  appliedAt: string;
  lastUpdate: string;
};

type TimelineEventDTO = {
  id: string;
  stage: AppStatus;
  detail?: string | null;
  at: string;
  mode?: "online" | "offline" | null;
  meetLink?: string | null;
  location?: string | null;
  notes?: string | null;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;

    const app = await prisma.application.findFirst({
      where: { id, userId },
      select: {
        id: true,
        company: true,
        role: true,
        location: true,
        workSetup: true,
        status: true,
        statusDetail: true,
        source: true,
        jobLink: true,
        requiredSkills: true,
        niceToHave: true,
        notes: true,
        appliedAt: true,
        lastUpdate: true,
      },
    });

    if (!app) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const events = await prisma.applicationTimelineEvent.findMany({
      where: { applicationId: id },
      orderBy: [{ at: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        stage: true,
        detail: true,
        at: true,
        mode: true,
        meetLink: true,
        location: true,
        notes: true,
      },
    });

    const application: ApplicationDTO = {
      id: app.id,
      company: app.company,
      role: app.role,
      location: app.location,
      workSetup: app.workSetup,
      status: app.status as AppStatus,
      statusDetail: app.statusDetail ?? null,
      source: app.source ?? null,
      jobLink: app.jobLink ?? null,
      requiredSkills: app.requiredSkills,
      niceToHave: app.niceToHave,
      notes: app.notes ?? null,
      appliedAt: app.appliedAt.toISOString(),
      lastUpdate: app.lastUpdate.toISOString(),
    };

    const timeline: TimelineEventDTO[] = events.map((e) => ({
      id: e.id,
      stage: e.stage as AppStatus,
      detail: e.detail ?? null,
      at: e.at.toISOString(),
      mode: e.mode ?? null,
      meetLink: e.meetLink ?? null,
      location: e.location ?? null,
      notes: e.notes ?? null,
    }));

    return NextResponse.json({ application, timeline }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
