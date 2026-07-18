// Server-side helpers for the admin area.
// The admin access token (a backend JWT) lives in a cookie set by the
// login/refresh flow; protected calls retry once with the refresh token.

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError } from "./api";

export const ADMIN_TOKEN_COOKIE = "romz_admin_token";
const ADMIN_REFRESH_TOKEN_COOKIE = "romz_admin_refresh_token";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");

export async function getAdminToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ADMIN_TOKEN_COOKIE)?.value;
}

async function refreshAdminTokenFromServer(): Promise<string | null> {
  if (!API_URL) return null;

  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(ADMIN_REFRESH_TOKEN_COOKIE)?.value;
    const requestHeaders = await headers();
    let res = await fetch(
      `${API_URL}/auth/refresh`,
      refreshToken
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
            cache: "no-store",
          }
        : {
            method: "POST",
            headers: { cookie: requestHeaders.get("cookie") ?? "" },
            cache: "no-store",
          }
    );

    if (res.status === 401 && refreshToken) {
      res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { cookie: requestHeaders.get("cookie") ?? "" },
        cache: "no-store",
      });
    }

    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    const token: string | undefined = body?.data?.accessToken;
    const role: string | undefined = body?.data?.user?.role;
    return token && role === "admin" ? token : null;
  } catch {
    return null;
  }
}

// Runs an admin API call with the token from the cookie. If the token is
// missing or expired, exchange the refresh token for a fresh admin token
// before redirecting to the login page.
export async function adminCall<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = (await getAdminToken()) ?? (await refreshAdminTokenFromServer());
  if (!token) redirect("/admin/login");

  try {
    return await fn(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const refreshedToken = await refreshAdminTokenFromServer();
      if (refreshedToken) {
        return fn(refreshedToken);
      }
      redirect("/admin/login");
    }
    throw error;
  }
}
