import { Router, type Request, type Response } from "express";
import {
  createOrder,
  getOrder,
  listOrders,
  updateOrder,
  updateOrderStatus,
} from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import type { OrderStatus } from "../types.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, orders: await listOrders() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] GET /pedidos: ${msg}`);
    res.status(500).json({
      success: false,
      error: "No fue posible listar los pedidos.",
    });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const order = await getOrder(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, error: "Pedido no encontrado" });
      return;
    }

    res.json({ success: true, order });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] GET /pedidos/:id: ${msg}`);
    res.status(500).json({
      success: false,
      error: "No fue posible obtener el pedido.",
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

    const order = await createOrder(req.body, req.user!.id);
    res.status(201).json({ success: true, order });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] POST /pedidos: ${msg}`);
    res.status(500).json({
      success: false,
      error: "No fue posible crear el pedido.",
    });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const order = await updateOrder(req.params.id, req.body);
    if (!order) {
      res.status(404).json({ success: false, error: "Pedido no encontrado" });
      return;
    }

    res.json({ success: true, order });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] PATCH /pedidos/:id: ${msg}`);
    res.status(500).json({
      success: false,
      error: "No fue posible actualizar el pedido.",
    });
  }
});

router.patch("/:id/estado", async (req: Request, res: Response) => {
  try {
    const order = await updateOrderStatus(
      req.params.id,
      req.body?.status as OrderStatus,
    );
    if (!order) {
      res.status(404).json({ success: false, error: "Pedido no encontrado" });
      return;
    }

    res.json({ success: true, order });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] PATCH /pedidos/:id/estado: ${msg}`);
    res.status(500).json({
      success: false,
      error: "No fue posible actualizar el estado del pedido.",
    });
  }
});

export default router;
