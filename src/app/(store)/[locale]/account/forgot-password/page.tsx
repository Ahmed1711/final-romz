"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import { AuthCard, Field, FormError, FormSuccess } from "@/components/auth/AuthCard";
import { authErrorKey, forgotPassword } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (!EMAIL_RE.test(email.trim())) {
      setFieldError(t("invalidEmail"));
      return;
    }
    setFieldError(null);
    setFormError(null);

    setSubmitting(true);
    try {
      await forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (error) {
      setFormError(t(authErrorKey(error)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard ghost="RESET" title={t("forgotTitle")} subtitle={t("forgotSubtitle")}>
      <form onSubmit={submit} className="space-y-6" noValidate>
        <Field
          label={t("email")}
          type="email"
          dir="ltr"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError}
        />

        <FormError>{formError}</FormError>
        <FormSuccess>{sent ? t("forgotSent") : null}</FormSuccess>

        <Button size="lg" type="submit" className="w-full" disabled={submitting}>
          {submitting ? "…" : t("sendLink")}
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-muted">
        <p>
          <Link
            href="/account/reset-password"
            className="font-bold text-navy underline-offset-4 hover:text-brand hover:underline"
          >
            {t("haveResetCode")}
          </Link>
        </p>
        <p>
          <Link
            href="/account/login"
            className="font-bold text-brand underline-offset-4 hover:underline"
          >
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
