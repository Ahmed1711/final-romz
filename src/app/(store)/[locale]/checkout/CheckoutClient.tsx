"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, CreditCard, Banknote, Lock, Truck } from "lucide-react";
import clsx from "clsx";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import Button, { btn } from "@/components/ui/Button";
import { formatEGP, lt } from "@/lib/format";
import {
  ApiError,
  createOrder,
  createPaymentIntent,
  paymentRedirectUrl,
  validateCart,
  type ValidatedCart,
} from "@/lib/api";
import { savePendingOrder } from "@/lib/payment";
import type { Locale, ShippingZone, StorefrontSettings } from "@/lib/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");

interface FormState {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  governorate: string;
  phone: string;
  payment: "paymob" | "cod";
}

const initialForm: FormState = {
  email: "",
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  governorate: "",
  phone: "",
  payment: "cod",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display uppercase text-2xl text-navy">
        {title}
      </h2>
      <div className="mb-6 mt-2 h-1 w-14 bg-brand" />
      {children}
    </section>
  );
}

const inputCls =
  "w-full border-0 border-b-2 border-navy/30 bg-transparent px-1 py-2.5 text-sm text-navy placeholder:text-muted outline-none focus:border-brand transition-colors";

const checkoutErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "Cannot reach the server. Please check that the backend is running and try again.";
    }
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

const needsLoginForOrder = (error: unknown) => {
  if (!(error instanceof ApiError)) return false;
  const message = error.message.toLowerCase();
  return (
    error.status === 401 ||
    error.status === 403 ||
    message.includes("cannot access this order") ||
    message.includes("access this order")
  );
};

const couponRequirementMessage = (error: unknown, locale: Locale) => {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== "object") {
    return null;
  }
  const data = error.data as Record<string, unknown>;
  const subtotal =
    typeof data.subtotal === "number" ? data.subtotal : Number(data.subtotal);
  const minOrderTotal =
    typeof data.minOrderTotal === "number"
      ? data.minOrderTotal
      : Number(data.minOrderTotal);

  if (!Number.isFinite(subtotal) || !Number.isFinite(minOrderTotal)) {
    return null;
  }

  return `Coupon requires minimum order of ${formatEGP(
    minOrderTotal,
    locale
  )}. Current backend subtotal is ${formatEGP(subtotal, locale)}.`;
};

