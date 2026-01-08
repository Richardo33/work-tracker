import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import type { AppStatus, WorkSetup } from "@prisma/client";

export const runtime = "nodejs";

type ApplicationDTO = {
  id: string;
  company: string;
  role: string;
  location: string;
  workSetup: WorkSetup;
  status: AppStatus;
  appliedAt: string; // ISO
  lastUpdate: string; // ISO
  nextEventAt?: string; // ISO
  nextEventTitle?: string | null;
};

type CreateBody = {
  company: string;
  role: string;
  location: string;
  workSetup: WorkSetup;
  status: AppStatus;
  appliedAt: string; // "YYYY-MM-DD"
  jobLink?: string | null;
  notes?: string | null;
  requiredSkills?: string[];
  niceToHave?: string[];
  source?: string | null;
};

const TERMINAL_STATUSES: AppStatus[] = [
  "hired",
  "rejected",
  "withdrawn",
  "ghosting",
];

function isWorkSetup(x: unknown): x is WorkSetup {
  return x === "Onsite" || x === "Hybrid" || x === "Remote";
}

function isAppStatus(x: unknown): x is AppStatus {
  return (
    x === "applied" ||
    x === "screening" ||
    x === "interview" ||
    x === "technical_test" ||
    x === "offer" ||
    x === "rejected" ||
    x === "ghosting" ||
    x === "hired" ||
    x === "withdrawn"
  );
}

function parseDateOnlyToUTC(dateStr: string): Date | null {
  // "YYYY-MM-DD" => UTC midnight
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, d, 0, 0, 0));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function autoGhosting(userId: string) {
  const now = new Date();
  const cutoff = daysAgo(14);

  // ghosting kalau: lastUpdate < 14 hari lalu, status bukan terminal,
  // dan tidak ada nextEventAt yang masih di depan
  await prisma.application.updateMany({
    where: {
      userId,
      status: { notIn: TERMINAL_STATUSES },
      lastUpdate: { lt: cutoff },
      OR: [{ nextEventAt: null }, { nextEventAt: { lt: now } }],
    },
    data: {
      status: "ghosting",
      // NOTE: kamu bisa pilih mau update lastUpdate atau nggak.
      // Kalau kamu nggak mau "mengubah histori update", hapus baris ini.
      lastUpdate: now,
      nextEventAt: null,
      nextEventTitle: null,
    },
  });
}

export async function GET() {
  try {
    const userId = await requireUserId();

    // ✅ tanpa cron: auto-ghosting dijalankan setiap kali client fetch list
    await autoGhosting(userId);

    const apps = await prisma.application.findMany({
      where: { userId },
      orderBy: { lastUpdate: "desc" },
      select: {
        id: true,
        company: true,
        role: true,
        location: true,
        workSetup: true,
        status: true,
        appliedAt: true,
        lastUpdate: true,
        nextEventAt: true,
        nextEventTitle: true,
      },
    });

    const items: ApplicationDTO[] = apps.map((a) => ({
      id: a.id,
      company: a.company,
      role: a.role,
      location: a.location,
      workSetup: a.workSetup,
      status: a.status,
      appliedAt: a.appliedAt.toISOString(),
      lastUpdate: a.lastUpdate.toISOString(),
      nextEventAt: a.nextEventAt ? a.nextEventAt.toISOString() : undefined,
      nextEventTitle: a.nextEventTitle ?? null,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body: CreateBody = await req.json();

    if (!body.company?.trim()) {
      return NextResponse.json(
        { message: "Company wajib diisi" },
        { status: 400 }
      );
    }
    if (!body.role?.trim()) {
      return NextResponse.json(
        { message: "Role wajib diisi" },
        { status: 400 }
      );
    }
    if (!body.location?.trim()) {
      return NextResponse.json(
        { message: "Location wajib diisi" },
        { status: 400 }
      );
    }
    if (!isWorkSetup(body.workSetup)) {
      return NextResponse.json(
        { message: "Work setup invalid" },
        { status: 400 }
      );
    }
    if (!isAppStatus(body.status)) {
      return NextResponse.json({ message: "Status invalid" }, { status: 400 });
    }

    const applied = parseDateOnlyToUTC(body.appliedAt);
    if (!applied) {
      return NextResponse.json(
        { message: "Applied date invalid" },
        { status: 400 }
      );
    }

    if (body.jobLink && body.jobLink.trim()) {
      try {
        // eslint-disable-next-line no-new
        new URL(body.jobLink);
      } catch {
        return NextResponse.json(
          { message: "Job link tidak valid" },
          { status: 400 }
        );
      }
    }

    const created = await prisma.application.create({
      data: {
        userId,
        company: body.company.trim(),
        role: body.role.trim(),
        location: body.location.trim(),
        workSetup: body.workSetup,
        status: body.status,
        statusDetail: null,
        source: body.source?.trim() || null,
        jobLink: body.jobLink?.trim() || null,
        notes: body.notes?.trim() || null,
        requiredSkills: Array.isArray(body.requiredSkills)
          ? body.requiredSkills
          : [],
        niceToHave: Array.isArray(body.niceToHave) ? body.niceToHave : [],
        appliedAt: applied,
        lastUpdate: applied,
        nextEventAt: null,
        nextEventTitle: null,
      },
      select: { id: true },
    });

    return NextResponse.json(
      { application: { id: created.id } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
