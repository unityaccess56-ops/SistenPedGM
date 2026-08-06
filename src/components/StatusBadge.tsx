import { cn } from "@/lib/utils";
import { statusTone } from "@/lib/format";

export default function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
        tone === "emerald" && "bg-emerald-100 text-emerald-700",
        tone === "sky" && "bg-sky-100 text-sky-700",
        tone === "rose" && "bg-rose-100 text-rose-700",
        tone === "amber" && "bg-amber-100 text-amber-700",
      )}
    >
      {status.split("_").join(" ")}
    </span>
  );
}
