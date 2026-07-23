import clsx from "clsx";

/**
 * Official ROMZ lockup: the geometric "R" mark from the brand book
 * (extracted from ROMZ BRANDING VOL1) next to the wordmark.
 *
 * The mark is rendered as a CSS mask filled with `currentColor`, so the mark
 * and the wordmark always share the exact same color (and recolor together on
 * hover) instead of the mark being a fixed-color image.
 */
export default function Logo({
  className,
  light = false,
  markClassName = "h-[1.15em] w-auto",
  withMark = true,
}: {
  className?: string;
  light?: boolean;
  markClassName?: string;
  withMark?: boolean;
}) {
  return (
    <span
      className={clsx(
        "logo-3d group inline-flex items-center gap-[0.3em] font-display uppercase leading-none tracking-wide transition-colors duration-300 hover:text-brand",
        light ? "text-white" : "text-navy",
        className
      )}
    >
      {withMark && (
        <span
          aria-hidden
          className={clsx(
            "logo-3d-mark inline-block shrink-0 select-none",
            markClassName
          )}
          style={{
            aspectRatio: "668 / 372",
            backgroundColor: "currentColor",
            WebkitMaskImage: "url(/brand/romz-mark.png)",
            maskImage: "url(/brand/romz-mark.png)",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      )}
      <span>ROMZ</span>
    </span>
  );
}
