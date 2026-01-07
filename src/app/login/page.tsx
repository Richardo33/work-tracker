"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(data?.message ?? "Login failed");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-indigo-50 via-slate-50 to-emerald-50 px-6 py-20">
      <div className="mx-auto max-w-md">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur hover:bg-white"
          >
            WGN · Work Gantt Navigator
          </Link>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
            Login
          </h1>
        </div>

        <Card className="rounded-2xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Login</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  name="email"
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  name="password"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>

              <div className="rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-xs text-slate-600">
                <div className="font-medium text-slate-700">
                  Seed account (buat test):
                </div>
                <div>Email: {DEFAULT_EMAIL}</div>
                <div>Password: Password123!</div>
              </div>
            </form>

            <p className="text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-indigo-700 hover:underline"
              >
                Register
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

const DEFAULT_EMAIL = "richardoalvin9@gmail.com";
