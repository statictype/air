import { describe, expect, it } from "vitest";
import { speed } from "@/worker/format";
import { isUnitSystem, read } from "./units";

describe("isUnitSystem", () => {
  it("accepts the two members and nothing else", () => {
    expect(isUnitSystem("metric")).toBe(true);
    expect(isUnitSystem("imperial")).toBe(true);
    expect(isUnitSystem("Metric")).toBe(false);
    expect(isUnitSystem("farenheit")).toBe(false);
    expect(isUnitSystem(null)).toBe(false);
    expect(isUnitSystem(undefined)).toBe(false);
  });
});

describe("read", () => {
  it("picks the system out of a pair", () => {
    expect(read(speed(24, 15), "metric").text).toBe("24 km/h");
    expect(read(speed(24, 15), "imperial").text).toBe("15 mph");
  });

  it("dashes rather than throwing when the pair is absent", () => {
    expect(read(undefined, "metric")).toEqual({
      text: "—",
      value: "—",
      suffix: "",
      spoken: "—",
    });
    expect(read(null, "imperial").text).toBe("—");
  });
});
