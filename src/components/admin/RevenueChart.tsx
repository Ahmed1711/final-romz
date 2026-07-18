"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import clsx from "clsx";
import { fetchRevenueSeries } from "@/lib/adminApi";
import type { Granularity, RevenuePoint } from "@/lib/api";

export default function RevenueChart() {
  const [granularity, setGranularity] = useState<Granularity>("week");
  const [data, setData] = useState<RevenuePoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchRevenueSeries(granularity)
      .then((series) => {
        if (active) {
          setData(series);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load");
      });
    return () => {
      active = false;
    };
  }, [granularity]);

  return (
    <div className="bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display uppercase text-xl text-navy">
          Revenue Overview
        </h2>
        <div className="flex border-2 border-navy">
          {(["day", "week", "month"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={clsx(
                "px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer",
                granularity === g
                  ? "bg-navy text-white"
                  : "text-navy hover:bg-surface"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-4 text-xs font-bold uppercase text-brand">{error}</p>
      )}

      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="paymobFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F1E3C" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#0F1E3C" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="codFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E11D2E" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#E11D2E" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#0F1E3C" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              formatter={(value) => `${Number(value).toLocaleString()} EGP`}
              contentStyle={{ border: "2px solid #0F1E3C", fontSize: 12 }}
            />
            <Legend
              formatter={(value: string) => (
                <span className="text-xs font-bold uppercase text-navy">
                  {value}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="paymob"
              name="Paymob"
              stroke="#0F1E3C"
              strokeWidth={2.5}
              fill="url(#paymobFill)"
            />
            <Area
              type="monotone"
              dataKey="cod"
              name="COD"
              stroke="#E11D2E"
              strokeWidth={2.5}
              fill="url(#codFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
