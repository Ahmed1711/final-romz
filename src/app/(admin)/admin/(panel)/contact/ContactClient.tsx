"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Search,
  Trash2,
  X,
} from "lucide-react";
import clsx from "clsx";
import {
  deleteContactMessage,
  fetchContactMessages,
  updateContactMessage,
} from "@/lib/adminApi";
import type { ContactListResult } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ContactMessage, ContactStatus } from "@/lib/types";

const LIMIT = 12;
const STATUSES: ContactStatus[] = ["new", "read", "replied", "archived"];
const FILTERS: (ContactStatus | "all")[] = ["all", ...STATUSES];

const statusStyles: Record<ContactStatus, string> = {
  new: "bg-brand text-white",
  read: "bg-navy text-white",
  replied: "bg-success text-white",
  archived: "bg-surface text-muted border border-navy/15",
};

function StatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span
      className={clsx(
        "inline-block px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ContactClient({
  initial,
}: {
  initial: ContactListResult;
}) {
  const [messages, setMessages] = useState<ContactMessage[]>(initial.messages);
  const [meta, setMeta] = useState(initial.meta);
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const didMount = useRef(false);

  // Debounce the search box, resetting to the first page on a new term.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [search]);

  // Re-fetch whenever the filters or page change. The first render already has
  // the server-provided initial page, so skip that pass.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    fetchContactMessages({
      page,
      limit: LIMIT,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    })
      .then((res) => {
        if (!active) return;
        setMessages(res.messages);
        setMeta(res.meta);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load messages.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, statusFilter, debouncedSearch]);

  const reload = () => {
    // Force the effect to run by toggling nothing — re-fetch current view.
    setLoading(true);
    setError(null);
    fetchContactMessages({
      page,
      limit: LIMIT,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    })
      .then((res) => {
        setMessages(res.messages);
        setMeta(res.meta);
        // Stepping off an emptied last page.
        if (res.messages.length === 0 && page > 1) setPage((p) => p - 1);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load messages.")
      )
      .finally(() => setLoading(false));
  };

  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display uppercase text-2xl text-navy">
          <Mail size={22} className="text-brand" /> Contact Inbox
        </h1>
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          {meta.total} {meta.total === 1 ? "message" : "messages"}
        </span>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((value) => (
            <button
              key={value}
              onClick={() => {
                setStatusFilter(value);
                setPage(1);
              }}
              className={clsx(
                "px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer",
                statusFilter === value
                  ? "bg-navy text-white"
                  : "bg-white text-muted hover:text-navy border border-navy/10"
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="flex min-w-64 flex-1 items-center gap-2 border-2 border-navy/15 bg-white px-3 py-2.5">
          <Search size={14} className="text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or subject..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 border-s-2 border-brand bg-brand/5 px-3 py-2 text-sm font-bold text-brand">
          {error}
        </p>
      )}

      {/* Table */}
      <div className="relative mt-6 overflow-x-auto bg-white shadow-sm">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <Loader2 size={22} className="animate-spin text-brand" />
          </div>
        )}
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b-2 border-navy text-[11px] font-extrabold uppercase tracking-wider text-muted">
              <th className="px-4 py-3 text-start">Name</th>
              <th className="px-4 py-3 text-start">Email</th>
              <th className="px-4 py-3 text-start">Subject</th>
              <th className="px-4 py-3 text-start">Status</th>
              <th className="px-4 py-3 text-start">Received</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr
                key={m.id}
                onClick={() => setSelected(m)}
                className="cursor-pointer border-b border-navy/5 hover:bg-brand/5"
              >
                <td className="px-4 py-3 font-extrabold text-navy">{m.name}</td>
                <td className="px-4 py-3 text-muted" dir="ltr">
                  {m.email}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-navy">
                  {m.subject}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.status} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDate(m.createdAt, "en")}
                </td>
              </tr>
            ))}
            {messages.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-muted">
                  No messages match this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 text-xs text-muted">
          <span>
            {meta.total === 0
              ? "No results"
              : `Showing ${from}–${to} of ${meta.total}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1 || loading}
              aria-label="Previous page"
              className="p-2 text-muted hover:text-navy transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-bold text-navy">
              {meta.page} / {Math.max(1, meta.pages)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={meta.page >= meta.pages || loading}
              aria-label="Next page"
              className="p-2 text-muted hover:text-navy transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <MessageDrawer
          key={selected.id}
          message={selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setMessages((list) =>
              list.map((m) => (m.id === updated.id ? updated : m))
            );
            setSelected(updated);
          }}
          onDeleted={() => {
            setSelected(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function MessageDrawer({
  message,
  onClose,
  onSaved,
  onDeleted,
}: {
  message: ContactMessage;
  onClose: () => void;
  onSaved: (m: ContactMessage) => void;
  onDeleted: () => void;
}) {
  // Initialized straight from props; the parent remounts this drawer with a
  // `key` per message, so no effect is needed to reset when a new one opens.
  const [status, setStatus] = useState<ContactStatus>(message.status);
  const [notes, setNotes] = useState(message.adminNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = status !== message.status || notes !== (message.adminNotes ?? "");

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateContactMessage(message.id, {
        status,
        adminNotes: notes,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (
      !window.confirm(
        `Delete the message from ${message.name}? This cannot be undone.`
      )
    )
      return;
    setDeleting(true);
    setError(null);
    try {
      await deleteContactMessage(message.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-navy/40"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b-2 border-navy/10 px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusBadge status={message.status} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                {message.source || "storefront"}
              </span>
            </div>
            <h2 className="mt-2 truncate font-display uppercase text-xl text-navy">
              {message.subject}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-1 text-muted hover:text-brand cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5">
          <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
            <dt className="font-extrabold uppercase text-[11px] tracking-wider text-muted">
              From
            </dt>
            <dd className="col-span-2 font-bold text-navy">{message.name}</dd>

            <dt className="font-extrabold uppercase text-[11px] tracking-wider text-muted">
              Email
            </dt>
            <dd className="col-span-2 break-all text-navy" dir="ltr">
              <a
                href={`mailto:${message.email}`}
                className="hover:text-brand underline decoration-brand/40"
              >
                {message.email}
              </a>
            </dd>

            <dt className="font-extrabold uppercase text-[11px] tracking-wider text-muted">
              Phone
            </dt>
            <dd className="col-span-2 text-navy" dir="ltr">
              {message.phone || "—"}
            </dd>

            <dt className="font-extrabold uppercase text-[11px] tracking-wider text-muted">
              Received
            </dt>
            <dd className="col-span-2 text-navy">
              {formatDateTime(message.createdAt)}
            </dd>

            {message.repliedAt && (
              <>
                <dt className="font-extrabold uppercase text-[11px] tracking-wider text-muted">
                  Replied
                </dt>
                <dd className="col-span-2 text-navy">
                  {formatDateTime(message.repliedAt)}
                </dd>
              </>
            )}
          </dl>

          <div className="mt-5">
            <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted">
              Message
            </p>
            <p className="whitespace-pre-wrap border-2 border-navy/10 bg-surface p-4 text-sm leading-relaxed text-navy">
              {message.message}
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-muted">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContactStatus)}
                className="w-full border-2 border-navy/15 bg-white px-3 py-2.5 text-sm font-bold uppercase text-navy outline-none focus:border-brand"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-muted">
                Admin Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Internal notes — not visible to the customer."
                className="w-full resize-y border-2 border-navy/15 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-brand"
              />
            </div>
          </div>

          {(message.ipAddress || message.userAgent) && (
            <div className="mt-5 space-y-1 text-[11px] text-muted">
              {message.ipAddress && (
                <p>
                  <span className="font-extrabold uppercase">IP:</span>{" "}
                  <span dir="ltr">{message.ipAddress}</span>
                </p>
              )}
              {message.userAgent && (
                <p className="break-all">
                  <span className="font-extrabold uppercase">Agent:</span>{" "}
                  {message.userAgent}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 border-s-2 border-brand bg-brand/5 px-3 py-2 text-sm font-bold text-brand">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t-2 border-navy/10 bg-white px-6 py-4">
          <button
            onClick={remove}
            disabled={deleting || saving}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-muted transition-colors hover:text-brand cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <button
            onClick={save}
            disabled={saving || deleting || !dirty}
            className={clsx(
              "skew-cta bg-brand px-6 py-2.5 text-sm font-display uppercase tracking-wider text-white hover:bg-brand-dark transition-colors cursor-pointer",
              (saving || !dirty) && "opacity-60"
            )}
          >
            <span>{saving ? "Saving…" : "Save Changes"}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
