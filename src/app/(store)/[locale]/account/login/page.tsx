"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import { AuthCard, Field, FormError } from "@/components/auth/AuthCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { authErrorKey } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const next: typeof errors = {};
    if (!email.trim()) next.email = t("required");
    else if (!EMAIL_RE.test(email.trim())) next.email = t("invalidEmail");
    if (!password) next.password = t("required");
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push("/account");
    } catch (error) {
      setFormError(t(authErrorKey(error)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard ghost="LOGIN" title={t("loginTitle")} subtitle={t("loginSubtitle")}>
      <form onSubmit={submit} className="space-y-6" noValidate>
        <Field
          label={t("email")}
          type="email"
          dir="ltr"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Field
          label={t("password")}
          type="password"
          dir="ltr"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <FormError>{formError}</FormError>

        <Button size="lg" type="submit" className="w-full" disabled={submitting}>
          {submitting ? "…" : t("signIn")}
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm">
        <p>
          <Link
            href="/account/forgot-password"
            className="font-bold text-navy underline-offset-4 hover:text-brand hover:underline"
          >
            {t("forgotLink")}
          </Link>
        </p>
        <p className="text-muted">
          {t("noAccount")}{" "}
          <Link
            href="/account/register"
            className="font-bold text-brand underline-offset-4 hover:underline"
          >
            {t("createOne")}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
