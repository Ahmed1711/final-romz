"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import { AuthCard, Field, FormError, FormSuccess } from "@/components/auth/AuthCard";
import { ApiError } from "@/lib/api";
import { authErrorKey, resetPassword } from "@/lib/auth";

interface Errors {
  token?: string;
  password?: string;
  confirm?: string;
}

function ResetPasswordForm() {
  const t = useTranslations("auth");
  const params = useSearchParams();

  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || done) return;

    const next: Errors = {};
    if (!token.trim()) next.token = t("required");
    if (password.length < 8) next.password = t("passwordMin");
    if (confirm !== password) next.confirm = t("passwordMismatch");
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await resetPassword({ token: token.trim(), password });
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setFormError(t("invalidToken"));
      } else {
        setFormError(t(authErrorKey(error)));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard ghost="RESET" title={t("resetTitle")} subtitle={t("resetSubtitle")}>
      <form onSubmit={submit} className="space-y-6" noValidate>
        <Field
          label={t("resetToken")}
          dir="ltr"
          placeholder="a1b2c3…"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          error={errors.token}
        />
        <Field
          label={t("newPassword")}
          type="password"
          dir="ltr"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Field
          label={t("confirmPassword")}
          type="password"
          dir="ltr"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />

        <FormError>{formError}</FormError>
        <FormSuccess>{done ? t("resetDone") : null}</FormSuccess>

        {done ? (
          <Link
            href="/account/login"
            className="skew-cta block bg-brand px-10 py-4 text-center font-display uppercase tracking-wider text-white hover:bg-brand-dark transition-colors"
          >
            <span>{t("signIn")}</span>
          </Link>
        ) : (
          <Button size="lg" type="submit" className="w-full" disabled={submitting}>
            {submitting ? "…" : t("resetPasswordCta")}
          </Button>
        )}
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
