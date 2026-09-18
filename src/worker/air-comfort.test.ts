import { describe, expect, it } from "vitest";
import type { AirLabel, ThermalLabel } from "@/lib/schemas";
import { airComfort } from "./air-comfort";

interface Row {
  location: string;
  tempC: number;
  feelsLikeC: number;
  dewpointC: number;
  humidity: number;
  thermal: ThermalLabel;
  air: AirLabel;
}

const referenceRows: Row[] = [
  {
    location: "Cairo",
    tempC: 29,
    feelsLikeC: 27,
    dewpointC: 3,
    humidity: 15,
    thermal: "Warm",
    air: "Dry",
  },
  {
    location: "Panipat",
    tempC: 43,
    feelsLikeC: 45,
    dewpointC: 9,
    humidity: 13,
    thermal: "Dangerously hot",
    air: "Slightly dry",
  },
  {
    location: "Beijing",
    tempC: 29,
    feelsLikeC: 27,
    dewpointC: 1,
    humidity: 43,
    thermal: "Warm",
    air: "Dry",
  },
  {
    location: "Dungarvan",
    tempC: 10,
    feelsLikeC: 8,
    dewpointC: 7,
    humidity: 82,
    thermal: "Chilly",
    air: "Damp",
  },
  {
    location: "Berlin",
    tempC: 16,
    feelsLikeC: 16,
    dewpointC: 10,
    humidity: 72,
    thermal: "Mild",
    air: "Comfortable",
  },
  {
    location: "Bali",
    tempC: 29,
    feelsLikeC: 32,
    dewpointC: 23,
    humidity: 70,
    thermal: "Hot",
    air: "Humid",
  },
  {
    location: "Nuuk",
    tempC: 2,
    feelsLikeC: -5,
    dewpointC: 0,
    humidity: 93,
    thermal: "Cold",
    air: "Damp",
  },
  {
    location: "Moscow",
    tempC: 10,
    feelsLikeC: 9,
    dewpointC: 8,
    humidity: 87,
    thermal: "Chilly",
    air: "Damp",
  },
  {
    location: "Grand Canyon",
    tempC: 2,
    feelsLikeC: -1,
    dewpointC: -12,
    humidity: 28,
    thermal: "Cold",
    air: "Very dry",
  },
  {
    location: "Las Vegas",
    tempC: 26,
    feelsLikeC: 24,
    dewpointC: -11,
    humidity: 16,
    thermal: "Warm",
    air: "Very dry",
  },
  {
    location: "Kufra",
    tempC: 24,
    feelsLikeC: 24,
    dewpointC: 6,
    humidity: 32,
    thermal: "Warm",
    air: "Slightly dry",
  },
  {
    location: "Windhoek",
    tempC: 23,
    feelsLikeC: 23,
    dewpointC: -16,
    humidity: 7,
    thermal: "Warm",
    air: "Very dry",
  },
  {
    location: "Algiers",
    tempC: 23,
    feelsLikeC: 25,
    dewpointC: 13,
    humidity: 47,
    thermal: "Warm",
    air: "Comfortable",
  },
  {
    location: "New York",
    tempC: 12,
    feelsLikeC: 10,
    dewpointC: -2,
    humidity: 38,
    thermal: "Cool",
    air: "Dry",
  },
  {
    location: "Los Angeles",
    tempC: 17,
    feelsLikeC: 17,
    dewpointC: 15,
    humidity: 84,
    thermal: "Mild",
    air: "Comfortable",
  },
  {
    location: "Hammerfest",
    tempC: 11,
    feelsLikeC: 11,
    dewpointC: 4,
    humidity: 40,
    thermal: "Cool",
    air: "Slightly dry",
  },
  {
    location: "Tripoli",
    tempC: 22,
    feelsLikeC: 25,
    dewpointC: 14,
    humidity: 60,
    thermal: "Warm",
    air: "Comfortable",
  },
  {
    location: "Doha",
    tempC: 40,
    feelsLikeC: 40,
    dewpointC: 8,
    humidity: 10,
    thermal: "Dangerously hot",
    air: "Slightly dry",
  },
  {
    location: "Kananga",
    tempC: 24,
    feelsLikeC: 26,
    dewpointC: 21,
    humidity: 81,
    thermal: "Warm",
    air: "Humid",
  },
  {
    location: "Porto Velho",
    tempC: 19,
    feelsLikeC: 19,
    dewpointC: 16,
    humidity: 83,
    thermal: "Mild",
    air: "Slightly humid",
  },
  {
    location: "Ha, Bhutan",
    tempC: 14,
    feelsLikeC: 13,
    dewpointC: 8,
    humidity: 69,
    thermal: "Cool",
    air: "Slightly dry",
  },
  {
    location: "Lima",
    tempC: 20,
    feelsLikeC: 20,
    dewpointC: 18,
    humidity: 87,
    thermal: "Mild",
    air: "Slightly humid",
  },
  {
    location: "Ushuaia",
    tempC: 6,
    feelsLikeC: 5,
    dewpointC: 0,
    humidity: 65,
    thermal: "Chilly",
    air: "Dry",
  },
  {
    location: "Perth",
    tempC: 21,
    feelsLikeC: 21,
    dewpointC: 11,
    humidity: 31,
    thermal: "Mild",
    air: "Comfortable",
  },
  {
    location: "Sichuan",
    tempC: 28,
    feelsLikeC: 28,
    dewpointC: 12,
    humidity: 37,
    thermal: "Warm",
    air: "Comfortable",
  },
  {
    location: "Kuala Lumpur",
    tempC: 32,
    feelsLikeC: 47,
    dewpointC: 25,
    humidity: 71,
    thermal: "Dangerously hot",
    air: "Very humid",
  },
];