export default function CheckoutClient({
  zones,
  settings,
}: {
  zones: ShippingZone[];
  settings: StorefrontSettings;
}) {
  const t = useTranslations("checkout");
  const locale = useLocale() as Locale;
  const { items, clear } = useCart();
  const { authRequest } = useAuth();
  const submittingRef = useRef(false);
  const paymobActive = settings.payments.paymob.active;

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [validatedCart, setValidatedCart] = useState<ValidatedCart | null>(null);
  const [validatingCart, setValidatingCart] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<string | null>(null);
  const [confirmedInfo, setConfirmedInfo] = useState({ name: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loginRequiredOrder, setLoginRequiredOrder] = useState<{
    orderNumber: string;
    contact: string;
  } | null>(null);

  // Only active zones can be shipped to — inactive zones are hidden from checkout.
  const activeZones = useMemo(() => zones.filter((z) => z.isActive), [zones]);
  const zone = activeZones.find((z) => z.id === form.governorate);
  const backendTotal = validatedCart?.total ?? 0;
  const shippingFee =
    zone && validatedCart
      ? settings.freeShippingThreshold !== null &&
        backendTotal >= settings.freeShippingThreshold
        ? 0
        : zone.fee
      : null;
  const total = validatedCart ? Math.max(backendTotal + (shippingFee ?? 0), 0) : 0;

  const validationItems = useMemo(
    () =>
      items.map((item) => ({
        product: item.productId,
        variantId: item.variantId || undefined,
        sku: item.sku,
        qty: item.qty,
      })),
    [items]
  );

  const set = (key: keyof FormState, value: string) => {
    setLoginRequiredOrder(null);
    setSubmitError(null);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validateCurrentCart = useCallback(
    (coupon = appliedCoupon) =>
      authRequest((token) =>
        validateCart(
          {
            items: validationItems,
            couponCode: coupon,
          },
          token
        )
      ),
    [appliedCoupon, authRequest, validationItems]
  );

  useEffect(() => {
    if (validationItems.length === 0) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setValidatingCart(true);
      setValidatedCart(null);
      setValidationError(null);
    });

    validateCurrentCart()
      .then((cart) => {
        if (cancelled) return;
        setValidatedCart(cart);
        setCouponError(null);
        if (!cart.isValid) {
          setValidationError(
            cart.unavailableItems[0]?.reason ?? "Cart has unavailable items."
          );
        }
      })
      .catch((error) => {
        if (cancelled) return;
        const message = checkoutErrorMessage(error, t("orderFailed"));
        setValidatedCart(null);
        setValidationError(message);
        if (appliedCoupon) {
          setAppliedCoupon("");
          setCouponError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setValidatingCart(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appliedCoupon, t, validateCurrentCart, validationItems.length]);

  const applyCoupon = async () => {
    setCouponError(null);
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) return;

    setValidatingCart(true);
    setValidationError(null);
    setValidatedCart(null);

    try {
      const cart = await validateCurrentCart(normalized);
      setValidatedCart(cart);
      setAppliedCoupon(cart.discount.couponCode || normalized);
      if (!cart.isValid) {
        setValidationError(
          cart.unavailableItems[0]?.reason ?? "Cart has unavailable items."
        );
      }
    } catch (error) {
      const message = couponRequirementMessage(error, locale) ??
        checkoutErrorMessage(error, t("invalidCoupon"));
      setAppliedCoupon("");
      setCouponError(message);
      setValidationError(message);

      try {
        const cart = await validateCurrentCart("");
        setValidatedCart(cart);
        setValidationError(
          cart.isValid
            ? null
            : cart.unavailableItems[0]?.reason ?? "Cart has unavailable items."
        );
      } catch {
        // Keep the coupon error visible; checkout stays blocked until revalidated.
      }
    } finally {
      setValidatingCart(false);
    }
  };

  const submit = async () => {
    if (submittingRef.current || loginRequiredOrder) return;

    const required: (keyof FormState)[] = [
      "email",
      "firstName",
      "lastName",
      "address",
      "city",
      "governorate",
      "phone",
    ];
    const newErrors: typeof errors = {};
    for (const key of required) if (!form[key].trim()) newErrors[key] = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    if (submitting) return;
    if (validatingCart || !validatedCart || validationError || !validatedCart.isValid) {
      setSubmitError(validationError ?? t("cartValidating"));
      return;
    }
    if (!zone) {
      setSubmitError(t("shippingUnavailable"));
      return;
    }
    if (form.payment === "paymob" && !paymobActive) {
      set("payment", "cod");
      setSubmitError(t("cardUnavailable"));
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    setLoginRequiredOrder(null);

    const customer = {
      name: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };
    // Contact used for order tracking on the callback page (phone preferred).
    const contact = customer.phone || customer.email;

    try {
      // Order-first flow: create the order (COD or Paymob) before any payment.
      const order = await authRequest((token) =>
        createOrder(
          {
            customer,
            shippingAddress: {
              // The backend matches the governorate by its English name.
              governorate: zone.governorate.en,
              city: form.city,
              street: form.address,
              // Optional on the backend; omit when the customer leaves it blank.
              apartment: form.apartment.trim() || undefined,
            },
            items: validatedCart.items.map((item) => ({
              product: item.product,
              variantId: item.variantId,
              qty: item.qty,
            })),
            couponCode: validatedCart.discount.couponCode || undefined,
            paymentMethod: form.payment,
          },
          token
        )
      );

      if (form.payment === "paymob") {
        // Step 2: exchange the order id for a Paymob checkout/iframe URL.
        let intent;
        try {
          intent = await authRequest((token) =>
            createPaymentIntent(
              {
                orderId: order.id,
                contact,
                redirectionUrl: `${window.location.origin}/${locale}/payment/callback`,
                notificationUrl: `${API_URL}/payments/paymob/webhook`,
                customer,
              },
              token
            )
          );
        } catch (error) {
          if (needsLoginForOrder(error)) {
            savePendingOrder({ orderNumber: order.orderNumber, contact });
            setLoginRequiredOrder({ orderNumber: order.orderNumber, contact });
            setSubmitError(t("loginRequiredAfterOrder"));
            clear();
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
          throw error;
        }
        const redirect = paymentRedirectUrl(intent);
        if (!redirect) throw new Error(t("paymentUrlMissing"));

        // Stash order number + contact so the callback page can poll the
        // backend (the single source of truth) for the real payment status.
        savePendingOrder({ orderNumber: order.orderNumber, contact });
        clear();
        window.location.assign(redirect);
        return;
      }

      // COD: order is confirmed immediately.
      setConfirmedInfo({ name: form.firstName, email: form.email });
      setConfirmedOrder(order.orderNumber);
      clear();
      window.scrollTo({ top: 0 });
    } catch (error) {
      console.error("Checkout failed", error);
      const couponMessage = couponRequirementMessage(error, locale);
      if (couponMessage) {
        setAppliedCoupon("");
        setCouponError(couponMessage);
        setSubmitError(couponMessage);
        try {
          const refreshed = await validateCurrentCart("");
          setValidatedCart(refreshed);
          setValidationError(
            refreshed.isValid
              ? null
              : refreshed.unavailableItems[0]?.reason ?? "Cart has unavailable items."
          );
        } catch {
          // The original order error is clearer for the customer here.
        }
      } else {
        setSubmitError(checkoutErrorMessage(error, t("orderFailed")));
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const summaryItems = validatedCart?.items ?? [];

  if (confirmedOrder) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display uppercase text-4xl text-navy">
          {t("confirmedTitle")}
        </h1>
        <div className="mx-auto mt-3 h-1 w-16 bg-brand" />
        <p className="mt-6 text-muted">
          {t("confirmedBody", {
            name: confirmedInfo.name,
            email: confirmedInfo.email,
          })}
        </p>
        <div className="mt-8 border-2 border-navy/10 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            {t("orderNumber")}
          </p>
          <p className="mt-1 font-display text-3xl text-brand">{confirmedOrder}</p>
        </div>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/track-order" className={btn("primary", "md")}>
            <span>{t("trackCta")}</span>
          </Link>
          <Link href="/" className={btn("outline", "md")}>
            <span>{t("backHome")}</span>
          </Link>
        </div>
      </div>
    );
  }

  if (loginRequiredOrder) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <AlertCircle size={48} className="mx-auto text-brand" />
        <h1 className="mt-6 font-display uppercase text-3xl text-navy">
          {t("orderCreatedLoginTitle")}
        </h1>
        <p className="mt-4 text-muted">{t("orderCreatedLoginBody")}</p>
        <div className="mt-8 border-2 border-navy/10 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            {t("orderNumber")}
          </p>
          <p className="mt-1 font-display text-3xl text-brand">
            {loginRequiredOrder.orderNumber}
          </p>
        </div>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/account/login" className={btn("primary", "md")}>
            <span>{t("signInToPay")}</span>
          </Link>
          <Link href="/track-order" className={btn("outline", "md")}>
            <span>{t("trackCta")}</span>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-muted">{t("emptyCart")}</p>
        <Link href="/" className={btn("primary", "md", "mt-6")}>
          <span>{t("backHome")}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_420px] lg:py-14">
      {/* ── Left column ── */}
      <div className="space-y-10">
        <Section title={t("contact")}>
          <input
            type="email"
            placeholder={t("email")}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={clsx(inputCls, errors.email && "border-brand")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-brand">{t("required")}</p>
          )}
        </Section>

        <Section title={t("delivery")}>
          <div className="space-y-5">
            <select disabled className={clsx(inputCls, "appearance-none opacity-70")}>
              <option>{t("country")}</option>
            </select>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <input
                  placeholder={t("firstName")}
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  className={clsx(inputCls, errors.firstName && "border-brand")}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-brand">{t("required")}</p>
                )}
              </div>
              <div>
                <input
                  placeholder={t("lastName")}
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  className={clsx(inputCls, errors.lastName && "border-brand")}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-brand">{t("required")}</p>
                )}
              </div>
            </div>
            <div>
              <input
                placeholder={t("address")}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className={clsx(inputCls, errors.address && "border-brand")}
              />
              {errors.address && (
                <p className="mt-1 text-xs text-brand">{t("required")}</p>
              )}
            </div>
            <div>
              <input
                placeholder={t("apartment")}
                value={form.apartment}
                onChange={(e) => set("apartment", e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <input
                  placeholder={t("city")}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  className={clsx(inputCls, errors.city && "border-brand")}
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-brand">{t("required")}</p>
                )}
              </div>
              <div>
                <select
                  value={form.governorate}
                  onChange={(e) => set("governorate", e.target.value)}
                  className={clsx(
                    inputCls,
                    "bg-transparent",
                    errors.governorate && "border-brand"
                  )}
                >
                  <option value="">{t("governorate")}</option>
                  {activeZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {lt(z.governorate, locale)}
                    </option>
                  ))}
                </select>
                {errors.governorate && (
                  <p className="mt-1 text-xs text-brand">{t("required")}</p>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 border-b-2 border-navy/30 focus-within:border-brand transition-colors">
                <span className="text-lg">🇪🇬</span>
                <input
                  placeholder={t("phone")}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="w-full border-0 bg-transparent px-1 py-2.5 text-sm text-navy placeholder:text-muted outline-none"
                  dir="ltr"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-brand">{t("required")}</p>
              )}
            </div>
          </div>
        </Section>

        <Section title={t("shippingMethod")}>
          {activeZones.length === 0 ? (
            <div className="flex items-center gap-3 border-2 border-navy/10 bg-surface px-4 py-3.5 text-sm text-muted">
              <Truck size={20} className="shrink-0" />
              <span>{t("noShippingZones")}</span>
            </div>
          ) : !zone ? (
            <div className="flex items-center gap-3 border-2 border-dashed border-navy/25 bg-white px-4 py-3.5 text-sm text-muted">
              <Truck size={20} className="shrink-0" />
              <span>{t("selectGovernorate")}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between border-2 border-brand bg-white px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand/10 text-brand">
                  <Truck size={20} />
                </span>
                <div className="text-start">
                  <p className="text-sm font-bold text-navy">
                    {lt(zone.governorate, locale)}
                  </p>
                  <p className="text-xs text-muted">
                    {t("shippingDays", { days: zone.estimatedDays })}
                  </p>
                </div>
              </div>
              <span
                className={clsx(
                  "text-sm font-extrabold",
                  shippingFee === 0 ? "text-brand" : "text-navy"
                )}
              >
                {shippingFee !== null
                  ? shippingFee === 0
                    ? t("freeShipping")
                    : formatEGP(shippingFee, locale)
                  : "—"}
              </span>
            </div>
          )}
        </Section>

        <Section title={t("payment")}>
          <div className="space-y-3">
            {paymobActive ? (
              <button
                type="button"
                onClick={() => set("payment", "paymob")}
                className={clsx(
                  "flex w-full items-center justify-between border-2 bg-white px-4 py-3.5 cursor-pointer transition-colors",
                  form.payment === "paymob" ? "border-brand" : "border-navy/15"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2",
                      form.payment === "paymob" ? "border-brand" : "border-navy/30"
                    )}
                  >
                    {form.payment === "paymob" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                    )}
                  </span>
                  <div className="text-start">
                    <p className="text-sm font-bold text-navy">{t("card")}</p>
                    <p className="text-xs text-muted">{t("cardNote")}</p>
                  </div>
                </div>
                <CreditCard size={20} className="text-navy" />
              </button>
            ) : (
              <div className="flex w-full items-center justify-between border-2 border-navy/10 bg-surface px-4 py-3.5 text-muted">
                <div className="text-start">
                  <p className="text-sm font-bold text-navy">{t("card")}</p>
                  <p className="text-xs">{t("cardUnavailable")}</p>
                </div>
                <CreditCard size={20} />
              </div>
            )}

            <button
              type="button"
              onClick={() => set("payment", "cod")}
              className={clsx(
                "flex w-full items-center justify-between border-2 bg-white px-4 py-3.5 cursor-pointer transition-colors",
                form.payment === "cod" ? "border-brand" : "border-navy/15"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2",
                    form.payment === "cod" ? "border-brand" : "border-navy/30"
                  )}
                >
                  {form.payment === "cod" && (
                    <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                  )}
                </span>
                <p className="text-sm font-bold text-navy">{t("cod")}</p>
              </div>
              <Banknote size={20} className="text-navy" />
            </button>
          </div>
        </Section>
      </div>

      {/* ── Order summary ── */}
      <aside className="h-fit bg-navy p-6 text-white lg:sticky lg:top-24">
        <h2 className="font-display uppercase text-2xl">
          {t("orderSummary")}
        </h2>

        <div className="mt-6 space-y-4">
          {summaryItems.map((item) => (
            <div key={item.variantId} className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 bg-white/10">
                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                <span className="absolute -top-2 -end-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-extrabold">
                  {item.qty}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase">
                  {lt(item.productName, locale)}
                </p>
                <p className="text-[11px] text-white/60">
                  {item.size} / {item.colorName}
                </p>
              </div>
              <span className="text-sm font-bold">
                {formatEGP(item.lineTotal, locale)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2 border-t border-white/15 pt-6">
          <input
            placeholder={t("discountCode")}
            value={couponCode}
            onChange={(e) => {
              const next = e.target.value;
              setCouponCode(next);
              setCouponError(null);
              if (appliedCoupon && next.trim().toUpperCase() !== appliedCoupon) {
                setAppliedCoupon("");
              }
            }}
            className="w-full border border-white/25 bg-transparent px-3 py-2 text-sm placeholder:text-white/40 outline-none focus:border-brand"
          />
          <button
            onClick={applyCoupon}
            disabled={validatingCart || !couponCode.trim()}
            className="shrink-0 bg-brand px-4 py-2 text-sm font-extrabold uppercase hover:bg-brand-dark transition-colors cursor-pointer disabled:opacity-60"
          >
            {validatingCart && appliedCoupon ? "..." : t("apply")}
          </button>
        </div>
        {couponError && (
          <p className="mt-2 text-xs text-brand">{couponError}</p>
        )}
        {validatingCart && (
          <p className="mt-2 text-xs text-white/60">{t("cartValidating")}</p>
        )}
        {validationError && !validatingCart && (
          <div className="mt-3 border-2 border-brand/50 bg-white px-3 py-2 text-xs text-brand">
            <p className="font-extrabold uppercase">{t("checkoutErrorTitle")}</p>
            <p className="mt-1">{validationError}</p>
            {validatedCart?.unavailableItems.map((item, index) => (
              <p key={`${item.variantId ?? item.sku ?? index}`} className="mt-1">
                {item.sku ? `${item.sku}: ` : ""}
                {item.reason}
              </p>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-2 border-t border-white/15 pt-6 text-sm">
          <div className="flex justify-between text-white/80">
            <span>{t("subtotal")}</span>
            <span>
              {validatedCart ? formatEGP(validatedCart.subtotal, locale) : "..."}
            </span>
          </div>
          <div className="flex justify-between text-white/80">
            <span>{t("shipping")}</span>
            <span>
              {zone && shippingFee !== null
                ? shippingFee === 0
                  ? t("freeShipping")
                  : formatEGP(shippingFee ?? 0, locale)
                : "—"}
            </span>
          </div>
          {(validatedCart?.discount.amount ?? 0) > 0 && (
            <div className="flex justify-between text-brand">
              <span>{t("discount")}</span>
              <span>-{formatEGP(validatedCart?.discount.amount ?? 0, locale)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 text-lg font-extrabold">
            <span>{t("total")}</span>
            <span>{validatedCart ? formatEGP(total, locale) : "..."}</span>
          </div>
        </div>

        <Button
          size="lg"
          className="mt-6 w-full"
          onClick={submit}
          disabled={
            submitting ||
            validatingCart ||
            !validatedCart ||
            Boolean(validationError) ||
            !validatedCart.isValid ||
            Boolean(loginRequiredOrder)
          }
          aria-busy={submitting || validatingCart}
        >
          {submitting ? "…" : t("payNow")}
        </Button>
        {submitError && (
          <div
            role="alert"
            className="mt-3 flex gap-3 border-2 border-brand/50 bg-white px-4 py-3 text-start text-sm text-brand"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-extrabold uppercase">{t("checkoutErrorTitle")}</p>
              <p className="mt-1 text-xs leading-relaxed">{submitError}</p>
            </div>
          </div>
        )}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/60">
          <Lock size={12} />
          {t("secure")}
        </p>
      </aside>
    </div>
  );
}
