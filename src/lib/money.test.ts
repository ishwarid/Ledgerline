import { describe, expect, it } from "vitest";
import { formatAUD, fromCents, toCents } from "./money";

describe("toCents", () => {
  it.each([
    ["42.50", 4250],
    ["-42.50", -4250],
    ["0.1", 10],
    ["7", 700],
    ["-0.05", -5],
    ["  12.34 ", 1234],
  ])("parses %s", (input, expected) => {
    expect(toCents(input)).toBe(expected);
  });

  it("rejects anything that isn't a CDR amount", () => {
    expect(() => toCents("12.345")).toThrow();
    expect(() => toCents("$12")).toThrow();
    expect(() => toCents("")).toThrow();
  });

  it("does not suffer from float drift", () => {
    const total = ["0.10", "0.20"].map(toCents).reduce((a, b) => a + b, 0);
    expect(fromCents(total)).toBe("0.30");
  });
});

describe("fromCents", () => {
  it("round-trips", () => {
    for (const amount of ["0.00", "-0.05", "1234.56", "-2640.00"]) {
      expect(fromCents(toCents(amount))).toBe(amount);
    }
  });
});

describe("formatAUD", () => {
  it("formats Australian dollars", () => {
    expect(formatAUD(123456)).toBe("$1,234.56");
    expect(formatAUD(-500)).toBe("-$5.00");
  });

  it("adds a plus sign only when asked", () => {
    expect(formatAUD(500, { signed: true })).toBe("+$5.00");
    expect(formatAUD(-500, { signed: true })).toBe("-$5.00");
  });
});
