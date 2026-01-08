import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";

export const runtime = "nodejs";

type PatchBody = {
  name?: string;
  headline?: string;
  location?: string;
  bio?: string;
  avatarUrl?: string | null;
};

function asString(v: unknown, maxLen: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (!s) return "";
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export async function GET() {
  try {
    const userId = await requireUserId();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            name: true,
            headline: true,
            location: true,
            bio: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await requireUserId();
    const body = (await req.json()) as PatchBody;

    const name = asString(body.name, 80);
    const headline = asString(body.headline, 120);
    const location = asString(body.location, 80);
    const bio = asString(body.bio, 280);

    const avatarUrl =
      body.avatarUrl === null
        ? null
        : typeof body.avatarUrl === "string"
        ? body.avatarUrl.trim()
        : undefined;

    await prisma.profile.upsert({
      where: { userId },
      update: {
        ...(name !== undefined ? { name } : {}),
        ...(headline !== undefined ? { headline } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      },
      create: {
        userId,
        name: name ?? null,
        headline: headline ?? null,
        location: location ?? null,
        bio: bio ?? null,
        avatarUrl: avatarUrl ?? null,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            name: true,
            headline: true,
            location: true,
            bio: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, user }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
