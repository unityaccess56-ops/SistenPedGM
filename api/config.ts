const NODE_ENV = process.env.NODE_ENV || "development";

export const isProduction = NODE_ENV === "production";
export const isTest = NODE_ENV === "test";
export const isDevelopment = !isProduction && !isTest;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`La variable de entorno ${name} es obligatoria`);
  }
  return value;
}

function getEnv(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export const JWT_SECRET = isProduction
  ? requireEnv("JWT_SECRET")
  : getEnv("JWT_SECRET", "gisselle-dev-secret");

export const DATABASE_URL = isProduction
  ? requireEnv("DATABASE_URL")
  : getEnv("DATABASE_URL");

export const PORT = Number(getEnv("PORT", "3001"));

export const allowedOrigins = getEnv("CORS_ORIGIN")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const loginRateLimit = {
  maxAttempts: Number(getEnv("LOGIN_RATE_LIMIT_MAX", "5")),
  windowMs: Number(getEnv("LOGIN_RATE_LIMIT_WINDOW_MS", "900000")),
};

export const initialUsers = (() => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const operatorEmail = process.env.OPERATOR_EMAIL?.trim();
  const operatorPassword = process.env.OPERATOR_PASSWORD?.trim();

  if (isProduction) {
    if (!adminEmail || !adminPassword) {
      throw new Error(
        "ADMIN_EMAIL y ADMIN_PASSWORD son obligatorias para iniciar en produccion",
      );
    }
  }

  return [
    {
      id: "user-admin",
      name: process.env.ADMIN_NAME?.trim() || "Administrador",
      email: adminEmail || "Gbarros@gmail.com",
      role: "ADMIN" as const,
      password: adminPassword || "Clave2026",
    },
    ...(operatorEmail && operatorPassword
      ? [
          {
            id: "user-operator",
            name: process.env.OPERATOR_NAME?.trim() || "Operador",
            email: operatorEmail,
            role: "OPERADOR" as const,
            password: operatorPassword,
          },
        ]
      : isProduction
        ? []
        : [
            {
              id: "user-operator",
              name: "Margy Matorel",
              email: "Mmatorel@gmail.com",
              role: "OPERADOR" as const,
              password: "Clave2026",
            },
          ]),
  ];
})();
