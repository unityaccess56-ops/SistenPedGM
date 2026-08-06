export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));

export const calculateItemsTotal = (
  items: Array<{ quantity: number; unitPrice: number }>,
) => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

export const statusTone = (status: string) => {
  if (["APROBADA", "ENTREGADO", "FACTURADO"].includes(status)) {
    return "emerald";
  }

  if (["EN_PROCESO", "ENVIADA"].includes(status)) {
    return "sky";
  }

  if (["PAUSADO", "RECHAZADA", "VENCIDA", "CANCELADO"].includes(status)) {
    return "rose";
  }

  return "amber";
};
