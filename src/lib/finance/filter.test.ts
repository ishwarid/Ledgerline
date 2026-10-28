import { describe, expect, it } from "vitest";
import { createMockBank } from "@/lib/cdr/mock-bank";
import { applyFilters, paginate, parseFilters } from "./filter";
import { enrich } from "./insights";

describe("parseFilters", () => {
  it("keeps valid params", () => {
    expect(
      parseFilters({ q: " coffee ", category: "Eating out", direction: "out", page: "3" }),
    ).toEqual({
      q: "coffee",
      account: undefined,
      category: "Eating out",
      direction: "out",
      page: 3,
    });
  });

  it("drops garbage instead of throwing", () => {
    expect(parseFilters({ category: "Yachts", direction: "sideways", page: "-2" })).toEqual({
      q: undefined,
      account: undefined,
      category: undefined,
      direction: undefined,
      page: 1,
    });
  });

  it("takes the first value when a param is repeated", () => {
    expect(parseFilters({ q: ["rent", "fuel"] }).q).toBe("rent");
  });
});

describe("applyFilters", () => {
  const txns = enrich(createMockBank({ today: new Date("2026-10-12T04:00:00Z") }).transactions);

  it("searches merchant names case-insensitively", () => {
    const result = applyFilters(txns, { q: "little lane", page: 1 });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.merchantName === "Little Lane Coffee")).toBe(true);
  });

  it("combines filters", () => {
    const result = applyFilters(txns, { category: "Income", direction: "in", page: 1 });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.category === "Income" && t.amountCents > 0)).toBe(true);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 30 }, (_, i) => i);

  it("slices pages", () => {
    expect(paginate(items, 2, 25)).toEqual({ items: [25, 26, 27, 28, 29], page: 2, pageCount: 2 });
  });

  it("clamps a page number past the end", () => {
    expect(paginate(items, 9, 25).page).toBe(2);
  });
});
