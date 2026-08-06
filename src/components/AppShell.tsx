import {
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/configuracion", label: "Configuracion", icon: Settings },
];

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, settings, logout } = useAppStore();

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-72 border-r border-zinc-200 bg-white px-5 py-6 transition-transform duration-200 lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
              {settings?.logoLetters || "GN"}
            </div>
            <div>
              <p className="font-display text-lg">{settings?.businessName || "Nombre de tu negocio"}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                Pedidos y cotizaciones
              </p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                    active
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Sesion activa</p>
            <p className="mt-3 text-sm font-medium text-zinc-900">{user?.name}</p>
            <p className="text-xs text-zinc-500">{user?.email}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur lg:px-8">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="rounded-2xl border border-zinc-200 p-2 text-zinc-700 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                Sistema comercial
              </p>
              <h1 className="font-display text-lg text-zinc-950">Gestion integral del negocio</h1>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              Vista adaptable para PC y movil
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
