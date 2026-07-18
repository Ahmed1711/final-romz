"use client";

import { useEffect } from "react";
import {
  clearAdminToken,
  hasUsableAdminToken,
  refreshAdminToken,
} from "@/lib/adminApi";

function redirectToLogin() {
  clearAdminToken();
  window.location.replace("/admin/login");
}

// Keeps the admin access-token cookie fresh while the dashboard is open. A
// failed refresh is only fatal when there is no usable access token left.
export default function AdminSession() {
  useEffect(() => {
    let active = true;

    const renew = async () => {
      const token = await refreshAdminToken();
      if (active && !token && !hasUsableAdminToken()) redirectToLogin();
    };

    void renew();
    const id = setInterval(() => void renew(), 30 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return null;
}
