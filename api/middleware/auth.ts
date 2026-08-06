import type { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { findUserById, publicUser } from "../data/store.js";
import type { AuthenticatedRequestUser } from "../types.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedRequestUser;
  }
}

export const createToken = (user: AuthenticatedRequestUser) =>
  jwt.sign(user, JWT_SECRET, { expiresIn: "8h" });

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    res.status(401).json({ success: false, error: "No autorizado" });
    return;
  }

  (async () => {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthenticatedRequestUser;
      const user = await findUserById(payload.id);
      if (!user) {
        res.status(401).json({ success: false, error: "Sesion invalida" });
        return;
      }

      req.user = publicUser(user);
      next();
    } catch {
      res.status(401).json({ success: false, error: "Token invalido" });
    }
  })();
};
