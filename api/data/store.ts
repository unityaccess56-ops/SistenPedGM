import { hashSync } from "bcryptjs";
import { DATABASE_URL, initialUsers, isProduction } from "../config.js";
import { initializeDatabase, isDatabaseConfigured, query } from "./database.js";
import type {
  ClientRecord,
  DashboardSummary,
  DatabaseShape,
  DocumentItem,
  OrderRecord,
  OrderStatus,
  QuotationRecord,
  QuotationStatus,
  SettingsRecord,
  UserRecord,
} from "../types.js";

const createId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const totalFromItems = (items: DocumentItem[]) =>
  items.reduce((sum, item) => sum + item.subtotal, 0);

const cleanItems = (items: DocumentItem[] = []) =>
  items.map((item) => ({
    ...item,
    id: item.id || createId("item"),
    subtotal: Number(item.quantity) * Number(item.unitPrice),
  }));

const memoryDb: DatabaseShape = {
  users: initialUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    passwordHash: hashSync(user.password, 10),
  })),
  clients: [],
  orders: [],
  quotations: [],
  settings: {
    businessName: "Nombre de tu negocio",
    city: "Cartagena",
    legalName: "Gisselle Barros Peralta",
    logoLetters: "GN",
    paymentTerms: "Anticipo del 60% y saldo del 40% contra entrega.",
    footerNote:
      "Gracias por confiar en nuestro trabajo creativo y de impresion personalizada.",
    signatures: [
      { id: "sig-1", name: "Margy Marie Diaz", role: "Disenador Creativo" },
      { id: "sig-2", name: "Gisselle Barros Peralta", role: "Disenador Creativo" },
    ],
  },
};

export async function initializeStore() {
  if (isProduction && !DATABASE_URL) {
    throw new Error("DATABASE_URL es obligatoria en produccion");
  }

  if (!isDatabaseConfigured()) {
    return;
  }

  await initializeDatabase();
  await query(
    `
      INSERT INTO settings (
        id, business_name, city, legal_name, logo_letters, payment_terms, footer_note, signatures
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
      ON CONFLICT (id) DO NOTHING
    `,
    [
      "default",
      memoryDb.settings.businessName,
      memoryDb.settings.city,
      memoryDb.settings.legalName,
      memoryDb.settings.logoLetters,
      memoryDb.settings.paymentTerms,
      memoryDb.settings.footerNote,
      JSON.stringify(memoryDb.settings.signatures),
    ],
  );

  for (const user of memoryDb.users) {
    await query(
      `
        INSERT INTO users (id, name, email, role, password_hash, active)
        VALUES ($1,$2,$3,$4,$5,TRUE)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          password_hash = EXCLUDED.password_hash,
          active = TRUE
      `,
      [user.id, user.name, user.email, user.role, user.passwordHash],
    );
  }
}

const mapUser = (row: {
  id: string;
  name: string;
  email: string;
  role: UserRecord["role"];
  password_hash?: string;
  passwordHash?: string;
}): UserRecord => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  passwordHash: row.password_hash || row.passwordHash || "",
});

const mapClient = (row: {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  address: string;
  notes: string;
  active: boolean;
  created_at?: string;
  createdAt?: string;
}): ClientRecord => ({
  id: row.id,
  name: row.name,
  phone: row.phone || "",
  email: row.email || "",
  company: row.company || "",
  address: row.address || "",
  notes: row.notes || "",
  active: row.active,
  createdAt: (row.created_at || row.createdAt || "").toString().slice(0, 10),
});

const mapOrder = (row: {
  id: string;
  number: string;
  client_id?: string;
  clientId?: string;
  created_by?: string;
  createdBy?: string;
  created_at?: string;
  createdAt?: string;
  delivery_date?: string;
  deliveryDate?: string;
  status: OrderStatus;
  advance: number | string;
  balance: number | string;
  total: number | string;
  notes: string;
  items: DocumentItem[] | string;
}): OrderRecord => ({
  id: row.id,
  number: row.number,
  clientId: row.client_id || row.clientId || "",
  createdBy: row.created_by || row.createdBy || "",
  createdAt: (row.created_at || row.createdAt || "").toString().slice(0, 10),
  deliveryDate: (row.delivery_date || row.deliveryDate || "").toString().slice(0, 10),
  status: row.status,
  advance: Number(row.advance),
  balance: Number(row.balance),
  total: Number(row.total),
  notes: row.notes || "",
  items:
    typeof row.items === "string"
      ? (JSON.parse(row.items) as DocumentItem[])
      : (row.items || []),
});

