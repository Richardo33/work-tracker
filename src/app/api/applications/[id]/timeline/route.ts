import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import type { AppStatus } from "@/lib/applicationStatus";

export const runtime = "nodejs";

type Body = {
  stage: AppStatus;
  detail?: string;
  at: string; // ISO
  mode?: "online" | "offline";
  meetLink?: string;
  location?: string;
  notes?: string;
};

function computeNextEventTitle(stage: AppStatus, detail?: string) {
  if (stage === "interview") {
    const m: Record<string, string> = {
      hr: "HR Interview",
      user: "User Interview",
      technical: "Technical Interview",
      cultural: "Cultural / Fit Interview",
      other: "Interview",
    };
    return m[detail ?? "other"] ?? "Interview";
  }

  if (stage === "technical_test") {
    const m: Record<string, string> = {
      live_code: "Live Coding",
      take_home: "Take-home Test",
      offline: "Offline Technical Test",
      psychotest: "Psychotest",
      other: "Technical Test",
    };
    return m[detail ?? "other"] ?? "Technical Test";
  }

  // default fallback
  return stage.replaceAll("_", " ");
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;

    const body = (await req.json()) as Body;

    const eventAt = new Date(body.at);
    if (Number.isNaN(eventAt.getTime())) {
      return NextResponse.json(
        { message: "Invalid 'at' date" },
        { status: 400 }
      );
    }

    const owned = await prisma.application.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!owned) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const created = await prisma.applicationTimelineEvent.create({
      data: {
        applicationId: id,
        stage: body.stage,
        detail: body.detail ?? null,
        mode: body.mode ?? null,
        meetLink: body.meetLink?.trim() || null,
        location: body.location?.trim() || null,
        notes: body.notes?.trim() || null,
        at: eventAt,
      },
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

    const isFuture = eventAt.getTime() > Date.now();
    const nextTitle = computeNextEventTitle(body.stage, body.detail);

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: body.stage,
        statusDetail: body.detail ?? null,
        lastUpdate: eventAt,
        nextEventAt: isFuture ? eventAt : null,
        nextEventTitle: isFuture ? nextTitle : null,
      },
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

    return NextResponse.json(
      {
        application: {
          id: updated.id,
          company: updated.company,
          role: updated.role,
          location: updated.location,
          workSetup: updated.workSetup,
          status: updated.status,
          statusDetail: updated.statusDetail ?? null,
          source: updated.source ?? null,
          jobLink: updated.jobLink ?? null,
          requiredSkills: updated.requiredSkills,
          niceToHave: updated.niceToHave,
          notes: updated.notes ?? null,
          appliedAt: updated.appliedAt.toISOString(),
          lastUpdate: updated.lastUpdate.toISOString(),
        },
        event: {
          id: created.id,
          stage: created.stage,
          detail: created.detail ?? null,
          at: created.at.toISOString(),
          mode: created.mode ?? null,
          meetLink: created.meetLink ?? null,
          location: created.location ?? null,
          notes: created.notes ?? null,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
