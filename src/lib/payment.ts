// Client-side handoff between checkout and the Paymob callback page.
//
// The backend is the single source of truth for payment status. We only stash
// the order number + a contact value locally so the callback page can poll
// GET /orders/track — we never trust Paymob's redirect query params.

export const PENDING_ORDER_KEY = "romz_pending_order";

export interface PendingOrder {
  orderNumber: string;
  /** Customer phone or email — used as the `contact` for order tracking. */
  contact: string;
}

export function savePendingOrder(order: PendingOrder) {
  try {
    window.localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(order));
  } catch {
    // storage unavailable (private mode) — the callback page will prompt.
  }
}

export function readPendingOrder(): PendingOrder | null {
  try {
    const raw = window.localStorage.getItem(PENDING_ORDER_KEY);
    return raw ? (JSON.parse(raw) as PendingOrder) : null;
  } catch {
    return null;
  }
}

export function clearPendingOrder() {
  try {
    window.localStorage.removeItem(PENDING_ORDER_KEY);
  } catch {
    // ignore
  }
}
