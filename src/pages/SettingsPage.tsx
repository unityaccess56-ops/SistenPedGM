import PageSection from "@/components/PageSection";
import { useAppStore } from "@/store/app-store";

export default function SettingsPage() {
  const { settings, user } = useAppStore();

  if (!settings) {
    return null;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <PageSection
        title="Datos del negocio"
        subtitle="Configuracion base de la marca para los documentos y el panel."
      >
        <div className="grid gap-4 text-sm text-zinc-700 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Marca</p>
            <p className="mt-3 text-base font-medium text-zinc-950">{settings.businessName}</p>
            <p className="mt-1">{settings.city}</p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Responsable</p>
            <p className="mt-3 text-base font-medium text-zinc-950">{settings.legalName}</p>
            <p className="mt-1">{user?.role}</p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Condiciones de pago</p>
            <p className="mt-3 leading-7 text-zinc-700">{settings.paymentTerms}</p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Nota final</p>
            <p className="mt-3 leading-7 text-zinc-700">{settings.footerNote}</p>
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Firmas configuradas"
        subtitle="Responsables visibles en la cotizacion comercial."
      >
        <div className="space-y-3">
          {settings.signatures.map((signature) => (
            <div key={signature.id} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-950">{signature.name}</p>
              <p className="mt-1 text-sm text-zinc-600">{signature.role}</p>
            </div>
          ))}
        </div>
      </PageSection>
    </div>
  );
}
