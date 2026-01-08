import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";

export async function requireUserId() {
  const token = (await cookies()).get("wgn_token")?.value;
  if (!token) throw new Error("UNAUTHORIZED");
  const payload = await verifyAuthToken(token);
  return payload.sub; // userId
}
