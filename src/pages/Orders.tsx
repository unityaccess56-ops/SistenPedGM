import { useMemo, useState } from "react";
import ItemEditor from "@/components/ItemEditor";
import PageSection from "@/components/PageSection";
import StatusBadge from "@/components/StatusBadge";
import { calculateItemsTotal, formatCurrency, formatDate } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { DocumentItem, OrderStatus } from "@/types";

const orderStates: OrderStatus[] = [
  "PENDIENTE",
  "EN_PROCESO",
  "PAUSADO",
  "ENTREGADO",
  "FACTURADO",
  "CANCELADO",
];

const baseItem = (): DocumentItem => ({
  id: crypto.randomUUID(),
  description: "",
  measure: "",
  quantity: 1,
  unitPrice: 0,
  subtotal: 0,
});

export default function Orders() {
  const { clients, orders, createOrder, updateOrderStatus } = useAppStore();
  const [clientId, setClientId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [advance, setAdvance] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DocumentItem[]>([baseItem()]);

  const clientMap = useMemo(
    () => Object.fromEntries(clients.map((client) => [client.id, client])),
    [clients],
  );
  const total = calculateItemsTotal(items);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr,1.1fr]">
      <PageSection
        title="Nuevo pedido"
        subtitle="Registra los items, el anticipo, la entrega y las observaciones operativas."
      >
        {clients.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
            Primero crea un cliente para poder registrar pedidos.
          </div>
        ) : null}
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await createOrder({ clientId, deliveryDate, advance, notes, items });
            setClientId("");
            setDeliveryDate(new Date().toISOString().slice(0, 10));
            setAdvance(0);
            setNotes("");
            setItems([baseItem()]);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
            >
              <option value="">Selecciona un cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={deliveryDate}
              onChange={(event) => setDeliveryDate(event.target.value)}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
            />
          </div>
          <ItemEditor items={items} onChange={setItems} />
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="number"
              value={advance}
              onChange={(event) => setAdvance(Number(event.target.value))}
              placeholder="Anticipo"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
            />
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              Total estimado: {formatCurrency(total)}
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Observaciones"
            rows={4}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={clients.length === 0}
            className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Crear pedido
          </button>
        </form>
      </PageSection>

      <PageSection
        title="Gestion de pedidos"
        subtitle="Visualiza total, saldo, fecha de entrega y cambia rapidamente el estado."
      >
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
              No hay pedidos registrados todavia.
            </div>
          ) : null}
          {orders.map((order) => (
            <div key={order.id} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-950">{order.number}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {clientMap[order.clientId]?.name || "Cliente"} · Entrega {formatDate(order.deliveryDate)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white p-3 text-sm text-zinc-600 border border-zinc-200">
                  <p>Total</p>
                  <p className="mt-2 font-medium text-zinc-950">{formatCurrency(order.total)}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 text-sm text-zinc-600 border border-zinc-200">
                  <p>Anticipo</p>
                  <p className="mt-2 font-medium text-zinc-950">{formatCurrency(order.advance)}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 text-sm text-zinc-600 border border-zinc-200">
                  <p>Saldo</p>
                  <p className="mt-2 font-medium text-zinc-950">{formatCurrency(order.balance)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-zinc-600">{order.notes}</p>
                <select
                  value={order.status}
                  onChange={(event) =>
                    updateOrderStatus(order.id, event.target.value as OrderStatus)
                  }
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
                >
                  {orderStates.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </PageSection>
    </div>
  );
}
