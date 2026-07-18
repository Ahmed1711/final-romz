// Helpers that derive option lists (sizes, colors) from product data.
//
// The backend has no enum endpoint, so sizes and colors are computed from the
// variants the API actually returns — nothing is hardcoded except the canonical
// apparel size ordering below (sizes have an inherent order that isn't
// alphabetical). Any size the backend introduces that isn't listed here still
// shows up; it's just appended after the known sizes.

import type { Product, ProductColor } from "./types";

/** Standard apparel sizes offered to the admin to pick from (in order). */
export const SIZE_OPTIONS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const SIZE_ORDER = SIZE_OPTIONS;

/** Dedupes and sorts sizes by the canonical apparel order (unknowns last). */
export function orderSizes(sizes: string[]): string[] {
  const seen = new Set<string>();
  const unique = sizes.filter((s) => {
    const key = s.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

/** Distinct colors of a single product, keyed by hex. */
export function productColors(product: Product): ProductColor[] {
  return [
    ...new Map(
      product.variants
        .filter((v) => v.color.hex)
        .map((v) => [
          v.color.hex.toLowerCase(),
          { ...v.color, hex: v.color.hex.toLowerCase() },
        ])
    ).values(),
  ];
}

const normHex = (value?: string) => value?.trim().toLowerCase() ?? "";

const imageMatchesColor = (imageColor: string | undefined, colorHex: string) =>
  normHex(imageColor) === normHex(colorHex);

/**
 * Expands a product into one card per color while keeping the original product
 * data shape. Each expanded card reorders images so its color image is first,
 * which lets ProductCard keep its existing hover/swatch logic unchanged.
 */
export function productColorCards(product: Product): Product[] {
  const colors = productColors(product);
  if (colors.length <= 1) return [product];

  return colors.map((color) => {
    const matching = product.images.filter((image) =>
      imageMatchesColor(image.color, color.hex)
    );
    const rest = product.images.filter(
      (image) => !imageMatchesColor(image.color, color.hex)
    );
    const images = matching.length > 0 ? [...matching, ...rest] : product.images;

    return {
      ...product,
      id: `${product.id}-${color.hex}`,
      images,
    };
  });
}

export function expandProductsByColor(products: Product[]): Product[] {
  return products.flatMap(productColorCards);
}

/** Distinct colors across a set of products, keyed by hex. */
export function colorsFromProducts(products: Product[]): ProductColor[] {
  return [
    ...new Map(
      products
        .flatMap((p) => p.variants)
        .filter((v) => v.color.hex)
        .map((v) => [
          v.color.hex.toLowerCase(),
          { ...v.color, hex: v.color.hex.toLowerCase() },
        ])
    ).values(),
  ];
}

/** Distinct sizes across a set of products, in canonical order. */
export function sizesFromProducts(products: Product[]): string[] {
  return orderSizes(products.flatMap((p) => p.variants).map((v) => v.size));
}
