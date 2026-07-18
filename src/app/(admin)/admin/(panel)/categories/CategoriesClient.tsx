"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import clsx from "clsx";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/adminApi";
import { getCategories } from "@/lib/api";
import { prepareImageUploads } from "@/lib/imageUpload";
import type { Category, ProductImage } from "@/lib/types";

const inputCls =
  "w-full border-2 border-navy/15 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-brand transition-colors";
const labelCls =
  "mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-muted";
const MAX_IMAGE_MB = 15;

interface FormState {
  nameEn: string;
  nameAr: string;
  parentId: string; // "" = top-level
  order: string;
}

const emptyForm: FormState = { nameEn: "", nameAr: "", parentId: "", order: "0" };

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function CategoriesClient({
  categories,
  productCounts,
}: {
  categories: Category[];
  productCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [categoryList, setCategoryList] = useState(categories);
  // null = closed, "new" = creating, otherwise the id being edited
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<ProductImage | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageRemoved, setImageRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    []
  );

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  };

  const resetImageState = (image: ProductImage | null = null) => {
    revokeObjectUrl();
    setImageFile(null);
    setImageRemoved(false);
    setExistingImage(image);
    setImagePreview(image?.url ?? "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Top-level categories can be chosen as a parent (one level of nesting).
  const topLevel = useMemo(
    () =>
      [...categoryList]
        .filter((c) => !c.parentId)
        .sort((a, b) => a.order - b.order),
    [categoryList]
  );
  const childrenOf = (id: string) =>
    [...categoryList]
      .filter((c) => c.parentId === id)
      .sort((a, b) => a.order - b.order);

  const openNew = () => {
    setForm(emptyForm);
    resetImageState();
    setError(null);
    setEditing("new");
  };

  const openEdit = (cat: Category) => {
    setForm({
      nameEn: cat.name.en,
      nameAr: cat.name.ar,
      parentId: cat.parentId ?? "",
      order: String(cat.order ?? 0),
    });
    resetImageState(cat.image ?? null);
    setError(null);
    setEditing(cat.id);
  };

  const close = () => {
    setEditing(null);
    resetImageState();
    setError(null);
  };

  const chooseImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(`${file.name} is not an image.`);
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`${file.name} is over ${MAX_IMAGE_MB}MB.`);
      return;
    }
    revokeObjectUrl();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImageFile(file);
    setImageRemoved(false);
    setImagePreview(url);
    setError(null);
  };

  const clearSelectedImage = () => {
    revokeObjectUrl();
    setImageFile(null);
    setImagePreview(imageRemoved ? "" : existingImage?.url ?? "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = () => {
    revokeObjectUrl();
    setImageFile(null);
    setImageRemoved(true);
    setExistingImage(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async () => {
    if (!form.nameEn.trim()) {
      setError("English name is required.");
      return;
    }
    const slug = slugify(form.nameEn);
    const order = Number.parseInt(form.order, 10);
    if (!Number.isFinite(order) || order < 0) {
      setError("Order must be 0 or higher.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const [preparedImage] = imageFile
        ? await prepareImageUploads([imageFile], { maxFiles: 1 })
        : [];
      const payload = {
        name: { en: form.nameEn.trim(), ar: form.nameAr.trim() || form.nameEn.trim() },
        slug,
        parent: form.parentId || null,
        order,
        ...(preparedImage ? { imageFile: preparedImage } : {}),
        ...(imageRemoved ? { removeImage: true } : {}),
      };
      if (editing === "new") {
        await createCategory(payload);
      } else if (editing) {
        await updateCategory(editing, payload);
      }
      setCategoryList(await getCategories());
      close();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (cat: Category) => {
    const count = productCounts[cat.slug] ?? 0;
    const subs = childrenOf(cat.id).length;
    const parts = [`Delete "${cat.name.en}"?`];
    if (subs > 0) parts.push(`${subs} subcategor${subs === 1 ? "y" : "ies"} will be orphaned.`);
    if (count > 0)
      parts.push(`${count} product(s) still point to it and will lose their category on the storefront.`);
    if (!window.confirm(parts.join(" "))) return;
    setBusy(true);
    try {
      await deleteCategory(cat.id);
      setCategoryList(await getCategories());
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  const CategoryCard = ({ cat, isSub }: { cat: Category; isSub?: boolean }) => (
    <div
      className={clsx(
        "bg-white p-5 shadow-sm",
        isSub ? "border-s-4 border-brand/40" : "border-t-4 border-navy"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-surface">
            {cat.image?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cat.image.url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <ImagePlus size={18} className="text-muted" />
            )}
          </div>
          <div className="min-w-0">
          <p
            className={clsx(
              "font-display uppercase text-navy",
              isSub ? "text-lg" : "text-xl"
            )}
          >
            {cat.name.en}
          </p>
          <p className="text-sm text-muted" dir="rtl">
            {cat.name.ar}
          </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => openEdit(cat)}
            aria-label={`Edit ${cat.name.en}`}
            className="p-1.5 text-muted hover:text-navy transition-colors cursor-pointer"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => remove(cat)}
            disabled={busy}
            aria-label={`Delete ${cat.name.en}`}
            className="p-1.5 text-muted hover:text-brand transition-colors cursor-pointer disabled:opacity-40"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs font-extrabold uppercase tracking-wider text-brand">
        {productCounts[cat.slug] ?? 0} products
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
        <span>/{cat.slug}</span>
        <span>order {cat.order}</span>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display uppercase text-2xl text-navy">
          Categories
        </h1>
        <button
          onClick={openNew}
          className="skew-cta flex items-center gap-2 bg-brand px-5 py-2.5 text-sm font-display uppercase tracking-wider text-white hover:bg-brand-dark transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Plus size={16} /> New Category
          </span>
        </button>
      </div>

      {/* Create / edit form */}
      {editing !== null && (
        <div className="mt-6 border-2 border-brand/30 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display uppercase text-lg text-navy">
              {editing === "new" ? "New Category" : "Edit Category"}
            </h2>
            <button
              onClick={close}
              aria-label="Close form"
              className="text-muted hover:text-brand cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Name (English)</label>
              <input
                value={form.nameEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nameEn: e.target.value }))
                }
                className={inputCls}
              />
              {form.nameEn.trim() && (
                <p className="mt-1.5 font-mono text-[11px] text-muted">
                  /{slugify(form.nameEn)}
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>Name (Arabic)</label>
              <input
                value={form.nameAr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nameAr: e.target.value }))
                }
                dir="rtl"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Parent Category</label>
              <select
                value={form.parentId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parentId: e.target.value }))
                }
                className={inputCls}
              >
                <option value="">— None (top level) —</option>
                {topLevel
                  .filter((c) => c.id !== editing)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.en}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Display Order</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, order: e.target.value }))
                }
                className={inputCls}
              />
              <p className="mt-1.5 text-[11px] text-muted">
                Lower numbers appear first in navigation and home tiles.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className={labelCls}>Category Photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => chooseImage(e.target.files?.[0])}
              className="hidden"
            />
            <div className="flex flex-wrap items-center gap-4 border-2 border-dashed border-navy/15 bg-surface p-3">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden bg-white">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlus size={24} className="text-muted" />
                )}
              </div>
              <div className="min-w-56 flex-1">
                <p className="text-xs font-bold text-navy">
                  {imageFile
                    ? imageFile.name
                    : existingImage?.url
                      ? "Current category photo"
                      : "No photo selected"}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Images are compressed to JPEG under 400 KB before upload.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 border-2 border-navy/15 bg-white px-3 py-2 text-xs font-extrabold uppercase text-navy hover:border-brand hover:text-brand transition-colors cursor-pointer"
                  >
                    <Upload size={14} /> Choose Photo
                  </button>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={clearSelectedImage}
                      className="border-2 border-brand/30 bg-white px-3 py-2 text-xs font-extrabold uppercase text-brand hover:bg-brand hover:text-white transition-colors cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                  {(imagePreview || existingImage) && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="border-2 border-brand/30 bg-white px-3 py-2 text-xs font-extrabold uppercase text-brand hover:bg-brand hover:text-white transition-colors cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {error && (
            <p className="mt-3 text-xs font-bold text-brand">{error}</p>
          )}
          <button
            onClick={submit}
            disabled={busy}
            className={clsx(
              "skew-cta mt-4 bg-brand px-6 py-2.5 text-sm font-display uppercase tracking-wider text-white hover:bg-brand-dark transition-colors cursor-pointer",
              busy && "opacity-60"
            )}
          >
            <span>{busy ? "Saving…" : editing === "new" ? "Create" : "Save"}</span>
          </button>
        </div>
      )}

      {/* Hierarchy: each top-level category followed by its subcategories. */}
      <div className="mt-6 space-y-6">
        {topLevel.map((cat) => {
          const subs = childrenOf(cat.id);
          return (
            <div key={cat.id} className="grid gap-4 md:grid-cols-3">
              <CategoryCard cat={cat} />
              {subs.map((sub) => (
                <CategoryCard key={sub.id} cat={sub} isSub />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
