import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import ItemEditor from "@/components/ItemEditor";
import PageSection from "@/components/PageSection";
import QuotationPreview from "@/components/QuotationPreview";
import StatusBadge from "@/components/StatusBadge";
import { calculateItemsTotal, formatCurrency, formatDate } from "@/lib/format";
import { downloadQuotationPdf } from "@/lib/pdf";
import { useAppStore } from "@/store/app-store";
import type { DocumentItem } from "@/types";

const baseItem = (): DocumentItem => ({
  id: crypto.randomUUID(),
  description: "",
  measure: "",
  quantity: 1,
  unitPrice: 0,
  subtotal: 0,
});

export default function Quotations() {
  const {
    clients,
    quotations,
    settings,
    createQuotation,
    approveQuotation,
    convertQuotation,
  } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(quotations[0]?.id || null);
  const [form, setForm] = useState({
    clientId: "",
    reference: "",
    city: "Cartagena",
    date: new Date().toISOString().slice(0, 10),
    validityDays: 15,
    advancePercentage: 60,
    balancePercentage: 40,
    intro: "Presentamos una propuesta comercial segun la referencia suministrada por el cliente.",
    notes: "Anticipo para iniciar produccion y saldo al momento de la entrega final.",
  });
  const [items, setItems] = useState<DocumentItem[]>([baseItem()]);

  const selected = useMemo(
    () => quotations.find((quotation) => quotation.id === selectedId) || quotations[0],
    [quotations, selectedId],
  );
  const clientMap = useMemo(
    () => Object.fromEntries(clients.map((client) => [client.id, client])),
    [clients],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <PageSection
          title="Nueva cotizacion"
          subtitle="Genera un documento formal con tabla de items, porcentajes y notas para el cliente."
        >
          {clients.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
              Primero crea un cliente para poder generar cotizaciones.
            </div>
          ) : null}
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              await createQuotation({ ...form, items });
              setItems([baseItem()]);
              setForm((current) => ({
                ...current,
                clientId: "",
                reference: "",
              }));
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={form.clientId}
                onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">Selecciona cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <input
                value={form.reference}
                onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
                placeholder="Referencia de la cotizacion"
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
              />
              <input
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                placeholder="Ciudad"
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
              />
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
              />
            </div>
            <ItemEditor items={items} onChange={setItems} />
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="number"
                value={form.advancePercentage}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    advancePercentage: Number(event.target.value),
                  }))
                }
                placeholder="Anticipo %"
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
              />
              <input
                type="number"
                value={form.balancePercentage}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    balancePercentage: Number(event.target.value),
                  }))
                }
                placeholder="Saldo %"
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
              />
            </div>
            <textarea
              value={form.intro}
              onChange={(event) => setForm((current) => ({ ...current, intro: event.target.value }))}
              rows={3}
              placeholder="Texto de introduccion"
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
            />
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              rows={3}
              placeholder="Condiciones o notas"
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
            />
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              Total proyectado: {formatCurrency(calculateItemsTotal(items))}
            </div>
            <button
              type="submit"
              disabled={clients.length === 0}
              className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Guardar cotizacion
            </button>
          </form>
        </PageSection>

        <PageSection
          title="Vista previa"
          subtitle="Documento comercial formal listo para descargar en PDF."
          action={
            selected ? (
              <button
                type="button"
                onClick={() =>
                  downloadQuotationPdf(selected, clientMap[selected.clientId], settings)
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-950 px-4 py-3 text-sm text-white transition hover:bg-zinc-800"
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </button>
            ) : null
          }
        >
          {selected ? (
            <QuotationPreview
              quotation={selected}
              client={clientMap[selected.clientId]}
              settings={settings}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 p-6 text-sm text-zinc-400">
              Crea o selecciona una cotizacion para ver el documento.
            </div>
          )}
        </PageSection>
      </div>

      <PageSection
        title="Cotizaciones registradas"
        subtitle="Aprueba una cotizacion o conviertela en pedido sin duplicar informacion."
      >
        <div className="space-y-3">
          {quotations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
              No hay cotizaciones registradas todavia.
            </div>
          ) : null}
          {quotations.map((quotation) => (
            <div
              key={quotation.id}
              className="grid gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 xl:grid-cols-[1fr,auto]"
            >
              <div className="space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedId(quotation.id)}
                      className="text-left text-sm font-medium text-zinc-950"
                    >
                      {quotation.number} · {quotation.reference}
                    </button>
                    <p className="mt-1 text-sm text-zinc-600">
                      {clientMap[quotation.clientId]?.name || "Cliente"} · {formatDate(quotation.date)}
                    </p>
                  </div>
                  <StatusBadge status={quotation.status} />
                </div>
                <p className="text-sm text-zinc-600">{quotation.notes}</p>
              </div>
              <div className="flex flex-col gap-3 md:flex-row xl:flex-col">
                <button
                  type="button"
                  onClick={() => approveQuotation(quotation.id)}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 transition hover:bg-emerald-100"
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => convertQuotation(quotation.id)}
                  className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 transition hover:bg-sky-100"
                >
                  Convertir a pedido
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadQuotationPdf(quotation, clientMap[quotation.clientId], settings)
                  }
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 transition hover:bg-zinc-100"
                >
                  Descargar PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </PageSection>
    </div>
  );
}
