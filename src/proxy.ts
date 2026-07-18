import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

const ADMIN_TOKEN_COOKIE = "romz_admin_token";
const ADMIN_REFRESH_TOKEN_COOKIE = "romz_admin_refresh_token";
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");
const TOKEN_MAX_AGE_SECONDS = 12 * 60 * 60;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

async function refreshAdminToken(
  request: NextRequest
): Promise<{ accessToken: string; refreshToken?: string } | null> {
  if (!API_URL) return null;

  try {
    const currentRefreshToken = request.cookies.get(ADMIN_REFRESH_TOKEN_COOKIE)?.value;
    let res = await fetch(
      `${API_URL}/auth/refresh`,
      currentRefreshToken
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
            cache: "no-store",
          }
        : {
            method: "POST",
            headers: { cookie: request.headers.get("cookie") ?? "" },
            cache: "no-store",
          }
    );

    if (res.status === 401 && currentRefreshToken) {
      res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { cookie: request.headers.get("cookie") ?? "" },
        cache: "no-store",
      });
    }

    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    const token: string | undefined = body?.data?.accessToken;
    const nextRefreshToken: string | undefined = body?.data?.refreshToken;
    const role: string | undefined = body?.data?.user?.role;
    return token && role === "admin"
      ? { accessToken: token, refreshToken: nextRefreshToken }
      : null;
  } catch {
    return null;
  }
}

function setAdminToken(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_TOKEN_COOKIE, token, {
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
}

function setAdminRefreshToken(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_REFRESH_TOKEN_COOKIE, token, {
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
}

function clearAdminToken(response: NextResponse) {
  response.cookies.set(ADMIN_TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  response.cookies.set(ADMIN_REFRESH_TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The admin area is not localized. If the short-lived access token is
  // missing, try the refresh token before sending the admin to login.
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";
    const hasToken = Boolean(request.cookies.get(ADMIN_TOKEN_COOKIE)?.value);

    if (!hasToken) {
      const refreshed = await refreshAdminToken(request);
      if (refreshed) {
        const response = isLoginPage
          ? NextResponse.redirect(new URL("/admin", request.url))
          : NextResponse.next();
        setAdminToken(response, refreshed.accessToken);
        if (refreshed.refreshToken) setAdminRefreshToken(response, refreshed.refreshToken);
        return response;
      }

      if (!isLoginPage) {
        const response = NextResponse.redirect(new URL("/admin/login", request.url));
        clearAdminToken(response);
        return response;
      }

      return NextResponse.next();
    }

    if (isLoginPage) {
      const refreshed = await refreshAdminToken(request);
      if (refreshed) {
        const response = NextResponse.redirect(new URL("/admin", request.url));
        setAdminToken(response, refreshed.accessToken);
        if (refreshed.refreshToken) setAdminRefreshToken(response, refreshed.refreshToken);
        return response;
      }

      const response = NextResponse.next();
      clearAdminToken(response);
      return response;
    }

    return NextResponse.next();
  }

  return intl(request);
}

export const config = {
  // Skip API routes, Next internals and static files.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
