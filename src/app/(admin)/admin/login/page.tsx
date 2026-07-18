"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import clsx from "clsx";
import Button from "@/components/ui/Button";
import { writeAdminRefreshToken } from "@/lib/adminApi";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const ADMIN_TOKEN_COOKIE = "romz_admin_token";
// Keep in sync with JWT_ACCESS_EXPIRES_IN in backend/.env (12h).
const TOKEN_MAX_AGE_SECONDS = 12 * 60 * 60;

const inputCls =
  "w-full border-0 border-b-2 border-navy/30 bg-transparent px-1 py-2.5 text-sm text-navy placeholder:text-muted outline-none focus:border-brand transition-colors";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    if (!API_URL) {
      setError("Backend is not configured (NEXT_PUBLIC_API_URL is missing).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(body?.message ?? "Login failed. Check your email and password.");
        return;
      }

      const { user, accessToken, refreshToken } = body.data;
      if (user?.role !== "admin") {
        setError("This account is not an admin account.");
        return;
      }
      if (!accessToken) {
        setError("Login response did not include an access token.");
        return;
      }

      document.cookie = `${ADMIN_TOKEN_COOKIE}=${accessToken}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; samesite=lax`;
      if (refreshToken) writeAdminRefreshToken(refreshToken);
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Cannot reach the configured backend server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="-rotate-1 border-2 border-white/10 bg-white p-8 shadow-[8px_8px_0_0_var(--color-brand)]">
          <div className="rotate-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/romz-mark.png"
              alt=""
              aria-hidden
              className="mb-3 h-10 w-auto select-none"
            />
            <p className="font-display uppercase text-4xl leading-none text-navy">
              ROMZ
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
              Admin Dashboard
            </p>
            <div className="mt-4 h-1 w-14 bg-brand" />

            <form onSubmit={submit} className="mt-8 space-y-6">
              <div>
                <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-navy">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@romz.local"
                  className={inputCls}
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-navy">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                  dir="ltr"
                  required
                />
              </div>

              {error && (
                <p className="text-xs font-bold text-brand">{error}</p>
              )}

              <Button
                size="md"
                type="submit"
                disabled={submitting}
                className={clsx("w-full", submitting && "opacity-70")}
              >
                {submitting ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted">
              <Lock size={11} />
              Authorized staff only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
