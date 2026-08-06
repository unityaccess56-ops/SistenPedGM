import { Router, type Request, type Response } from "express";
import {
  convertQuotationToOrder,
  createQuotation,
  getQuotation,
  getSettings,
  listQuotations,
  updateQuotation,
  updateQuotationStatus,
} from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import type { QuotationStatus } from "../types.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req: Request, res: Response) => {
  res.json({ success: true, quotations: await listQuotations() });
});

router.get("/:id", async (req: Request, res: Response) => {
  const quotation = await getQuotation(req.params.id);
  if (!quotation) {
    res.status(404).json({ success: false, error: "Cotizacion no encontrada" });
    return;
  }

  res.json({ success: true, quotation, settings: await getSettings() });
});

router.post("/", async (req: Request, res: Response) => {
  const items = req.body?.items;
  if (!req.body?.clientId || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      success: false,
      error: "Cliente e items son obligatorios",
    });
    return;
  }

  const quotation = await createQuotation(req.body, req.user!.id);
  res.status(201).json({ success: true, quotation });
});

router.patch("/:id", async (req: Request, res: Response) => {
  const quotation = await updateQuotation(req.params.id, req.body);
  if (!quotation) {
    res.status(404).json({ success: false, error: "Cotizacion no encontrada" });
    return;
  }

  res.json({ success: true, quotation });
});

router.post("/:id/aprobar", async (req: Request, res: Response) => {
  const quotation = await updateQuotationStatus(
    req.params.id,
    "APROBADA" as QuotationStatus,
  );
  if (!quotation) {
    res.status(404).json({ success: false, error: "Cotizacion no encontrada" });
    return;
  }

  res.json({ success: true, quotation });
});

router.post("/:id/convertir-pedido", async (req: Request, res: Response) => {
  const order = await convertQuotationToOrder(req.params.id, req.user!.id);
  if (!order) {
    res.status(404).json({ success: false, error: "Cotizacion no encontrada" });
    return;
  }

  res.json({ success: true, order });
});

router.get("/:id/documento", async (req: Request, res: Response) => {
  const quotation = await getQuotation(req.params.id);
  if (!quotation) {
    res.status(404).json({ success: false, error: "Cotizacion no encontrada" });
    return;
  }

  res.json({ success: true, quotation, settings: await getSettings() });
});

export default router;
