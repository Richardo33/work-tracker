import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signAuthToken } from "@/lib/auth";

export const runtime = "nodejs";

type RegisterBody = {
  name: string;
  email: string;
  password: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<RegisterBody>;

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!name)
    return NextResponse.json({ message: "Name is required" }, { status: 400 });
  if (!email)
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json(
      { message: "Password min 8 characters" },
      { status: 400 }
    );

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists)
    return NextResponse.json(
      { message: "Email already registered" },
      { status: 409 }
    );

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: { name },
      },
    },
    select: { id: true, email: true },
  });

  const token = await signAuthToken({ sub: user.id, email: user.email });

  const res = NextResponse.json({ ok: true, user }, { status: 201 });
  res.cookies.set("wgn_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
