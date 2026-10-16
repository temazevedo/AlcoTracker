import { parseDecimal } from "./parseDecimal";

describe("parseDecimal", () => {
  it("parses dot decimals", () => {
    expect(parseDecimal("5")).toBe(5);
    expect(parseDecimal("5.0")).toBe(5);
    expect(parseDecimal("0.15")).toBe(0.15);
  });

  it("parses comma decimals (pt-PT keyboard)", () => {
    expect(parseDecimal("5,0")).toBe(5);
    expect(parseDecimal("0,15")).toBe(0.15);
    expect(parseDecimal(",5")).toBe(0.5);
  });

  it("ignores spaces", () => {
    expect(parseDecimal("  1 000 ")).toBe(1000);
  });

  it("returns NaN for malformed input", () => {
    expect(parseDecimal("abc")).toBeNaN();
    expect(parseDecimal("")).toBeNaN();
  });
});
