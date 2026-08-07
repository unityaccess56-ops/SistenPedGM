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
  try {
    res.json({ success: true, quotations: await listQuotations() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] GET /cotizaciones: ${msg}`);
    res.status(500).json({
      success: false,
      error: "No fue posible listar las cotizaciones.",
    });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const quotation = await getQuotation(req.params.id);
    if (!quotation) {
      res
        .status(404)
        .json({ success: false, error: "Cotizacion no encontrada" });
      return;
    }

    res.json({
      success: true,
      quotation,
      settings: await getSettings(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] GET /cotizaciones/:id: ${msg}`);
    res.status(500).json({
      success: false,
      error: "No fue posible obtener la cotizacion.",
    });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] POST /cotizaciones: ${msg}`);
    res.status(500).json({
      success: false,
      error: "No fue posible crear la cotizacion.",
    });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const quotation = await updateQuotation(req.params.id, req.body);
    if (!quotation) {
      res
        .status(404)
        .json({ success: false, error: "Cotizacion no encontrada" });
      return;
    }

    res.json({ success: true, quotation });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] PATCH /cotizaciones/:id: ${msg}`);
    res.status(500).json({
      success: false,
      error: "No fue posible actualizar la cotizacion.",
    });
  }
});

router.post("/:id/aprobar", async (req: Request, res: Response) => {
  try {
    const quotation = await updateQuotationStatus(
      req.params.id,
      "APROBADA" as QuotationStatus,
    );
    if (!quotation) {
      res
        .status(404)
        .json({ success: false, error: "Cotizacion no encontrada" });
      return;
    }

    res.json({ success: true, quotation });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] POST /cotizaciones/:id/aprobar: ${msg}`);
    res.status(500).json({
      success: false,
      error: "No fue posible aprobar la cotizacion.",
    });
  }
});

router.post("/:id/convertir-pedido", async (req: Request, res: Response) => {
  try {
    const order = await convertQuotationToOrder(req.params.id, req.user!.id);
    if (!order) {
      res
        .status(404)
        .json({ success: false, error: "Cotizacion no encontrada" });
      return;
    }

    res.json({ success: true, order });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] POST /cotizaciones/:id/convertir-pedido: ${msg}`);
    res.status(500).json({
      success: false,
      error: "No fue posible convertir la cotizacion a pedido.",
    });
  }
});

router.get("/:id/documento", async (req: Request, res: Response) => {
  try {
    const quotation = await getQuotation(req.params.id);
    if (!quotation) {
      res
        .status(404)
        .json({ success: false, error: "Cotizacion no encontrada" });
      return;
    }

    res.json({
      success: true,
      quotation,
      settings: await getSettings(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] GET /cotizaciones/:id/documento: ${msg}`);
    res.status(500).json({
      success: false,
      error: "No fue posible obtener el documento de cotizacion.",
    });
  }
});

export default router;
