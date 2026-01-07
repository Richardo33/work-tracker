import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET in env");

const secretKey = new TextEncoder().encode(JWT_SECRET);

export type AuthTokenPayload = {
  sub: string;
  email: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey);

  const sub = payload.sub;
  const email = payload.email;

  if (typeof sub !== "string" || typeof email !== "string") {
    throw new Error("Invalid token payload");
  }

  return { sub, email } satisfies AuthTokenPayload;
}