describe("airComfort — reference data", () => {
  it.each(referenceRows)(
    "$location → $thermal · $air",
    ({ tempC, feelsLikeC, dewpointC, humidity, thermal, air }) => {
      const result = airComfort({ tempC, feelsLikeC, dewpointC, humidity });
      expect(result.thermal).toBe(thermal);
      expect(result.air).toBe(air);
    },
  );
});

const thermalBoundaries: Array<[number, ThermalLabel]> = [
  [-6, "Very cold"],
  [-5, "Cold"],
  [3.99, "Cold"],
  [4, "Chilly"],
  [9.99, "Chilly"],
  [10, "Cool"],
  [15.99, "Cool"],
  [16, "Mild"],
  [21.99, "Mild"],
  [22, "Warm"],
  [28.99, "Warm"],
  [29, "Hot"],
  [34.99, "Hot"],
  [35, "Very hot"],
  [39.99, "Very hot"],
  [40, "Dangerously hot"],
];

describe("airComfort — thermal boundaries", () => {
  it.each(thermalBoundaries)("feels-like %s → %s", (feelsLikeC, expected) => {
    const result = airComfort({
      tempC: 20,
      feelsLikeC,
      dewpointC: 5,
      humidity: 50,
    });
    expect(result.thermal).toBe(expected);
  });
});

const airBoundaries: Array<[number, AirLabel]> = [
  [-5, "Very dry"],
  [-4, "Dry"],
  [3.99, "Dry"],
  [4, "Slightly dry"],
  [9.99, "Slightly dry"],
  [10, "Comfortable"],
  [15.99, "Comfortable"],
  [16, "Slightly humid"],
  [20.99, "Slightly humid"],
  [21, "Humid"],
  [23.99, "Humid"],
  [24, "Very humid"],
];

describe("airComfort — air boundaries (no damp)", () => {
  it.each(airBoundaries)("dew %s → %s", (dewpointC, expected) => {
    const result = airComfort({
      tempC: 20,
      feelsLikeC: 20,
      dewpointC,
      humidity: 50,
    });
    expect(result.air).toBe(expected);
  });
});

