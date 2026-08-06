import { Router, type Request, type Response } from "express";
import { getDashboardSummary, getSettings } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/resumen", async (_req: Request, res: Response) => {
  res.json({
    success: true,
    summary: await getDashboardSummary(),
    settings: await getSettings(),
  });
});

export default router;
