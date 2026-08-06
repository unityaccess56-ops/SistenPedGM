import { create } from "zustand";
import { apiRequest } from "@/lib/api";
import type {
  Client,
  DashboardSummary,
  Order,
  OrderStatus,
  Quotation,
  Settings,
  User,
} from "@/types";

const SESSION_KEY = "gisselle-session";

interface AppState {
  token: string | null;
  user: User | null;
  clients: Client[];
  orders: Order[];
  quotations: Quotation[];
  settings: Settings | null;
  summary: DashboardSummary | null;
  loading: boolean;
  bootstrapped: boolean;
  error: string | null;
  hydrateSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadAppData: () => Promise<void>;
  createClient: (payload: Partial<Client>) => Promise<void>;
  createOrder: (payload: Partial<Order>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  createQuotation: (payload: Partial<Quotation>) => Promise<void>;
  approveQuotation: (quotationId: string) => Promise<void>;
  convertQuotation: (quotationId: string) => Promise<void>;
}

const saveSession = (token: string, user: User) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
};

const clearSession = () => localStorage.removeItem(SESSION_KEY);

export const useAppStore = create<AppState>((set, get) => ({
  token: null,
  user: null,
  clients: [],
  orders: [],
  quotations: [],
  settings: null,
  summary: null,
  loading: false,
  bootstrapped: false,
  error: null,

  hydrateSession: async () => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      set({ bootstrapped: true });
      return;
    }

    try {
      const session = JSON.parse(raw) as { token: string; user: User };
      set({ token: session.token, user: session.user });
      await get().loadAppData();
    } catch {
      clearSession();
      set({ token: null, user: null, bootstrapped: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      const response = await apiRequest<{ token: string; user: User }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
        },
      );

      saveSession(response.token, response.user);
      set({ token: response.token, user: response.user });
      await get().loadAppData();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "No fue posible iniciar sesion" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    clearSession();
    set({
      token: null,
      user: null,
      clients: [],
      orders: [],
      quotations: [],
      summary: null,
      settings: null,
      bootstrapped: true,
    });
  },

  loadAppData: async () => {
    const token = get().token;
    if (!token) {
      set({ bootstrapped: true });
      return;
    }

    set({ loading: true, error: null });

    try {
      const [dashboard, clients, orders, quotations] = await Promise.all([
        apiRequest<{ summary: DashboardSummary; settings: Settings }>(
          "/api/dashboard/resumen",
          { token },
        ),
        apiRequest<{ clients: Client[] }>("/api/clientes", { token }),
        apiRequest<{ orders: Order[] }>("/api/pedidos", { token }),
        apiRequest<{ quotations: Quotation[] }>("/api/cotizaciones", { token }),
      ]);

      set({
        summary: dashboard.summary,
        settings: dashboard.settings,
        clients: clients.clients,
        orders: orders.orders,
        quotations: quotations.quotations,
        bootstrapped: true,
      });
    } catch (error) {
      clearSession();
      set({
        token: null,
        user: null,
        error: error instanceof Error ? error.message : "No fue posible cargar la informacion",
        bootstrapped: true,
      });
    } finally {
      set({ loading: false });
    }
  },

  createClient: async (payload) => {
    const token = get().token;
    if (!token) return;

    await apiRequest("/api/clientes", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
    await get().loadAppData();
  },

  createOrder: async (payload) => {
    const token = get().token;
    if (!token) return;

    await apiRequest("/api/pedidos", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
    await get().loadAppData();
  },

  updateOrderStatus: async (orderId, status) => {
    const token = get().token;
    if (!token) return;

    await apiRequest(`/api/pedidos/${orderId}/estado`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    });
    await get().loadAppData();
  },

  createQuotation: async (payload) => {
    const token = get().token;
    if (!token) return;

    await apiRequest("/api/cotizaciones", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
    await get().loadAppData();
  },

  approveQuotation: async (quotationId) => {
    const token = get().token;
    if (!token) return;

    await apiRequest(`/api/cotizaciones/${quotationId}/aprobar`, {
      method: "POST",
      token,
    });
    await get().loadAppData();
  },

  convertQuotation: async (quotationId) => {
    const token = get().token;
    if (!token) return;

    await apiRequest(`/api/cotizaciones/${quotationId}/convertir-pedido`, {
      method: "POST",
      token,
    });
    await get().loadAppData();
  },
}));
