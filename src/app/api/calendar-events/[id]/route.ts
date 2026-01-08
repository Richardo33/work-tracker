// src/app/api/calendar-events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { EventType, LocationType, Prisma } from "@prisma/client";

export const runtime = "nodejs";

type CalendarEventDTO = {
  id: string;
  title: string;
  type: EventType;
  company: string | null;
  startAt: string;
  endAt: string | null;
  locationType: LocationType | null;
  meetLink: string | null;
  place: string | null;
  note: string | null;
  applicationId: string | null;
};

const SELECT_EVENT = {
  id: true,
  title: true,
  type: true,
  company: true,
  startAt: true,
  endAt: true,
  locationType: true,
  meetLink: true,
  place: true,
  note: true,
  applicationId: true,
} as const;

type CalendarEventRow = Prisma.CalendarEventGetPayload<{
  select: typeof SELECT_EVENT;
}>;

function toDTO(e: CalendarEventRow): CalendarEventDTO {
  return {
    id: e.id,
    title: e.title,
    type: e.type,
    company: e.company,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt ? e.endAt.toISOString() : null,
    locationType: e.locationType,
    meetLink: e.meetLink,
    place: e.place,
    note: e.note,
    applicationId: e.applicationId,
  };
}

function isEventType(x: unknown): x is EventType {
  return (
    x === "interview_hr" ||
    x === "interview_user" ||
    x === "technical_test" ||
    x === "psychotest" ||
    x === "offer" ||
    x === "follow_up" ||
    x === "other"
  );
}

function isLocationType(x: unknown): x is LocationType {
  return x === "online" || x === "offline";
}

function parseISO(s: unknown): Date | null {
  if (typeof s !== "string") return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

type PatchBody = {
  title?: string;
  type?: EventType;
  startAt?: string;
  endAt?: string | null;
  company?: string | null;
  locationType?: LocationType | null;
  meetLink?: string | null;
  place?: string | null;
  note?: string | null;
  applicationId?: string | null;
};

// ✅ Next terbaru: params bisa berupa Promise
type Params = { id: string };
type RouteCtx = { params: Params | Promise<Params> };

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  try {
    const userId = await requireUserId();

    // ✅ FIX: handle params Promise vs object
    const { id } = await Promise.resolve(params);

    const exists = await prisma.calendarEvent.findFirst({
      where: { id, userId },
      select: SELECT_EVENT,
    });

    if (!exists) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const body = (await req.json()) as PatchBody;
    const data: Prisma.CalendarEventUpdateInput = {};

    if (typeof body.title !== "undefined") {
      if (!body.title?.trim()) {
        return NextResponse.json(
          { message: "Title wajib diisi" },
          { status: 400 }
        );
      }
      data.title = body.title.trim();
    }

    if (typeof body.type !== "undefined") {
      if (!isEventType(body.type)) {
        return NextResponse.json({ message: "Type invalid" }, { status: 400 });
      }
      data.type = body.type;
    }

    if (typeof body.company !== "undefined") {
      data.company = body.company?.trim() || null;
    }

    if (typeof body.note !== "undefined") {
      data.note = body.note?.trim() || null;
    }

    let nextStartAt: Date = exists.startAt;
    if (typeof body.startAt !== "undefined") {
      const start = parseISO(body.startAt);
      if (!start) {
        return NextResponse.json(
          { message: "Start time invalid" },
          { status: 400 }
        );
      }
      data.startAt = start;
      nextStartAt = start;
    }

    let nextEndAt: Date | null = exists.endAt;
    if (typeof body.endAt !== "undefined") {
      if (body.endAt === null) {
        data.endAt = null;
        nextEndAt = null;
      } else {
        const end = parseISO(body.endAt);
        if (!end) {
          return NextResponse.json(
            { message: "End time invalid" },
            { status: 400 }
          );
        }
        data.endAt = end;
        nextEndAt = end;
      }
    }

    if (nextEndAt && nextEndAt.getTime() <= nextStartAt.getTime()) {
      return NextResponse.json(
        { message: "End time must be after start" },
        { status: 400 }
      );
    }

    let nextLocationType: LocationType | null = exists.locationType;

    if (typeof body.locationType !== "undefined") {
      if (body.locationType !== null && !isLocationType(body.locationType)) {
        return NextResponse.json(
          { message: "Location type invalid" },
          { status: 400 }
        );
      }
      data.locationType = body.locationType;
      nextLocationType = body.locationType ?? null;
    }

    // ✅ update relasi application via connect/disconnect (bukan applicationId)
    if (typeof body.applicationId !== "undefined") {
      const appId = body.applicationId?.trim() || null;

      if (appId) {
        const ok = await prisma.application.findFirst({
          where: { id: appId, userId },
          select: { id: true },
        });
        if (!ok) {
          return NextResponse.json(
            { message: "Application not found / not yours" },
            { status: 400 }
          );
        }
        data.application = { connect: { id: appId } };
      } else {
        data.application = { disconnect: true };
      }
    }

    if (typeof body.meetLink !== "undefined") {
      const link =
        nextLocationType === "online" ? body.meetLink?.trim() || null : null;

      if (link) {
        try {
          // eslint-disable-next-line no-new
          new URL(link);
        } catch {
          return NextResponse.json(
            { message: "Meet link tidak valid" },
            { status: 400 }
          );
        }
      }
      data.meetLink = link;
    } else if (
      typeof body.locationType !== "undefined" &&
      nextLocationType !== "online"
    ) {
      data.meetLink = null;
    }

    if (typeof body.place !== "undefined") {
      data.place =
        nextLocationType === "offline" ? body.place?.trim() || null : null;
    } else if (
      typeof body.locationType !== "undefined" &&
      nextLocationType !== "offline"
    ) {
      data.place = null;
    }

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data,
      select: SELECT_EVENT,
    });

    return NextResponse.json({ item: toDTO(updated) }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  try {
    const userId = await requireUserId();

    // ✅ FIX: handle params Promise vs object
    const { id } = await Promise.resolve(params);

    const exists = await prisma.calendarEvent.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!exists) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
