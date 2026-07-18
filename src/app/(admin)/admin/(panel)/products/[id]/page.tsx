import { notFound } from "next/navigation";
import { getCategories, getProductById } from "@/lib/api";
import { adminCall } from "@/lib/adminAuth";
import ProductEditor from "./ProductEditor";
import type { Product } from "@/lib/types";

const blankProduct: Product = {
  id: "",
  slug: "",
  name: { en: "", ar: "" },
  description: { en: "", ar: "" },
  category: "",
  categories: [],
  basePrice: 0,
  salePrice: undefined,
  images: [],
  variants: [],
  badges: [],
  ratingAvg: 0,
  ratingCount: 0,
  sold: 0,
};

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categories = await getCategories();

  if (id === "new") {
    return (
      <ProductEditor product={blankProduct} categories={categories} mode="create" />
    );
  }

  const product = await adminCall((token) => getProductById(id, token));
  if (!product) notFound();

  return <ProductEditor product={product} categories={categories} mode="edit" />;
}
