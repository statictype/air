import { describe, expect, it } from "vitest";
import { precipAmountPair, precipPair } from "./precip";

describe("precipPair", () => {
  it("takes its decimals from the figure: 0 at 10 and up, 1 below 10, 2 below 1", () => {
    expect(precipPair(31.24, "cm")?.metric.text).toBe("31 cm");
    expect(precipPair(4.2, "mm")?.metric.text).toBe("4.2 mm");
    expect(precipPair(0.42, "mm")?.metric.text).toBe("0.42 mm");
  });

  it("drops a trailing zero, so a whole figure prints whole", () => {
    expect(precipPair(4, "mm")).toEqual({
      metric: { text: "4 mm", value: "4", suffix: "mm", spoken: "4 millimetres" },
      imperial: { text: "0.16 in", value: "0.16", suffix: "in", spoken: "0.16 inches" },
    });
    expect(precipPair(0.4, "mm")?.metric.text).toBe("0.4 mm");
    expect(precipPair(0.4, "mm")?.imperial.text).toBe("0.02 in");
  });

  it("puts a space between the figure and the unit", () => {
    expect(precipPair(9, "mm")?.metric.text).toBe("9 mm");
  });

  it("returns null at a rounded zero — that is a second way of saying 0%", () => {
    expect(precipPair(0, "mm")).toBeNull();
    expect(precipPair(0.004, "mm")).toBeNull();
  });

  it("decides the null once for the pair, so the toggle adds no element", () => {
    // 0.12 mm is 0.0047 in, which rounds to 0.00 — both systems suppress it.
    expect(precipPair(0.12, "mm")).toBeNull();
    // 0.13 mm is 0.0051 in, which rounds to 0.01 — both systems print.
    expect(precipPair(0.13, "mm")?.metric.text).toBe("0.13 mm");
    expect(precipPair(0.13, "mm")?.imperial.text).toBe("0.01 in");
  });

  it("returns null for a non-finite value, so a stale payload cannot print NaN", () => {
    expect(precipPair(Number.NaN, "mm")).toBeNull();
    expect(precipPair(undefined as unknown as number, "cm")).toBeNull();
  });
});

describe("precipAmountPair", () => {
  it("prints a zero, because the Now dialog names a row that always renders", () => {
    expect(precipAmountPair(0, "mm")).toEqual({
      metric: { text: "0 mm", value: "0", suffix: "mm", spoken: "0 millimetres" },
      imperial: { text: "0 in", value: "0", suffix: "in", spoken: "0 inches" },
    });
  });
});
