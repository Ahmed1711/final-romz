"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { BadgeCheck, LogOut, Package, TriangleAlert } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import Button, { btn } from "@/components/ui/Button";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AccountPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/account/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="font-display uppercase tracking-wider text-muted">…</span>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <AuthCard ghost="ROMZ" title={t("accountTitle")} subtitle={t("welcome", { name: user.name })}>
      <dl className="divide-y divide-navy/10 border-y border-navy/10 text-sm">
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">
            {t("name")}
          </dt>
          <dd className="font-bold text-navy">{user.name}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">
            {t("email")}
          </dt>
          <dd className="font-bold text-navy" dir="ltr">
            {user.email}
          </dd>
        </div>
        {user.phone && (
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">
              {t("phoneShort")}
            </dt>
            <dd className="font-bold text-navy" dir="ltr">
              {user.phone}
            </dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">
            {t("emailStatus")}
          </dt>
          <dd>
            {user.isVerified ? (
              <span className="flex items-center gap-1 bg-success/10 px-2 py-0.5 text-[11px] font-bold uppercase text-success">
                <BadgeCheck size={12} />
                {t("verified")}
              </span>
            ) : (
              <Link
                href="/account/verify"
                className="flex items-center gap-1 bg-brand/10 px-2 py-0.5 text-[11px] font-bold uppercase text-brand hover:bg-brand/20"
              >
                <TriangleAlert size={12} />
                {t("verifyNow")}
              </Link>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-8 space-y-3">
        <Link href="/track-order" className={btn("outline", "md", "w-full")}>
          <span className="flex items-center justify-center gap-2">
            <Package size={16} />
            {t("trackMyOrder")}
          </span>
        </Link>
        <Button variant="navy" size="md" className="w-full" onClick={handleLogout}>
          <span className="flex items-center justify-center gap-2">
            <LogOut size={16} />
            {t("logout")}
          </span>
        </Button>
      </div>
    </AuthCard>
  );
}
