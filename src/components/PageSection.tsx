import type { ReactNode } from "react";

interface PageSectionProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function PageSection({
  title,
  subtitle,
  action,
  children,
}: PageSectionProps) {
  return (
    <section className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">{title}</p>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
