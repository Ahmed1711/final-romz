import Sidebar from "@/components/admin/Sidebar";
import AdminSession from "@/components/admin/AdminSession";

// Every admin page reads live, per-request data (and the admin's token), so the
// whole panel renders dynamically — never statically prerendered at build.
export const dynamic = "force-dynamic";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSession />
      <Sidebar />
      <div className="min-w-0 flex-1 bg-surface">
        {children}
        <footer className="border-t border-navy/10 px-6 py-4 text-xs text-muted">
          © 2026 ROMZ ATHLETIC WEAR — INTERNAL USE ONLY
        </footer>
      </div>
    </div>
  );
}
