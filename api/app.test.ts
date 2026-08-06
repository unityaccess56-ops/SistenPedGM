import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "./app";

describe("API principal", () => {
  it("permite iniciar sesion con el usuario demo", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "Gbarros@gmail.com",
      password: "Clave2026",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeTruthy();
  });

  it("protege los endpoints privados", async () => {
    const response = await request(app).get("/api/clientes");
    expect(response.status).toBe(401);
  });

  it("lista clientes cuando la sesion es valida", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "Gbarros@gmail.com",
      password: "Clave2026",
    });

    const response = await request(app)
      .get("/api/clientes")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.clients)).toBe(true);
    expect(response.body.clients.length).toBe(0);
  });
});
