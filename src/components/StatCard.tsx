import type { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface StatCardProps {
  title: string;
  value: number;
  type?: "currency" | "number";
  icon: LucideIcon;
  note: string;
}

export default function StatCard({
  title,
  value,
  type = "number",
  icon: Icon,
  note,
}: StatCardProps) {
  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-950">
            {type === "currency" ? formatCurrency(value) : value}
          </p>
        </div>
        <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-zinc-600">{note}</p>
    </div>
  );
}
