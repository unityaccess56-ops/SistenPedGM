import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/format";
import type { Client, Quotation, Settings } from "@/types";

export function downloadQuotationPdf(
  quotation: Quotation,
  client: Client | undefined,
  settings: Settings | null,
) {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const left = 48;
  let y = 56;

  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, 595, 88, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(settings?.businessName || "Nombre de tu negocio", left, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${settings?.city || quotation.city} - ${quotation.date}`, left, y);

  y = 122;
  doc.setTextColor(24, 24, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Cliente", left, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(client?.name || "Cliente", left, y);
  y += 14;
  if (client?.company) {
    doc.text(client.company, left, y);
    y += 14;
  }
  if (client?.address) {
    doc.text(client.address, left, y);
    y += 14;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Referencia", 360, 122);
  doc.setFont("helvetica", "normal");
  doc.text(quotation.reference, 360, 140);
  doc.text(`Cotizacion: ${quotation.number}`, 360, 154);

  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const introLines = doc.splitTextToSize(quotation.intro, 500);
  doc.text(introLines, left, y);
  y += introLines.length * 14 + 20;

  autoTable(doc, {
    startY: y,
    head: [["Producto", "Medida", "Cantidad", "Valor unitario", "Subtotal"]],
    body: quotation.items.map((item) => [
      item.description,
      item.measure,
      String(item.quantity),
      formatCurrency(item.unitPrice),
      formatCurrency(item.subtotal),
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 8,
      textColor: [39, 39, 42],
    },
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [255, 255, 255],
    },
    theme: "grid",
  });

  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y;
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.text("Condiciones de pago", left, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.text(`Anticipo: ${quotation.advancePercentage}%`, left, y);
  y += 14;
  doc.text(`Saldo: ${quotation.balancePercentage}% contra entrega.`, left, y);
  y += 18;
  const noteLines = doc.splitTextToSize(quotation.notes, 500);
  doc.text(noteLines, left, y);

  doc.setFillColor(244, 244, 245);
  doc.roundedRect(350, y - 16, 180, 70, 14, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Total", 366, y + 8);
  doc.setFontSize(18);
  doc.text(formatCurrency(quotation.total), 366, y + 34);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Vigencia: ${quotation.validityDays} dias`, 366, y + 52);

  y += Math.max(noteLines.length * 14 + 40, 96);

  (settings?.signatures || []).slice(0, 2).forEach((signature, index) => {
    const startX = left + index * 240;
    doc.line(startX, y + 24, startX + 170, y + 24);
    doc.text(signature.name, startX, y + 40);
    doc.text(signature.role, startX, y + 54);
  });

  doc.save(`${quotation.number}.pdf`);
}
