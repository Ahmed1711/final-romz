"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { motion, useReducedMotion } from "motion/react";

type Direction = "up" | "start" | "none";

/**
 * Fade-and-slide entrance wrapper. Slides from the logical start side in
 * "start" mode, so Arabic (RTL) pages animate from the right.
 * `inView={false}` animates on mount instead of on scroll (above-the-fold
 * content like the hero).
 */
export default function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  inView = true,
}: {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  inView?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const locale = useLocale();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset =
    direction === "up"
      ? { y: 28 }
      : direction === "start"
        ? { x: locale === "ar" ? 36 : -36 }
        : {};

  const visible = { opacity: 1, x: 0, y: 0 };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      {...(inView
        ? { whileInView: visible, viewport: { once: true, amount: 0.2 } }
        : { animate: visible })}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
