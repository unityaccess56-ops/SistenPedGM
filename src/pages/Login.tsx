import { LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppStore } from "@/store/app-store";

export default function Login() {
  const { login, token, loading, error } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-zinc-900">
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.1fr,0.9fr] lg:px-8">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-zinc-600">
            <Sparkles className="h-4 w-4 text-zinc-700" />
            Sistema de gestion
          </div>
          <div className="space-y-4">
            <h1 className="font-display text-5xl leading-tight text-zinc-950 md:text-6xl">
              Controla pedidos, clientes y cotizaciones.
            </h1>
            <p className="max-w-xl text-base leading-7 text-zinc-600">
              Interfaz clara para trabajar desde computador o celular, con seguimiento comercial
              y cotizaciones formales.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Acceso seguro",
              "Clientes y pedidos",
              "Cotizacion en PDF",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-zinc-900 p-3 text-white">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Acceso</p>
              <h2 className="font-display text-2xl">Iniciar sesion</h2>
            </div>
          </div>

          <form
            className="mt-8 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              await login(email, password);
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-700">Correo</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-zinc-400"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-700">Contrasena</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-zinc-400"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-zinc-950 px-4 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Entrar al sistema"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
            Usa las credenciales entregadas por el administrador del sistema.
          </div>
        </section>
      </div>
    </div>
  );
}
