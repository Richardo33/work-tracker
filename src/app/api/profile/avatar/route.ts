import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function isAllowedImage(mime: string) {
  return mime === "image/png" || mime === "image/jpeg" || mime === "image/webp";
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();

    const bucket = process.env.SUPABASE_BUCKET;
    if (!bucket) {
      return NextResponse.json(
        { message: "Missing SUPABASE_BUCKET" },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "File is required (field name: file)" },
        { status: 400 }
      );
    }

    if (!isAllowedImage(file.type)) {
      return NextResponse.json(
        { message: "Only PNG/JPG/WEBP allowed" },
        { status: 400 }
      );
    }

    const max = 2 * 1024 * 1024; // 2MB
    if (file.size > max) {
      return NextResponse.json(
        { message: "Max file size is 2MB" },
        { status: 400 }
      );
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const path = `avatars/${userId}/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadErr) {
      return NextResponse.json({ message: uploadErr.message }, { status: 500 });
    }

    // NOTE: ini hanya bisa dipakai kalau bucket PUBLIC.
    // Kalau bucket private, nanti kita ganti jadi signed URL.
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    const avatarUrl = data.publicUrl;

    await prisma.profile.upsert({
      where: { userId },
      update: { avatarUrl },
      create: { userId, avatarUrl },
    });

    return NextResponse.json({ ok: true, avatarUrl }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
