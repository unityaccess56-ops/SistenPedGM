import type { Request, Response, NextFunction } from "express";
import { loginRateLimit } from "../config.js";

type AttemptEntry = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, AttemptEntry>();

function getClientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function authRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = getClientKey(req);
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || now > current.resetAt) {
    attempts.set(key, {
      count: 1,
      resetAt: now + loginRateLimit.windowMs,
    });
    next();
    return;
  }

  if (current.count >= loginRateLimit.maxAttempts) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: "Demasiados intentos de inicio de sesion. Intenta de nuevo mas tarde.",
    });
    return;
  }

  current.count += 1;
  attempts.set(key, current);
  next();
}

export function clearAuthRateLimit(req: Request) {
  attempts.delete(getClientKey(req));
}
