import clsx from "clsx";

/**
 * Official ROMZ lockup: the geometric "R" mark from the brand book
 * (extracted from ROMZ BRANDING VOL1) next to the wordmark.
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
        "logo-3d group inline-flex items-center gap-[0.3em] font-display uppercase leading-none tracking-wide",
        light ? "text-white" : "text-navy",
        className
      )}
    >
      {withMark && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={light ? "/brand/romz-mark-white.png" : "/brand/romz-mark.png"}
          alt=""
          aria-hidden
          className={clsx("logo-3d-mark shrink-0 select-none", markClassName)}
        />
      )}
      <span className="transition-colors duration-300 group-hover:text-brand">
        ROMZ
      </span>
    </span>
  );
}
