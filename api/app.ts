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
import { allowedOrigins, initialUsers, isProduction, startupWarnings } from "./config.js";
import { isDatabaseConfigured } from "./data/database.js";
import { listUsers } from "./data/store.js";
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

const distExists = fs.existsSync(distPath);
const indexExists = distExists && fs.existsSync(indexHtmlPath);

const storeInitPromise = initializeStore()
  .then(() => {
    console.log("[INFO] Store inicializada correctamente.");
  })
  .catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    startupWarnings.push(`initializeStore FAILED: ${msg}`);
    console.error(`[ERROR] initializeStore FAILED: ${msg}`);
    console.error(
      "[WARN] La app seguira corriendo, pero las rutas /api/* pueden fallar. Revisa variables de entorno y PostgreSQL.",
    );
  });

const app: express.Application = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.get("/api/health", async (_req: Request, res: Response): Promise<void> => {
  void storeInitPromise;
  const expectedEmails = initialUsers.map((u) => u.email);
  let actualUsers: Array<{ email: string; role: string; name: string }> = [];
  let usersError = "";
  try {
    actualUsers = (await listUsers()) as Array<{
      email: string;
      role: string;
      name: string;
    }>;
  } catch (err) {
    usersError = err instanceof Error ? err.message : String(err);
  }
  res.status(200).json({
    success: true,
    message: "ok",
    nodeEnv: process.env.NODE_ENV || "development",
    port: process.env.PORT || "3001",
    distPath,
    distExists,
    indexExists,
    databaseConfigured: isDatabaseConfigured(),
    databaseUrlSet: Boolean(process.env.DATABASE_URL),
    expectedUsers: expectedEmails,
    actualUsers,
    usersError,
    startupWarnings,
  });
});

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

const permissiveCors = allowedOrigins.length === 0;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (permissiveCors) {
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
      callback(null, false);
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

if (distExists) {
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
}

app.get(/^\/assets\/.*/, (_req: Request, res: Response) => {
  res
    .status(404)
    .set("Content-Type", "text/plain; charset=utf-8")
    .send(`Asset not found. distExists=${distExists} indexExists=${indexExists}`);
});

app.get(/^\/(?!api).*/, (_req: Request, res: Response) => {
  if (indexExists) {
    res.sendFile(indexHtmlPath, {
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    return;
  }
  res
    .status(200)
    .set("Content-Type", "text/html; charset=utf-8")
    .send(
      `<!doctype html><html><head><meta charset="utf-8"><title>Build pendiente</title></head>` +
        `<body style="font-family:system-ui;padding:40px;line-height:1.6">` +
        `<h1>Frontend no construido</h1>` +
        `<p>No se encontro <code>dist/index.html</code>.</p>` +
        `<ul>` +
        `<li>distPath: <code>${distPath}</code> (existe: <b>${distExists}</b>)</li>` +
        `<li>index.html: <code>${indexHtmlPath}</code> (existe: <b>${indexExists}</b>)</li>` +
        `</ul>` +
        `<p>Validar en Render que el build command <code>npm install && npm run build</code> termine sin errores.</p>` +
        (startupWarnings.length
          ? `<h2>Advertencias de inicio:</h2><ul>` +
            startupWarnings.map((w) => `<li>${w}</li>`).join("") +
            `</ul>`
          : ``) +
        `<p>Revisa el <b>health</b>: <a href="/api/health">/api/health</a></p>` +
        `</body></html>`,
    );
});

app.use(
  (error: Error, req: Request, res: Response, _next: NextFunction): void => {
    const msg = error.message || "Error interno del servidor";
    console.error(`[ERROR] ${req.method} ${req.url} -> ${msg}`);
    if (req.url.startsWith("/api/")) {
      res.status(500).json({
        success: false,
        error: msg,
      });
      return;
    }
    res
      .status(500)
      .set("Content-Type", "text/plain; charset=utf-8")
      .send(`Server error: ${msg}`);
  },
);

app.use((req: Request, res: Response) => {
  if (req.url.startsWith("/api/")) {
    res.status(404).json({
      success: false,
      error: "API no encontrada",
    });
    return;
  }
  if (indexExists) {
    res.sendFile(indexHtmlPath, {
      headers: { "Cache-Control": "no-cache" },
    });
    return;
  }
  res
    .status(404)
    .set("Content-Type", "text/plain; charset=utf-8")
    .send("Not found");
});

export default app;