const mapQuotation = (row: {
  id: string;
  number: string;
  client_id?: string;
  clientId?: string;
  created_by?: string;
  createdBy?: string;
  city: string;
  date: string;
  reference: string;
  validity_days?: number;
  validityDays?: number;
  status: QuotationStatus;
  advance_percentage?: number;
  advancePercentage?: number;
  balance_percentage?: number;
  balancePercentage?: number;
  notes: string;
  intro: string;
  total: number | string;
  items: DocumentItem[] | string;
}): QuotationRecord => ({
  id: row.id,
  number: row.number,
  clientId: row.client_id || row.clientId || "",
  createdBy: row.created_by || row.createdBy || "",
  city: row.city,
  date: row.date.toString().slice(0, 10),
  reference: row.reference,
  validityDays: Number(row.validity_days ?? row.validityDays ?? 15),
  status: row.status,
  advancePercentage: Number(row.advance_percentage ?? row.advancePercentage ?? 60),
  balancePercentage: Number(row.balance_percentage ?? row.balancePercentage ?? 40),
  notes: row.notes || "",
  intro: row.intro || "",
  total: Number(row.total),
  items:
    typeof row.items === "string"
      ? (JSON.parse(row.items) as DocumentItem[])
      : (row.items || []),
});

const mapSettings = (row: {
  business_name?: string;
  businessName?: string;
  city: string;
  legal_name?: string;
  legalName?: string;
  logo_letters?: string;
  logoLetters?: string;
  payment_terms?: string;
  paymentTerms?: string;
  footer_note?: string;
  footerNote?: string;
  signatures: SettingsRecord["signatures"] | string;
}): SettingsRecord => ({
  businessName: row.business_name || row.businessName || "",
  city: row.city || "",
  legalName: row.legal_name || row.legalName || "",
  logoLetters: row.logo_letters || row.logoLetters || "",
  paymentTerms: row.payment_terms || row.paymentTerms || "",
  footerNote: row.footer_note || row.footerNote || "",
  signatures:
    typeof row.signatures === "string"
      ? (JSON.parse(row.signatures) as SettingsRecord["signatures"])
      : row.signatures,
});

