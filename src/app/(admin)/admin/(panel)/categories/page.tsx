import { getCategories, getProducts } from "@/lib/api";
import CategoriesClient from "./CategoriesClient";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();
  const products = await getProducts();

  const productCounts: Record<string, number> = {};
  for (const p of products) {
    // Count a product under every category it belongs to (primary + extras).
    for (const slug of p.categories) {
      productCounts[slug] = (productCounts[slug] ?? 0) + 1;
    }
  }

  return (
    <CategoriesClient categories={categories} productCounts={productCounts} />
  );
}
