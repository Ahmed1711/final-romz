"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Order } from "@/lib/types";

interface CustomerRow {
  key: string;
  name: string;
  phone: string;
  email: string;
  governorate: string;
  orders: number;
  spent: number;
  lastOrderAt: string;
}

export default function CustomersClient({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState("");
  const [governorate, setGovernorate] = useState("all");

  const customers = useMemo(() => {
    const map = new Map<string, CustomerRow>();
    for (const order of orders) {
      const key =
        order.customer.email ||
        order.customer.phone ||
        `${order.customer.name}-${order.id}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          name: order.customer.name,
          phone: order.customer.phone,
          email: order.customer.email,
          governorate: order.shippingAddress.governorate,
          orders: 1,
          spent: order.total,
          lastOrderAt: order.createdAt,
        });
        continue;
      }
      existing.orders += 1;
      existing.spent += order.total;
      if (new Date(order.createdAt) > new Date(existing.lastOrderAt)) {
        existing.lastOrderAt = order.createdAt;
        existing.governorate = order.shippingAddress.governorate;
      }
    }
    return [...map.values()].sort(
      (a, b) =>
        new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
    );
  }, [orders]);

  const governorates = useMemo(
    () =>
      [...new Set(customers.map((c) => c.governorate).filter(Boolean))].sort(),
    [customers]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const compactNeedle = needle.replace(/\s/g, "");
    return customers.filter((customer) => {
      if (governorate !== "all" && customer.governorate !== governorate) {
        return false;
      }
      if (!needle) return true;
      const phone = customer.phone.replace(/\s/g, "");
      return (
        customer.name.toLowerCase().includes(needle) ||
        customer.email.toLowerCase().includes(needle) ||
        phone.includes(compactNeedle)
      );
    });
  }, [customers, governorate, query]);

  return (
    <div className="p-6">
      <h1 className="font-display uppercase text-2xl text-navy">
        Customers
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <select
          value={governorate}
          onChange={(e) => setGovernorate(e.target.value)}
          className="border-2 border-navy/15 bg-white px-3 py-2.5 text-xs font-extrabold uppercase text-navy outline-none focus:border-brand"
        >
          <option value="all">All governorates</option>
          {governorates.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <div className="flex min-w-64 flex-1 items-center gap-2 border-2 border-navy/15 bg-white px-3 py-2.5">
          <Search size={14} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or phone..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b-2 border-navy text-[11px] font-extrabold uppercase tracking-wider text-muted">
              <th className="px-4 py-3 text-start">Name</th>
              <th className="px-4 py-3 text-start">Phone</th>
              <th className="px-4 py-3 text-start">Email</th>
              <th className="px-4 py-3 text-start">Governorate</th>
              <th className="px-4 py-3 text-end">Orders</th>
              <th className="px-4 py-3 text-end">Spent</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.key} className="border-b border-navy/5">
                <td className="px-4 py-3 font-extrabold text-navy">
                  {customer.name}
                </td>
                <td className="px-4 py-3 text-muted" dir="ltr">
                  {customer.phone}
                </td>
                <td className="px-4 py-3 text-muted">{customer.email}</td>
                <td className="px-4 py-3 text-muted">
                  {customer.governorate}
                </td>
                <td className="px-4 py-3 text-end font-display text-navy">
                  {customer.orders}
                </td>
                <td className="px-4 py-3 text-end font-extrabold text-brand">
                  {customer.spent.toLocaleString()} EGP
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 text-xs text-muted">
          <span>
            Showing {filtered.length} of {customers.length} customers
          </span>
        </div>
      </div>
    </div>
  );
}
