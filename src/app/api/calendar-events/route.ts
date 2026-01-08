import { NextResponse } from "next/server";
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

type CreateBody = {
  title: string;
  type: EventType;
  startAt: string;
  endAt?: string | null;
  company?: string | null;
  locationType?: LocationType | null;
  meetLink?: string | null;
  place?: string | null;
  note?: string | null;
  applicationId?: string | null;
};

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();

    const url = new URL(req.url);
    const startParam = url.searchParams.get("start");
    const endParam = url.searchParams.get("end");

    let start = startParam ? parseISO(startParam) : null;
    let end = endParam ? parseISO(endParam) : null;

    if (!start || !end) {
      const now = new Date();
      start = new Date(now);
      start.setDate(start.getDate() - 60);
      end = new Date(now);
      end.setDate(end.getDate() + 30);
    }

    const rows = await prisma.calendarEvent.findMany({
      where: { userId, startAt: { gte: start, lt: end } },
      orderBy: { startAt: "asc" },
      select: SELECT_EVENT,
    });

    return NextResponse.json({ items: rows.map(toDTO) }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = (await req.json()) as CreateBody;

    if (!body?.title?.trim()) {
      return NextResponse.json(
        { message: "Title wajib diisi" },
        { status: 400 }
      );
    }
    if (!isEventType(body.type)) {
      return NextResponse.json({ message: "Type invalid" }, { status: 400 });
    }

    const start = parseISO(body.startAt);
    const end = body.endAt ? parseISO(body.endAt) : null;

    if (!start) {
      return NextResponse.json(
        { message: "Start time invalid" },
        { status: 400 }
      );
    }
    if (end && end.getTime() <= start.getTime()) {
      return NextResponse.json(
        { message: "End time must be after start" },
        { status: 400 }
      );
    }

    const locationType =
      typeof body.locationType === "undefined" ? null : body.locationType;

    if (locationType !== null && !isLocationType(locationType)) {
      return NextResponse.json(
        { message: "Location type invalid" },
        { status: 400 }
      );
    }

    const applicationId = body.applicationId?.trim() || null;
    if (applicationId) {
      const ok = await prisma.application.findFirst({
        where: { id: applicationId, userId },
        select: { id: true },
      });
      if (!ok) {
        return NextResponse.json(
          { message: "Application not found / not yours" },
          { status: 400 }
        );
      }
    }

    const meetLink =
      locationType === "online" ? body.meetLink?.trim() || null : null;

    if (meetLink) {
      try {
        // eslint-disable-next-line no-new
        new URL(meetLink);
      } catch {
        return NextResponse.json(
          { message: "Meet link tidak valid" },
          { status: 400 }
        );
      }
    }

    const place =
      locationType === "offline" ? body.place?.trim() || null : null;

    const data: Prisma.CalendarEventCreateInput = {
      user: { connect: { id: userId } },
      title: body.title.trim(),
      type: body.type,
      company: body.company?.trim() || null,
      startAt: start,
      endAt: end,
      locationType: locationType ?? null,
      meetLink,
      place,
      note: body.note?.trim() || null,
      ...(applicationId
        ? { application: { connect: { id: applicationId } } }
        : {}),
    };

    const created = await prisma.calendarEvent.create({
      data,
      select: SELECT_EVENT,
    });

    return NextResponse.json({ item: toDTO(created) }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
