import { Plus, Trash2 } from "lucide-react";
import type { DocumentItem } from "@/types";

interface ItemEditorProps {
  items: DocumentItem[];
  onChange: (items: DocumentItem[]) => void;
}

const emptyItem = (): DocumentItem => ({
  id: crypto.randomUUID(),
  description: "",
  measure: "",
  quantity: 1,
  unitPrice: 0,
  subtotal: 0,
});

export default function ItemEditor({ items, onChange }: ItemEditorProps) {
  const updateItem = (
    id: string,
    key: keyof DocumentItem,
    value: string | number,
  ) => {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, [key]: value };
        next.subtotal = next.quantity * next.unitPrice;
        return next;
      }),
    );
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="grid gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-[2fr,1fr,1fr,1fr,auto]"
        >
          <input
            value={item.description}
            onChange={(event) => updateItem(item.id, "description", event.target.value)}
            placeholder="Descripcion"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            value={item.measure}
            onChange={(event) => updateItem(item.id, "measure", event.target.value)}
            placeholder="Medida"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(event) => updateItem(item.id, "quantity", Number(event.target.value))}
            placeholder="Cantidad"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            type="number"
            min="0"
            value={item.unitPrice}
            onChange={(event) => updateItem(item.id, "unitPrice", Number(event.target.value))}
            placeholder="Valor unitario"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((current) => current.id !== item.id))}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 transition hover:bg-rose-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...items, emptyItem()])}
        className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
      >
        <Plus className="h-4 w-4" />
        Agregar item
      </button>
    </div>
  );
}
