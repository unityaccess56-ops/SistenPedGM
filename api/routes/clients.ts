import { Router, type Request, type Response } from "express";
import {
  createClient,
  getClient,
  listClients,
  listOrders,
  listQuotations,
  updateClient,
} from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req: Request, res: Response) => {
  res.json({ success: true, clients: await listClients() });
});

router.get("/:id", async (req: Request, res: Response) => {
  const client = await getClient(req.params.id);
  if (!client) {
    res.status(404).json({ success: false, error: "Cliente no encontrado" });
    return;
  }

  const [orders, quotations] = await Promise.all([
    listOrders(),
    listQuotations(),
  ]);

  res.json({
    success: true,
    client,
    orders: orders.filter((order) => order.clientId === client.id),
    quotations: quotations.filter(
      (quotation) => quotation.clientId === client.id,
    ),
  });
});

router.post("/", async (req: Request, res: Response) => {
  if (!req.body?.name) {
    res.status(400).json({ success: false, error: "El nombre es obligatorio" });
    return;
  }

  const client = await createClient(req.body);
  res.status(201).json({ success: true, client });
});

router.patch("/:id", async (req: Request, res: Response) => {
  const client = await updateClient(req.params.id, req.body);
  if (!client) {
    res.status(404).json({ success: false, error: "Cliente no encontrado" });
    return;
  }

  res.json({ success: true, client });
});

export default router;
