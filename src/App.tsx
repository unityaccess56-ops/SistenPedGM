import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/store/app-store";
import Agenda from "@/pages/Agenda";
import Clients from "@/pages/Clients";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Orders from "@/pages/Orders";
import Quotations from "@/pages/Quotations";
import SettingsPage from "@/pages/SettingsPage";

function ProtectedApp() {
  const { token, bootstrapped } = useAppStore();

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        Cargando sistema...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

export default function App() {
  const hydrateSession = useAppStore((state) => state.hydrateSession);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedApp />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/pedidos" element={<Orders />} />
          <Route path="/cotizaciones" element={<Quotations />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/configuracion" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
