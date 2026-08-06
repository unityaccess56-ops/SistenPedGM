import {
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  FileStack,
  Users,
} from "lucide-react";
import PageSection from "@/components/PageSection";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

export default function Dashboard() {
  const { summary } = useAppStore();

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <StatCard
          title="Clientes"
          value={summary.totalClients}
          icon={Users}
          note="Base activa de clientes registrados."
        />
        <StatCard
          title="Pedidos activos"
          value={summary.activeOrders}
          icon={ClipboardList}
          note="Pedidos pendientes o en proceso."
        />
        <StatCard
          title="Saldo pendiente"
          value={summary.pendingBalance}
          type="currency"
          icon={CircleDollarSign}
          note="Total pendiente por cobrar."
        />
        <StatCard
          title="Cotizaciones"
          value={summary.quotationsThisMonth}
          icon={FileStack}
          note="Cotizaciones registradas este mes."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <PageSection
          title="Entregas proximas"
          subtitle="Lista prioritaria para controlar tiempos y estados del trabajo."
        >
          <div className="space-y-3">
            {summary.upcomingDeliveries.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
                No hay entregas programadas por ahora.
              </div>
            ) : null}
            {summary.upcomingDeliveries.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-950">{item.number}</p>
                    <p className="text-sm text-zinc-600">{item.clientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-zinc-700">{formatDate(item.deliveryDate)}</p>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </PageSection>

        <PageSection
          title="Actividad reciente"
          subtitle="Movimientos recientes para no perder trazabilidad de clientes y documentos."
        >
          <div className="space-y-3">
            {summary.recentActivity.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
                Aun no hay actividad registrada en el sistema.
              </div>
            ) : null}
            {summary.recentActivity.map((item) => (
              <div key={item.id} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-950">{item.title}</p>
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {item.type}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">{item.detail}</p>
                <p className="mt-3 text-xs text-zinc-500">{formatDate(item.date)}</p>
              </div>
            ))}
          </div>
        </PageSection>
      </div>
    </div>
  );
}
