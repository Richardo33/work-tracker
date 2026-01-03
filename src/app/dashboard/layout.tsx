import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-linear-to-b from-indigo-50 via-slate-50 to-emerald-50">
      <Sidebar />

      {/* Right side */}
      <div className="min-h-screen md:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Topbar />

          {/* Scrollable content area */}
          <main className="mt-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
