import clsx from "clsx";

export default function SectionHeading({
  title,
  ghost,
  light = false,
  className,
}: {
  title: string;
  ghost?: string;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx("relative", className)}>
      {ghost && (
        <span
          aria-hidden
          className={clsx(
            "absolute -top-9 start-0 font-display uppercase leading-none text-7xl md:text-9xl whitespace-nowrap",
            light ? "ghost-text-light" : "ghost-text"
          )}
        >
          {ghost}
        </span>
      )}
      <h2
        className={clsx(
          "relative font-display uppercase text-4xl leading-none md:text-5xl",
          light ? "text-white" : "text-navy"
        )}
      >
        {title}
      </h2>
      <div className="relative mt-3 h-1 w-28 bg-brand" />
    </div>
  );
}
