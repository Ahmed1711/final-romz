# ROMZ — Fashion E-Commerce Frontend

Bold sporty men's athletic-wear store for the Egyptian market. Next.js App Router + TypeScript + Tailwind v4 + next-intl (Arabic RTL / English LTR).

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Routes

| URL | Page |
|---|---|
| `/en` , `/ar` | Storefront home (hero, new arrivals, categories, best sellers, reviews, FAQ) |
| `/{locale}/category/[slug]` | Product listing + size/color filters + sort |
| `/{locale}/product/[slug]` | Product detail, variant selector (stock-aware), add to cart |
| `/{locale}/checkout` | Checkout (contact, delivery, shipping zones, Paymob/COD, coupon) |
| `/{locale}/track-order` | Order tracking — try `RZ-2026-00153` + `+20 100 123 4567` |
| `/admin` | Dashboard analytics (KPIs, revenue chart, best sellers, coupons, low stock) |
| `/admin/orders` | Orders table + detail side panel |
| `/admin/products` , `/admin/products/p1` | Products list + bilingual product editor with variants |

## Architecture notes

- **`src/lib/api.ts`** — the ONLY place the UI gets data. Currently returns mock data
  from `src/lib/mock/`. When the Express backend is ready, replace each function body
  with a `fetch()` call — no page/component changes needed.
- **`src/lib/types.ts`** — the API contract. Share this with the backend developer;
  it mirrors the Mongoose models from the project plan.
- **i18n** — `src/messages/{en,ar}.json`, routing in `src/i18n/`. RTL comes from
  `dir` on `<html>`; always use logical Tailwind classes (`ms-`, `me-`, `start-`, `end-`).
- **Design system** — tokens in `src/app/globals.css` (`--color-brand #E11D2E`,
  `--color-navy #0F1E3C`, fonts Anton/Manrope/Cairo). Signature motifs are utility
  classes: `.skew-cta`, `.ghost-text`, `.clip-diagonal-*`.
- **Cart** — client-side context + localStorage (`src/components/cart/CartProvider.tsx`).
- Product photos are SVG placeholders in `public/products/` — replace with real
  photography, keeping the same file paths or updating `src/lib/mock/products.ts`.

## Not wired yet (needs backend)

- Real auth (login/register/OTP), Paymob redirect, order creation API,
  admin mutations (save product writes are mocked), search page.
