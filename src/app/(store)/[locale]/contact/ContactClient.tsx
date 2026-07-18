"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Clock, Mail, MapPin, Phone } from "lucide-react";
import clsx from "clsx";
import Button from "@/components/ui/Button";
import { ApiError, submitContact } from "@/lib/api";
import { getContactDetails } from "@/content/policies";
import type { Locale } from "@/lib/types";

const inputCls =
  "w-full border-0 border-b-2 border-navy/30 bg-transparent px-1 py-2.5 text-sm text-navy placeholder:text-muted outline-none focus:border-brand transition-colors";
const labelCls =
  "mb-1 block text-xs font-extrabold uppercase tracking-wider text-navy";

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactClient() {
  const t = useTranslations("contact");
  const locale = useLocale() as Locale;
  const info = getContactDetails(locale);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (form.name.trim().length < 2) next.name = t("errName");
    if (!EMAIL_RE.test(form.email.trim())) next.email = t("errEmail");
    if (form.phone.trim().length > 40) next.phone = t("errPhone");
    if (form.subject.trim().length < 2) next.subject = t("errSubject");
    if (form.message.trim().length < 10) next.message = t("errMessage");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setServerError(null);
    if (!validate()) return;

    setSending(true);
    try {
      await submitContact({
        name: form.name.trim(),
        email: form.email.trim(),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        subject: form.subject.trim(),
        message: form.message.trim(),
        source: "contact-page",
      });
      setSent(true);
      setForm(emptyForm);
      setErrors({});
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setServerError(t("errRateLimit"));
      } else if (err instanceof ApiError && err.status === 400) {
        setServerError(err.message);
      } else {
        setServerError(t("errGeneric"));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="relative px-4 pb-16 pt-14 md:pt-20">
        <span
          aria-hidden
          className="ghost-text absolute inset-x-0 top-10 text-center font-display uppercase leading-none text-7xl md:text-9xl"
        >
          CONTACT
        </span>
        <div className="relative mx-auto max-w-xl">
          <div className="-rotate-1 border-2 border-navy bg-white p-8 shadow-[8px_8px_0_0_var(--color-navy)] md:p-10">
            <div className="rotate-1">
              <h1 className="text-center font-display uppercase text-2xl text-navy underline decoration-brand decoration-2 underline-offset-4 md:text-3xl">
                {t("title")}
              </h1>
              <div className="mx-auto mt-2 h-1 w-14 bg-brand" />
              <p className="mt-4 text-center text-sm text-muted">
                {t("subtitle")}
              </p>

              {/* Direct contact details (required for Paymob onboarding). */}
              <div className="mt-6 grid gap-3 border-y-2 border-navy/10 py-6 text-sm sm:grid-cols-2">
                <a
                  href={`mailto:${info.email}`}
                  className="flex items-center gap-3 text-navy transition-colors hover:text-brand"
                >
                  <Mail size={18} className="shrink-0 text-brand" />
                  <span dir="ltr">{info.email}</span>
                </a>
                <a
                  href={`tel:${info.phone.replace(/\s+/g, "")}`}
                  className="flex items-center gap-3 text-navy transition-colors hover:text-brand"
                >
                  <Phone size={18} className="shrink-0 text-brand" />
                  <span dir="ltr">{info.phone}</span>
                </a>
                <div className="flex items-center gap-3 text-navy">
                  <MapPin size={18} className="shrink-0 text-brand" />
                  <span>{info.address}</span>
                </div>
                <div className="flex items-center gap-3 text-navy">
                  <Clock size={18} className="shrink-0 text-brand" />
                  <span>{info.hours}</span>
                </div>
              </div>

              {sent ? (
                <div className="mt-8 flex flex-col items-center gap-4 border-2 border-success/40 bg-success/5 px-6 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-white">
                    <Check size={22} />
                  </div>
                  <p className="font-display uppercase text-lg text-navy">
                    {t("successTitle")}
                  </p>
                  <p className="max-w-sm text-sm text-muted">
                    {t("successBody")}
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-2 text-xs font-extrabold uppercase tracking-wider text-brand hover:text-brand-dark cursor-pointer"
                  >
                    {t("sendAnother")}
                  </button>
                </div>
              ) : (
                <div className="mt-8 space-y-6">
                  <div>
                    <label className={labelCls} htmlFor="contact-name">
                      {t("name")}
                    </label>
                    <input
                      id="contact-name"
                      value={form.name}
                      onChange={(e) => set("name")(e.target.value)}
                      placeholder={t("namePlaceholder")}
                      className={inputCls}
                      maxLength={120}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs font-bold text-brand">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className={labelCls} htmlFor="contact-email">
                        {t("email")}
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email")(e.target.value)}
                        placeholder={t("emailPlaceholder")}
                        className={inputCls}
                        dir="ltr"
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs font-bold text-brand">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="contact-phone">
                        {t("phone")}
                      </label>
                      <input
                        id="contact-phone"
                        value={form.phone}
                        onChange={(e) => set("phone")(e.target.value)}
                        placeholder={t("phonePlaceholder")}
                        className={inputCls}
                        dir="ltr"
                        maxLength={40}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs font-bold text-brand">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls} htmlFor="contact-subject">
                      {t("subject")}
                    </label>
                    <input
                      id="contact-subject"
                      value={form.subject}
                      onChange={(e) => set("subject")(e.target.value)}
                      placeholder={t("subjectPlaceholder")}
                      className={inputCls}
                      maxLength={160}
                    />
                    {errors.subject && (
                      <p className="mt-1 text-xs font-bold text-brand">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelCls} htmlFor="contact-message">
                      {t("message")}
                    </label>
                    <textarea
                      id="contact-message"
                      value={form.message}
                      onChange={(e) => set("message")(e.target.value)}
                      placeholder={t("messagePlaceholder")}
                      rows={5}
                      className={clsx(inputCls, "resize-y")}
                      maxLength={3000}
                    />
                    {errors.message && (
                      <p className="mt-1 text-xs font-bold text-brand">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {serverError && (
                    <p className="border-s-2 border-brand bg-brand/5 px-3 py-2 text-sm font-bold text-brand">
                      {serverError}
                    </p>
                  )}

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={submit}
                    disabled={sending}
                  >
                    {sending ? t("sending") : t("send")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
