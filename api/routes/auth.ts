import { compare } from "bcryptjs";
import { Router, type Request, type Response } from "express";
import { findUserByEmail, publicUser } from "../data/store.js";
import { createToken, requireAuth } from "../middleware/auth.js";
import { authRateLimit, clearAuthRateLimit } from "../middleware/rate-limit.js";

const router = Router();

router.post(
  "/login",
  authRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const email = req.body?.email?.trim?.();
      const password = req.body?.password?.trim?.();

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: "Correo y contrasena son obligatorios",
        });
        return;
      }

      const user = await findUserByEmail(email);
      if (!user) {
        res
          .status(401)
          .json({ success: false, error: "Credenciales invalidas" });
        return;
      }

      const isValid = await compare(password, user.passwordHash);
      if (!isValid) {
        res
          .status(401)
          .json({ success: false, error: "Credenciales invalidas" });
        return;
      }

      const safeUser = publicUser(user);
      clearAuthRateLimit(req);
      res.json({
        success: true,
        token: createToken(safeUser),
        user: safeUser,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] /auth/login: ${msg}`);
      res.status(500).json({
        success: false,
        error: "No fue posible iniciar sesion. Intenta de nuevo.",
      });
    }
  },
);

router.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({ success: true, user: req.user });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] /auth/me: ${msg}`);
      res.status(500).json({
        success: false,
        error: "No fue posible obtener el usuario.",
      });
    }
  },
);

router.post(
  "/logout",
  async (_req: Request, res: Response): Promise<void> => {
    res.json({ success: true });
  },
);

export default router;
