import { formatCurrency, formatDate } from "@/lib/format";
import type { Client, Quotation, Settings } from "@/types";

interface QuotationPreviewProps {
  quotation: Quotation;
  client?: Client;
  settings: Settings | null;
}

export default function QuotationPreview({
  quotation,
  client,
  settings,
}: QuotationPreviewProps) {
  return (
    <article className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white text-zinc-900 shadow-sm">
      <div className="flex flex-col gap-6 border-b border-zinc-200 bg-white p-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-2xl">{settings?.businessName || "Nombre de tu negocio"}</p>
          <p className="mt-2 text-sm text-zinc-600">{settings?.city || quotation.city}</p>
          <p className="text-sm text-zinc-600">{formatDate(quotation.date)}</p>
        </div>
        <div className="rounded-3xl bg-zinc-950 px-5 py-4 text-white">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">Referencia</p>
          <p className="mt-2 text-sm font-semibold">{quotation.reference}</p>
          <p className="mt-1 text-xs text-zinc-400">{quotation.number}</p>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Cliente</p>
          <h3 className="mt-2 text-xl font-semibold">{client?.name || "Cliente"}</h3>
          <p className="text-sm text-zinc-600">{client?.company}</p>
          <p className="text-sm text-zinc-600">{client?.address}</p>
        </div>

        <div>
          <p className="text-sm leading-7 text-zinc-700">{quotation.intro}</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-900 text-zinc-100">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Medida</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item) => (
                <tr key={item.id} className="border-t border-zinc-200">
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3">{item.measure}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-zinc-100 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Forma de pago</p>
            <p className="mt-3 text-sm text-zinc-700">
              Anticipo: {quotation.advancePercentage}%<br />
              Saldo: {quotation.balancePercentage}% a la entrega final.
            </p>
            <p className="mt-3 text-sm text-zinc-600">{quotation.notes}</p>
          </div>
          <div className="rounded-3xl bg-zinc-950 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">Total cotizado</p>
            <p className="mt-4 text-3xl font-semibold">{formatCurrency(quotation.total)}</p>
            <p className="mt-2 text-sm text-zinc-400">
              Vigencia: {quotation.validityDays} dias calendario
            </p>
          </div>
        </div>

        <div className="grid gap-5 pt-4 md:grid-cols-2">
          {settings?.signatures.map((signature) => (
            <div key={signature.id}>
              <div className="h-px bg-zinc-300" />
              <p className="mt-3 text-sm font-semibold">{signature.name}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{signature.role}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
