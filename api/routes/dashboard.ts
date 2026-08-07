import { Router, type Request, type Response } from "express";
import { getDashboardSummary, getSettings } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/resumen", async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      summary: await getDashboardSummary(),
      settings: await getSettings(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] GET /dashboard/resumen: ${msg}`);
    res.status(500).json({
      success: false,
      error: "No fue posible cargar el resumen.",
    });
  }
});

export default router;
