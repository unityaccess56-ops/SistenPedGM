export type UserRole = "ADMIN" | "OPERADOR";

export type OrderStatus =
  | "PENDIENTE"
  | "EN_PROCESO"
  | "PAUSADO"
  | "ENTREGADO"
  | "FACTURADO"
  | "CANCELADO";

export type QuotationStatus =
  | "BORRADOR"
  | "ENVIADA"
  | "APROBADA"
  | "RECHAZADA"
  | "VENCIDA";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  address: string;
  notes: string;
  active: boolean;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  description: string;
  measure: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  number: string;
  clientId: string;
  createdBy: string;
  createdAt: string;
  deliveryDate: string;
  status: OrderStatus;
  advance: number;
  balance: number;
  total: number;
  notes: string;
  items: DocumentItem[];
}

export interface Quotation {
  id: string;
  number: string;
  clientId: string;
  createdBy: string;
  city: string;
  date: string;
  reference: string;
  validityDays: number;
  status: QuotationStatus;
  advancePercentage: number;
  balancePercentage: number;
  notes: string;
  intro: string;
  items: DocumentItem[];
  total: number;
}

export interface Settings {
  businessName: string;
  city: string;
  legalName: string;
  logoLetters: string;
  paymentTerms: string;
  footerNote: string;
  signatures: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

export interface DashboardSummary {
  totalClients: number;
  activeOrders: number;
  pendingBalance: number;
  quotationsThisMonth: number;
  upcomingDeliveries: Array<{
    id: string;
    number: string;
    clientName: string;
    deliveryDate: string;
    status: OrderStatus;
  }>;
  recentActivity: Array<{
    id: string;
    type: "pedido" | "cotizacion" | "cliente";
    title: string;
    date: string;
    detail: string;
  }>;
}

export interface SessionPayload {
  token: string;
  user: User;
}
