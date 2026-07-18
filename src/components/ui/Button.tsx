import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "white" | "navy";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  outline:
    "border-2 border-navy text-navy hover:bg-navy hover:text-white bg-transparent",
  white: "bg-white text-navy hover:bg-surface",
  navy: "bg-navy text-white hover:bg-navy-deep",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-7 py-3 text-sm",
  lg: "px-12 py-4 text-lg",
};

/** Class builder so links can look like buttons too. */
export function btn(variant: Variant = "primary", size: Size = "md", className?: string) {
  return clsx(
    "romz-cta skew-cta inline-block cursor-pointer font-display uppercase active:scale-95 motion-reduce:active:scale-100 text-center select-none",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    className
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={btn(variant, size, className)} {...props}>
      <span>{children}</span>
    </button>
  );
}
