import clsx from "clsx";
import ProductCard from "./ProductCard";
import Reveal from "@/components/motion/Reveal";
import { expandProductsByColor } from "@/lib/product";
import type { Product } from "@/lib/types";

export default function ProductGrid({
  products,
  columns = 4,
  className,
}: {
  products: Product[];
  columns?: 3 | 4;
  className?: string;
}) {
  const cards = expandProductsByColor(products);

  return (
    <div
      className={clsx(
        "grid grid-cols-2 gap-4 md:gap-6",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        className
      )}
    >
      {cards.map((p, i) => (
        <Reveal key={p.id} delay={Math.min(i, 7) * 0.06}>
          <ProductCard product={p} />
        </Reveal>
      ))}
    </div>
  );
}
