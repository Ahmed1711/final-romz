import { Star } from "lucide-react";
import clsx from "clsx";

export default function Rating({
  value,
  count,
  size = 14,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={
              i <= Math.round(value)
                ? "fill-amber text-amber"
                : "fill-gray-200 text-gray-200"
            }
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-muted">({count})</span>
      )}
    </div>
  );
}
