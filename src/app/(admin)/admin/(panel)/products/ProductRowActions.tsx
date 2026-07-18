"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { deleteProduct } from "@/lib/adminApi";

export default function ProductRowActions({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!window.confirm(`Delete "${name}"? It will disappear from the store.`)) return;
    setBusy(true);
    try {
      await deleteProduct(id);
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/products/${id}`}
        aria-label={`Edit ${name}`}
        className="p-2 text-muted hover:text-navy transition-colors"
      >
        <Pencil size={15} />
      </Link>
      <button
        onClick={remove}
        disabled={busy}
        aria-label={`Delete ${name}`}
        className="p-2 text-muted hover:text-brand transition-colors cursor-pointer disabled:opacity-40"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
