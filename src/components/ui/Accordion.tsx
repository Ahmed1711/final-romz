"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";

export interface AccordionItem {
  title: string;
  content: ReactNode;
}

export default function Accordion({
  items,
  className,
}: {
  items: AccordionItem[];
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className={clsx("divide-y divide-navy/10", className)}>
      {items.map((item, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 py-4 text-start cursor-pointer"
          >
            <span className="font-bold uppercase tracking-wide text-navy text-sm md:text-base">
              {item.title}
            </span>
            <Plus
              size={20}
              className={clsx(
                "shrink-0 text-brand transition-transform",
                open === i && "rotate-45"
              )}
            />
          </button>
          {open === i && (
            <div className="pb-4 text-sm leading-relaxed text-muted">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
