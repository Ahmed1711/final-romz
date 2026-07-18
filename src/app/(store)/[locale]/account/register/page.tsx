"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import { AuthCard, Field, FormError } from "@/components/auth/AuthCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { authErrorKey } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const next: Errors = {};
    if (name.trim().length < 2) next.name = t("required");
    if (!email.trim()) next.email = t("required");
    else if (!EMAIL_RE.test(email.trim())) next.email = t("invalidEmail");
    if (password.length < 8) next.password = t("passwordMin");
    if (confirm !== password) next.confirm = t("passwordMismatch");
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      // Account created; the backend has emailed a 6-digit code.
      router.push("/account/verify");
    } catch (error) {
      setFormError(t(authErrorKey(error)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard ghost="JOIN" title={t("registerTitle")} subtitle={t("registerSubtitle")}>
      <form onSubmit={submit} className="space-y-6" noValidate>
        <Field
          label={t("name")}
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
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
          label={t("phone")}
          type="tel"
          dir="ltr"
          autoComplete="tel"
          placeholder="+20 10 0000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Field
          label={t("password")}
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

        <Button size="lg" type="submit" className="w-full" disabled={submitting}>
          {submitting ? "…" : t("signUp")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t("haveAccount")}{" "}
        <Link
          href="/account/login"
          className="font-bold text-brand underline-offset-4 hover:underline"
        >
          {t("signInInstead")}
        </Link>
      </p>
    </AuthCard>
  );
}
