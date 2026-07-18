import Link from "next/link";
import { Plus } from "lucide-react";
import clsx from "clsx";
import { getProducts } from "@/lib/api";
import ProductRowActions from "./ProductRowActions";

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display uppercase text-2xl text-navy">
          Products
        </h1>
        <Link
          href="/admin/products/new"
          className="skew-cta flex items-center gap-2 bg-brand px-5 py-2.5 text-sm font-display uppercase tracking-wider text-white hover:bg-brand-dark transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Plus size={16} /> Add Product
          </span>
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b-2 border-navy text-[11px] font-extrabold uppercase tracking-wider text-muted">
              <th className="px-4 py-3 text-start">Product</th>
              <th className="px-4 py-3 text-start">Category</th>
              <th className="px-4 py-3 text-end">Price</th>
              <th className="px-4 py-3 text-end">Total Stock</th>
              <th className="px-4 py-3 text-start">Badges</th>
              <th className="px-4 py-3 text-end">Sold</th>
              <th className="px-4 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
              const hasSale = p.salePrice !== null && p.salePrice !== undefined;
              return (
                <tr key={p.id} className="border-b border-navy/5 hover:bg-brand/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="flex items-center gap-3"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images[0]?.url}
                        alt=""
                        className="h-11 w-11 bg-surface object-cover"
                      />
                      <div>
                        <p className="font-extrabold uppercase text-navy hover:text-brand">
                          {p.name.en}
                        </p>
                        <p className="font-mono text-xs text-muted">{p.slug}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 uppercase text-muted">{p.category}</td>
                  <td className="px-4 py-3 text-end">
                    {hasSale ? (
                      <>
                        <span className="font-extrabold text-brand">
                          {p.salePrice!.toLocaleString()}
                        </span>{" "}
                        <span className="text-xs text-muted line-through">
                          {p.basePrice.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="font-extrabold text-navy">
                        {p.basePrice.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td
                    className={clsx(
                      "px-4 py-3 text-end font-display",
                      totalStock <= 10 ? "text-brand" : "text-navy"
                    )}
                  >
                    {totalStock}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.badges.map((b) => (
                        <span
                          key={b}
                          className={clsx(
                            "px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white",
                            b === "best-seller" ? "bg-navy" : "bg-brand"
                          )}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-end text-navy">{p.sold}</td>
                  <td className="px-4 py-3">
                    <ProductRowActions id={p.id} name={p.name.en} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
