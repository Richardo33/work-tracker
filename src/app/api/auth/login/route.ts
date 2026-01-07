import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAuthToken, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

type LoginBody = {
  email: string;
  password: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<LoginBody>;

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email)
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  if (!password)
    return NextResponse.json(
      { message: "Password is required" },
      { status: 400 }
    );

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user)
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok)
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );

  const token = await signAuthToken({ sub: user.id, email: user.email });

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email },
  });
  res.cookies.set("wgn_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