describe("airComfort — damp override", () => {
  it("fires when tempC < 12 AND humidity > 80", () => {
    const result = airComfort({
      tempC: 10,
      feelsLikeC: 8,
      dewpointC: 7,
      humidity: 81,
    });
    expect(result.air).toBe("Damp");
  });

  it("does not fire when tempC equals 12 (operator is strict)", () => {
    const result = airComfort({
      tempC: 12,
      feelsLikeC: 12,
      dewpointC: 7,
      humidity: 95,
    });
    expect(result.air).toBe("Slightly dry");
  });

  it("does not fire when humidity equals 80 (operator is strict)", () => {
    const result = airComfort({
      tempC: 10,
      feelsLikeC: 8,
      dewpointC: 7,
      humidity: 80,
    });
    expect(result.air).toBe("Slightly dry");
  });

  it("fires for humidity 80.01", () => {
    const result = airComfort({
      tempC: 10,
      feelsLikeC: 8,
      dewpointC: 7,
      humidity: 80.01,
    });
    expect(result.air).toBe("Damp");
  });

  it("co-exists with extreme cold (override doesn't suppress thermal)", () => {
    const result = airComfort({
      tempC: -2,
      feelsLikeC: -8,
      dewpointC: -3,
      humidity: 95,
    });
    expect(result.thermal).toBe("Very cold");
    expect(result.air).toBe("Damp");
  });
});

describe("airComfort — sentence format", () => {
  it("composes thermal-first, lowercase rest", () => {
    expect(airComfort({ tempC: 20, feelsLikeC: 17, dewpointC: 12, humidity: 55 }).sentence).toBe(
      "Mild and comfortable",
    );
  });

  it("joins a damp reading with 'and'", () => {
    expect(airComfort({ tempC: 10, feelsLikeC: 8, dewpointC: 7, humidity: 85 }).sentence).toBe(
      "Chilly and damp",
    );
  });

  it("lowercases a multi-word air label in full", () => {
    expect(airComfort({ tempC: 35, feelsLikeC: 47, dewpointC: 25, humidity: 71 }).sentence).toBe(
      "Dangerously hot and very humid",
    );
  });
});

const comfortSentences: Array<[ThermalLabel, number, string]> = [
  ["Very cold", -10, "Very cold"],
  ["Cold", 0, "Cold"],
  ["Chilly", 8, "Chilly"],
  ["Cool", 13, "Cool but comfortable"],
  ["Mild", 18, "Mild and comfortable"],
  ["Warm", 25, "Warm and comfortable"],
  ["Hot", 31, "Hot but comfortable"],
  ["Very hot", 37, "Very hot"],
  ["Dangerously hot", 41, "Dangerously hot"],
];

describe("airComfort — comfortable is licensed by the thermal band", () => {
  it.each(comfortSentences)("%s at dew 12 → %s", (thermal, feelsLikeC, expected) => {
    const result = airComfort({ tempC: 30, feelsLikeC, dewpointC: 12, humidity: 40 });
    expect(result.thermal).toBe(thermal);
    expect(result.air).toBe("Comfortable");
    expect(result.sentence).toBe(expected);
  });

  const hotCutoff: Array<[number, string]> = [
    [29, "Hot but comfortable"],
    [31.99, "Hot but comfortable"],
    [32, "Hot"],
    [34.99, "Hot"],
  ];

  it.each(hotCutoff)("feels-like %s concedes only below 32 → %s", (feelsLikeC, expected) => {
    expect(airComfort({ tempC: 35, feelsLikeC, dewpointC: 12, humidity: 40 }).sentence).toBe(
      expected,
    );
  });

  it("leaves other air labels untouched above the hot cutoff", () => {
    expect(airComfort({ tempC: 35, feelsLikeC: 33, dewpointC: 22, humidity: 55 }).sentence).toBe(
      "Hot and humid",
    );
  });
});
