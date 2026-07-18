"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import { AuthCard, Field, FormError, FormSuccess } from "@/components/auth/AuthCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api";
import { authErrorKey, resendOtp, verifyEmail } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN = 60;

function VerifyEmailForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const { user, updateUser } = useAuth();

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<{ email?: string; code?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Prefill from the logged-in session (right after registration) once the
  // async auth session resolves.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!email && user?.email) setEmail(user.email);
  }, [user, email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || success) return;

    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = t("invalidEmail");
    if (!/^\d{6}$/.test(code.trim())) next.code = t("codeFormat");
    setErrors(next);
    setFormError(null);
    setNotice(null);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const { user: verified } = await verifyEmail({
        email: email.trim(),
        code: code.trim(),
      });
      if (user && verified) updateUser(verified);
      setSuccess(true);
      setTimeout(() => router.push("/account"), 1500);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setFormError(t("invalidCode"));
      } else if (error instanceof ApiError && error.status === 404) {
        setFormError(t("invalidEmail"));
      } else {
        setFormError(t(authErrorKey(error)));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || !EMAIL_RE.test(email.trim())) return;
    setFormError(null);
    setNotice(null);
    try {
      await resendOtp({ email: email.trim() });
      setNotice(t("codeSent"));
      setCooldown(RESEND_COOLDOWN);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        // already verified
        setSuccess(true);
        setTimeout(() => router.push("/account"), 1500);
      } else {
        setFormError(t(authErrorKey(error)));
      }
    }
  };

  return (
    <AuthCard ghost="VERIFY" title={t("verifyTitle")} subtitle={t("verifySubtitle")}>
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
          label={t("code")}
          inputMode="numeric"
          maxLength={6}
          dir="ltr"
          autoComplete="one-time-code"
          placeholder="000000"
          className="text-center font-display text-2xl tracking-[0.5em]"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          error={errors.code}
        />

        <FormError>{formError}</FormError>
        <FormSuccess>{success ? t("verifySuccess") : notice}</FormSuccess>

        <Button size="lg" type="submit" className="w-full" disabled={submitting || success}>
          {submitting ? "…" : t("verify")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="font-bold text-brand underline-offset-4 hover:underline disabled:cursor-default disabled:text-muted cursor-pointer"
        >
          {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
        </button>
      </p>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
