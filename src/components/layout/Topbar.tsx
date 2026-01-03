import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AddApplicationDialog from "@/components/app/AddApplicationDialog";

export default function Topbar() {
  return (
    <div className="sticky top-4 z-30 rounded-2xl bg-slate-50/95 border-b border-slate-200 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Dashboard</p>
          <p className="text-xs text-slate-600">
            Track applications & schedule interviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AddApplicationDialog
            triggerText="Add"
            triggerVariant="default"
            triggerClassName="rounded-xl bg-indigo-600 hover:bg-indigo-700"
          />

          <Link href="/dashboard/profile" className="rounded-xl">
            <Avatar className="h-9 w-9 border border-slate-200">
              <AvatarFallback className="bg-slate-100 text-slate-700">
                U
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </div>
  );
}
