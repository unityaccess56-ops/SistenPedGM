import { describe, expect, it } from "vitest";
import { calculateItemsTotal, formatCurrency, statusTone } from "./format";

describe("format utils", () => {
  it("calcula el total de los items", () => {
    expect(
      calculateItemsTotal([
        { quantity: 2, unitPrice: 10000 },
        { quantity: 1, unitPrice: 5000 },
      ]),
    ).toBe(25000);
  });

  it("formatea moneda en COP", () => {
    expect(formatCurrency(160000)).toContain("160.000");
  });

  it("resuelve el tono segun el estado", () => {
    expect(statusTone("APROBADA")).toBe("emerald");
    expect(statusTone("EN_PROCESO")).toBe("sky");
    expect(statusTone("CANCELADO")).toBe("rose");
    expect(statusTone("PENDIENTE")).toBe("amber");
  });
});
