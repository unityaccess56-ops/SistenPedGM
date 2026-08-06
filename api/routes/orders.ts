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
  res.json({ success: true, orders: await listOrders() });
});

router.get("/:id", async (req: Request, res: Response) => {
  const order = await getOrder(req.params.id);
  if (!order) {
    res.status(404).json({ success: false, error: "Pedido no encontrado" });
    return;
  }

  res.json({ success: true, order });
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

  const order = await createOrder(req.body, req.user!.id);
  res.status(201).json({ success: true, order });
});

router.patch("/:id", async (req: Request, res: Response) => {
  const order = await updateOrder(req.params.id, req.body);
  if (!order) {
    res.status(404).json({ success: false, error: "Pedido no encontrado" });
    return;
  }

  res.json({ success: true, order });
});

router.patch("/:id/estado", async (req: Request, res: Response) => {
  const order = await updateOrderStatus(
    req.params.id,
    req.body?.status as OrderStatus,
  );
  if (!order) {
    res.status(404).json({ success: false, error: "Pedido no encontrado" });
    return;
  }

  res.json({ success: true, order });
});

export default router;
