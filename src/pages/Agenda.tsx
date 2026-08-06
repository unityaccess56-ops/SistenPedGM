import PageSection from "@/components/PageSection";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

export default function Agenda() {
  const { orders, clients } = useAppStore();
  const clientMap = Object.fromEntries(clients.map((client) => [client.id, client]));

  const sorted = orders
    .slice()
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));

  return (
    <PageSection
      title="Agenda de entregas"
      subtitle="Vista rapida para organizar la semana y detectar pedidos urgentes desde movil o escritorio."
    >
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
            No hay entregas pendientes en la agenda.
          </div>
        ) : null}
        {sorted.map((order) => (
          <div
            key={order.id}
            className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-zinc-950">{order.number}</p>
              <p className="mt-1 text-sm text-zinc-600">
                {clientMap[order.clientId]?.name || "Cliente"} · {formatDate(order.deliveryDate)}
              </p>
              <p className="mt-2 text-sm text-zinc-500">{order.notes}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
        ))}
      </div>
    </PageSection>
  );
}
