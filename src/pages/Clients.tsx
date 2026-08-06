import { useMemo, useState } from "react";
import PageSection from "@/components/PageSection";
import { formatDate } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  company: "",
  address: "",
  notes: "",
};

export default function Clients() {
  const { clients, createClient } = useAppStore();
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      clients.filter((client) =>
        [client.name, client.company, client.email].join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [clients, query],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
      <PageSection
        title="Nuevo cliente"
        subtitle="Registra los datos basicos para enlazar pedidos y cotizaciones."
      >
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await createClient(form);
            setForm(initialForm);
          }}
        >
          {[
            ["name", "Nombre del cliente"],
            ["company", "Empresa"],
            ["phone", "Telefono"],
            ["email", "Correo"],
            ["address", "Direccion"],
          ].map(([key, label]) => (
            <input
              key={key}
              value={form[key as keyof typeof form]}
              onChange={(event) =>
                setForm((current) => ({ ...current, [key]: event.target.value }))
              }
              placeholder={label}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
            />
          ))}
          <textarea
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Notas"
            rows={4}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
          />
          <button
            type="submit"
            className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Guardar cliente
          </button>
        </form>
      </PageSection>

      <PageSection
        title="Tabla de clientes"
        subtitle="Consulta rapida de clientes con sus datos de contacto y fecha de registro."
        action={
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cliente"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
          />
        }
      >
        <div className="grid gap-3">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
              No hay clientes registrados todavia.
            </div>
          ) : null}
          {filtered.map((client) => (
            <div
              key={client.id}
              className="grid gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-[1.1fr,0.9fr,0.8fr]"
            >
              <div>
                <p className="text-sm font-medium text-zinc-950">{client.name}</p>
                <p className="mt-1 text-sm text-zinc-600">{client.company}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Registrado {formatDate(client.createdAt)}
                </p>
              </div>
              <div className="text-sm text-zinc-700">
                <p>{client.phone || "Sin telefono"}</p>
                <p className="mt-1">{client.email || "Sin correo"}</p>
              </div>
              <div className="text-sm text-zinc-600">
                <p>{client.address || "Sin direccion"}</p>
                {client.notes ? <p className="mt-2 line-clamp-2">{client.notes}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </PageSection>
    </div>
  );
}
