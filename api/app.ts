import cors from "cors";
import dotenv from "dotenv";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import fs from "fs";
import path from "path";
import authRoutes from "./routes/auth.js";
import clientRoutes from "./routes/clients.js";
import { allowedOrigins, isProduction } from "./config.js";
import { initializeStore } from "./data/store.js";
import dashboardRoutes from "./routes/dashboard.js";
import orderRoutes from "./routes/orders.js";
import quotationRoutes from "./routes/quotations.js";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");
const indexHtmlPath = path.join(distPath, "index.html");

await initializeStore();

const app: express.Application = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (!allowedOrigins.length && !isProduction) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origen no permitido por CORS"));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/clientes", clientRoutes);
app.use("/api/pedidos", orderRoutes);
app.use("/api/cotizaciones", quotationRoutes);

app.get("/api/health", (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: "ok",
  });
});

if (fs.existsSync(distPath) && fs.existsSync(indexHtmlPath)) {
  app.use(
    express.static(distPath, {
      index: false,
      dotfiles: "deny",
      maxAge: isProduction ? "1y" : 0,
      fallthrough: true,
      setHeaders(res, filePath) {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  app.get("^/assets/*", (_req: Request, res: Response) => {
    res.status(404).set("Content-Type", "text/plain").send("Not found");
  });

  app.get(/^\/(?!api).*/, (_req: Request, res: Response) => {
    res.sendFile(indexHtmlPath, {
      headers: {
        "Cache-Control": "no-cache",
      },
    });
  });
}

app.use(
  (error: Error, _req: Request, res: Response, _next: NextFunction): void => {
    res.status(500).json({
      success: false,
      error: error.message || "Error interno del servidor",
    });
  },
);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "API no encontrada",
  });
});

export default app;