const nextNumber = async (table: "orders" | "quotations", prefix: string) => {
  if (!isDatabaseConfigured()) {
    const count =
      table === "orders" ? memoryDb.orders.length : memoryDb.quotations.length;
    return `${prefix}-2026-${String(count + 1).padStart(3, "0")}`;
  }

  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ${table}`,
  );
  const count = Number(result.rows[0]?.count || "0");
  return `${prefix}-2026-${String(count + 1).padStart(3, "0")}`;
};

export const publicUser = (user: UserRecord) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const listUsers = async () => {
  if (!isDatabaseConfigured()) {
    return memoryDb.users.map(publicUser);
  }

  const result = await query<{
    id: string;
    name: string;
    email: string;
    role: UserRecord["role"];
  }>("SELECT id, name, email, role FROM users ORDER BY name ASC");
  return result.rows.map((row) => publicUser(mapUser(row)));
};

export const findUserByEmail = async (email: string) => {
  if (!isDatabaseConfigured()) {
    return memoryDb.users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  const result = await query<{
    id: string;
    name: string;
    email: string;
    role: UserRecord["role"];
    password_hash: string;
  }>(
    "SELECT id, name, email, role, password_hash FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [email],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : undefined;
};

export const findUserById = async (id: string) => {
  if (!isDatabaseConfigured()) {
    return memoryDb.users.find((user) => user.id === id);
  }

  const result = await query<{
    id: string;
    name: string;
    email: string;
    role: UserRecord["role"];
    password_hash: string;
  }>(
    "SELECT id, name, email, role, password_hash FROM users WHERE id = $1 LIMIT 1",
    [id],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : undefined;
};

export const listClients = async () => {
  if (!isDatabaseConfigured()) {
    return memoryDb.clients;
  }

  const result = await query<{
    id: string;
    name: string;
    phone: string;
    email: string;
    company: string;
    address: string;
    notes: string;
    active: boolean;
    created_at: string;
  }>("SELECT * FROM clients ORDER BY created_at DESC, name ASC");
  return result.rows.map(mapClient);
};

export const getClient = async (id: string) => {
  if (!isDatabaseConfigured()) {
    return memoryDb.clients.find((client) => client.id === id);
  }

  const result = await query<{
    id: string;
    name: string;
    phone: string;
    email: string;
    company: string;
    address: string;
    notes: string;
    active: boolean;
    created_at: string;
  }>("SELECT * FROM clients WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] ? mapClient(result.rows[0]) : undefined;
};

export const createClient = async (input: Partial<ClientRecord>) => {
  const client: ClientRecord = {
    id: createId("client"),
    name: input.name || "Nuevo cliente",
    phone: input.phone || "",
    email: input.email || "",
    company: input.company || "",
    address: input.address || "",
    notes: input.notes || "",
    active: input.active ?? true,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  if (!isDatabaseConfigured()) {
    memoryDb.clients.unshift(client);
    return client;
  }

  const result = await query<{
    id: string;
    name: string;
    phone: string;
    email: string;
    company: string;
    address: string;
    notes: string;
    active: boolean;
    created_at: string;
  }>(
    `
      INSERT INTO clients (id, name, phone, email, company, address, notes, active, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `,
    [
      client.id,
      client.name,
      client.phone,
      client.email,
      client.company,
      client.address,
      client.notes,
      client.active,
      client.createdAt,
    ],
  );
  return mapClient(result.rows[0]);
};

export const updateClient = async (id: string, input: Partial<ClientRecord>) => {
  if (!isDatabaseConfigured()) {
    const client = memoryDb.clients.find((current) => current.id === id);
    if (!client) return null;
    Object.assign(client, input);
    return client;
  }

  const current = await getClient(id);
  if (!current) {
    return null;
  }

  const next = { ...current, ...input };
  const result = await query<{
    id: string;
    name: string;
    phone: string;
    email: string;
    company: string;
    address: string;
    notes: string;
    active: boolean;
    created_at: string;
  }>(
    `
      UPDATE clients
      SET name = $2, phone = $3, email = $4, company = $5, address = $6, notes = $7, active = $8
      WHERE id = $1
      RETURNING *
    `,
    [
      id,
      next.name,
      next.phone,
      next.email,
      next.company,
      next.address,
      next.notes,
      next.active,
    ],
  );
  return result.rows[0] ? mapClient(result.rows[0]) : null;
};

export const listOrders = async () => {
  if (!isDatabaseConfigured()) {
    return memoryDb.orders;
  }

  const result = await query<{
    id: string;
    number: string;
    client_id: string;
    created_by: string;
    created_at: string;
    delivery_date: string;
    status: OrderStatus;
    advance: string;
    balance: string;
    total: string;
    notes: string;
    items: DocumentItem[];
  }>("SELECT * FROM orders ORDER BY created_at DESC, number DESC");
  return result.rows.map(mapOrder);
};

export const getOrder = async (id: string) => {
  if (!isDatabaseConfigured()) {
    return memoryDb.orders.find((order) => order.id === id);
  }

  const result = await query<{
    id: string;
    number: string;
    client_id: string;
    created_by: string;
    created_at: string;
    delivery_date: string;
    status: OrderStatus;
    advance: string;
    balance: string;
    total: string;
    notes: string;
    items: DocumentItem[];
  }>("SELECT * FROM orders WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] ? mapOrder(result.rows[0]) : undefined;
};

export const createOrder = async (input: Partial<OrderRecord>, userId: string) => {
  const items = cleanItems(input.items || []);
  const total = totalFromItems(items);
  const advance = input.advance ?? 0;
  const order: OrderRecord = {
    id: createId("order"),
    number: await nextNumber("orders", "PED"),
    clientId: input.clientId || "",
    createdBy: userId,
    createdAt: input.createdAt || new Date().toISOString().slice(0, 10),
    deliveryDate: input.deliveryDate || new Date().toISOString().slice(0, 10),
    status: input.status || "PENDIENTE",
    advance,
    balance: total - advance,
    total,
    notes: input.notes || "",
    items,
  };

  if (!isDatabaseConfigured()) {
    memoryDb.orders.unshift(order);
    return order;
  }

  const result = await query<{
    id: string;
    number: string;
    client_id: string;
    created_by: string;
    created_at: string;
    delivery_date: string;
    status: OrderStatus;
    advance: string;
    balance: string;
    total: string;
    notes: string;
    items: DocumentItem[];
  }>(
    `
      INSERT INTO orders (
        id, number, client_id, created_by, created_at, delivery_date, status, advance, balance, total, notes, items
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
      RETURNING *
    `,
    [
      order.id,
      order.number,
      order.clientId,
      order.createdBy,
      order.createdAt,
      order.deliveryDate,
      order.status,
      order.advance,
      order.balance,
      order.total,
      order.notes,
      JSON.stringify(order.items),
    ],
  );
  return mapOrder(result.rows[0]);
};

export const updateOrder = async (id: string, input: Partial<OrderRecord>) => {
  const current = await getOrder(id);
  if (!current) {
    return null;
  }

  const items = input.items ? cleanItems(input.items) : current.items;
  const total = input.items ? totalFromItems(items) : current.total;
  const next: OrderRecord = {
    ...current,
    ...input,
    items,
    total,
    balance: total - Number(input.advance ?? current.advance),
  };

  if (!isDatabaseConfigured()) {
    const index = memoryDb.orders.findIndex((order) => order.id === id);
    if (index >= 0) {
      memoryDb.orders[index] = next;
    }
    return next;
  }

  const result = await query<{
    id: string;
    number: string;
    client_id: string;
    created_by: string;
    created_at: string;
    delivery_date: string;
    status: OrderStatus;
    advance: string;
    balance: string;
    total: string;
    notes: string;
    items: DocumentItem[];
  }>(
    `
      UPDATE orders
      SET client_id = $2, created_by = $3, created_at = $4, delivery_date = $5, status = $6,
          advance = $7, balance = $8, total = $9, notes = $10, items = $11::jsonb
      WHERE id = $1
      RETURNING *
    `,
    [
      id,
      next.clientId,
      next.createdBy,
      next.createdAt,
      next.deliveryDate,
      next.status,
      next.advance,
      next.balance,
      next.total,
      next.notes,
      JSON.stringify(next.items),
    ],
  );
  return result.rows[0] ? mapOrder(result.rows[0]) : null;
};

export const updateOrderStatus = async (id: string, status: OrderStatus) =>
  updateOrder(id, { status });

export const listQuotations = async () => {
  if (!isDatabaseConfigured()) {
    return memoryDb.quotations;
  }

  const result = await query<{
    id: string;
    number: string;
    client_id: string;
    created_by: string;
    city: string;
    date: string;
    reference: string;
    validity_days: number;
    status: QuotationStatus;
    advance_percentage: number;
    balance_percentage: number;
    notes: string;
    intro: string;
    total: string;
    items: DocumentItem[];
  }>("SELECT * FROM quotations ORDER BY date DESC, number DESC");
  return result.rows.map(mapQuotation);
};

export const getQuotation = async (id: string) => {
  if (!isDatabaseConfigured()) {
    return memoryDb.quotations.find((quotation) => quotation.id === id);
  }

  const result = await query<{
    id: string;
    number: string;
    client_id: string;
    created_by: string;
    city: string;
    date: string;
    reference: string;
    validity_days: number;
    status: QuotationStatus;
    advance_percentage: number;
    balance_percentage: number;
    notes: string;
    intro: string;
    total: string;
    items: DocumentItem[];
  }>("SELECT * FROM quotations WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] ? mapQuotation(result.rows[0]) : undefined;
};

export const createQuotation = async (
  input: Partial<QuotationRecord>,
  userId: string,
) => {
  const items = cleanItems(input.items || []);
  const quotation: QuotationRecord = {
    id: createId("quotation"),
    number: await nextNumber("quotations", "COT"),
    clientId: input.clientId || "",
    createdBy: userId,
    city: input.city || memoryDb.settings.city,
    date: input.date || new Date().toISOString().slice(0, 10),
    reference: input.reference || "Nueva cotizacion",
    validityDays: input.validityDays || 15,
    status: input.status || "BORRADOR",
    advancePercentage: input.advancePercentage ?? 60,
    balancePercentage: input.balancePercentage ?? 40,
    notes: input.notes || memoryDb.settings.paymentTerms,
    intro: input.intro || "Propuesta comercial generada desde el sistema.",
    items,
    total: totalFromItems(items),
  };

  if (!isDatabaseConfigured()) {
    memoryDb.quotations.unshift(quotation);
    return quotation;
  }

  const result = await query<{
    id: string;
    number: string;
    client_id: string;
    created_by: string;
    city: string;
    date: string;
    reference: string;
    validity_days: number;
    status: QuotationStatus;
    advance_percentage: number;
    balance_percentage: number;
    notes: string;
    intro: string;
    total: string;
    items: DocumentItem[];
  }>(
    `
      INSERT INTO quotations (
        id, number, client_id, created_by, city, date, reference, validity_days, status,
        advance_percentage, balance_percentage, notes, intro, total, items
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb)
      RETURNING *
    `,
    [
      quotation.id,
      quotation.number,
      quotation.clientId,
      quotation.createdBy,
      quotation.city,
      quotation.date,
      quotation.reference,
      quotation.validityDays,
      quotation.status,
      quotation.advancePercentage,
      quotation.balancePercentage,
      quotation.notes,
      quotation.intro,
      quotation.total,
      JSON.stringify(quotation.items),
    ],
  );
  return mapQuotation(result.rows[0]);
};

export const updateQuotation = async (
  id: string,
  input: Partial<QuotationRecord>,
) => {
  const current = await getQuotation(id);
  if (!current) {
    return null;
  }

  const items = input.items ? cleanItems(input.items) : current.items;
  const next: QuotationRecord = {
    ...current,
    ...input,
    items,
    total: totalFromItems(items),
  };

  if (!isDatabaseConfigured()) {
    const index = memoryDb.quotations.findIndex((quotation) => quotation.id === id);
    if (index >= 0) {
      memoryDb.quotations[index] = next;
    }
    return next;
  }

  const result = await query<{
    id: string;
    number: string;
    client_id: string;
    created_by: string;
    city: string;
    date: string;
    reference: string;
    validity_days: number;
    status: QuotationStatus;
    advance_percentage: number;
    balance_percentage: number;
    notes: string;
    intro: string;
    total: string;
    items: DocumentItem[];
  }>(
    `
      UPDATE quotations
      SET client_id = $2, created_by = $3, city = $4, date = $5, reference = $6,
          validity_days = $7, status = $8, advance_percentage = $9, balance_percentage = $10,
          notes = $11, intro = $12, total = $13, items = $14::jsonb
      WHERE id = $1
      RETURNING *
    `,
    [
      id,
      next.clientId,
      next.createdBy,
      next.city,
      next.date,
      next.reference,
      next.validityDays,
      next.status,
      next.advancePercentage,
      next.balancePercentage,
      next.notes,
      next.intro,
      next.total,
      JSON.stringify(next.items),
    ],
  );
  return result.rows[0] ? mapQuotation(result.rows[0]) : null;
};

export const updateQuotationStatus = async (
  id: string,
  status: QuotationStatus,
) => updateQuotation(id, { status });

export const convertQuotationToOrder = async (
  quotationId: string,
  userId: string,
) => {
  const quotation = await getQuotation(quotationId);
  if (!quotation) {
    return null;
  }

  await updateQuotationStatus(quotationId, "APROBADA");
  return createOrder(
    {
      clientId: quotation.clientId,
      deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: "PENDIENTE",
      advance: Math.round((quotation.total * quotation.advancePercentage) / 100),
      notes: `Generado desde ${quotation.number}. ${quotation.reference}`,
      items: quotation.items,
    },
    userId,
  );
};

export const getSettings = async () => {
  if (!isDatabaseConfigured()) {
    return memoryDb.settings;
  }

  const result = await query<{
    business_name: string;
    city: string;
    legal_name: string;
    logo_letters: string;
    payment_terms: string;
    footer_note: string;
    signatures: SettingsRecord["signatures"];
  }>("SELECT * FROM settings WHERE id = 'default' LIMIT 1");
  return result.rows[0] ? mapSettings(result.rows[0]) : memoryDb.settings;
};

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const [clients, orders, quotations] = await Promise.all([
    listClients(),
    listOrders(),
    listQuotations(),
  ]);

  const pendingBalance = orders.reduce((sum, order) => sum + order.balance, 0);
  const upcomingDeliveries = orders
    .slice()
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))
    .slice(0, 4)
    .map((order) => ({
      id: order.id,
      number: order.number,
      clientName:
        clients.find((client) => client.id === order.clientId)?.name || "Cliente",
      deliveryDate: order.deliveryDate,
      status: order.status,
    }));

  const recentActivity = [
    ...orders.slice(0, 3).map((order) => ({
      id: order.id,
      type: "pedido" as const,
      title: order.number,
      date: order.createdAt,
      detail: `${clients.find((client) => client.id === order.clientId)?.name || "Cliente"} - ${order.status}`,
    })),
    ...quotations.slice(0, 2).map((quotation) => ({
      id: quotation.id,
      type: "cotizacion" as const,
      title: quotation.number,
      date: quotation.date,
      detail: `${quotation.reference} - ${quotation.status}`,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return {
    totalClients: clients.length,
    activeOrders: orders.filter((order) =>
      ["PENDIENTE", "EN_PROCESO", "PAUSADO"].includes(order.status),
    ).length,
    pendingBalance,
    quotationsThisMonth: quotations.length,
    upcomingDeliveries,
    recentActivity,
  };
};
