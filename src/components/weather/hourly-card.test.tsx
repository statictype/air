import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HourlyForecast } from "@/api/types";
import { __resetUnitSystemForTests } from "@/hooks/use-unit-system";
import { temperature } from "@/worker/format";
import { HourlyCard } from "./hourly-card";

/** Frozen at 14:30 UTC: the rollover lands on column 9. The default unit
 *  system in this environment is metric, so the columns read 24-hour. */

const TZ = "UTC";
const NOW = "2026-08-12T14:30:00Z";
const ROLLOVER_INDEX = 9;

function hour(at: Date, over: Partial<HourlyForecast> = {}): HourlyForecast {
  const iso = at.toISOString();
  return {
    time: `${iso.slice(0, 10)} ${iso.slice(11, 13)}:00`,
    temp: temperature(18, 64.4),
    feelsLike: temperature(18, 64.4),
    conditionText: "Partly cloudy",
    conditionCode: 1003,
    isDay: true,
    chanceOfRain: 0,
    chanceOfSnow: 0,
    willItRain: false,
    willItSnow: false,
    cloud: 25,
    ...over,
  };
}

function hourly(overrides: Record<number, Partial<HourlyForecast>> = {}): HourlyForecast[] {
  const base = new Date(NOW);
  base.setUTCMinutes(0, 0, 0);
  return Array.from({ length: 24 }, (_, i) =>
    hour(new Date(base.getTime() + (i + 1) * 3_600_000), overrides[i]),
  );
}

function headers(): HTMLElement[] {
  return screen.getAllByRole("columnheader");
}

function row(name: string): HTMLElement[] {
  const tr = screen.getByRole("row", { name: new RegExp(`^${name}`) });
  return within(tr).getAllByRole("cell");
}

beforeEach(() => {
  __resetUnitSystemForTests("metric");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("HourlyCard — the matrix", () => {
  it("puts all three readings on screen at once, one row each", () => {
    render(
      <HourlyCard
        hourly={hourly({
          0: { temp: temperature(26, 78.8), feelsLike: temperature(33, 91.4), chanceOfRain: 45 },
        })}
        tz={TZ}
      />,
    );

    expect(row("Temperature")[0]).toHaveTextContent("26°");
    expect(row("Feels like")[0]).toHaveTextContent("33°");
    expect(row("Chance of precipitation")[0]).toHaveTextContent("45%");
  });

  it("keeps the temperature the headline even when the feels-like is higher", () => {
    render(
      <HourlyCard
        hourly={hourly({ 0: { temp: temperature(26, 78.8), feelsLike: temperature(33, 91.4) } })}
        tz={TZ}
      />,
    );

    expect(row("Temperature")[0]).toHaveClass("hour-cell-lead");
    expect(row("Feels like")[0]).not.toHaveClass("hour-cell-lead");
  });

  it("prints both temperatures where they agree", () => {
    render(
      <HourlyCard
        hourly={hourly({ 0: { temp: temperature(18, 64.4), feelsLike: temperature(18.4, 65.1) } })}
        tz={TZ}
      />,
    );

    expect(row("Temperature")[0]).toHaveTextContent("18°");
    expect(row("Feels like")[0]).toHaveTextContent("18°");
  });

  it("keeps a 1° gap between the temperature and the feels-like", () => {
    render(
      <HourlyCard
        hourly={hourly({ 0: { temp: temperature(12, 53.6), feelsLike: temperature(11, 51.8) } })}
        tz={TZ}
      />,
    );

    expect(row("Temperature")[0]).toHaveTextContent("12°");
    expect(row("Feels like")[0]).toHaveTextContent("11°");
  });

  /** Column labels follow the viewer's locale, which jsdom reports as `en-US`
   *  — a 12-hour clock, whatever the unit system is set to. */
  it("names every column by its hour and its condition", () => {
    render(<HourlyCard hourly={hourly()} tz={TZ} />);

    expect(headers()).toHaveLength(24);
    expect(headers()[0]).toHaveTextContent("3pm");
    expect(headers()[0]).toHaveAccessibleName("3 pm, Partly cloudy");
  });

  it("names the new day where the date rolls over", () => {
    render(<HourlyCard hourly={hourly()} tz={TZ} />);

    expect(headers()[ROLLOVER_INDEX]).toHaveTextContent("Thu");
    expect(headers()[ROLLOVER_INDEX]).toHaveAccessibleName(/^Thursday, 12 am,/);
    expect(headers()[ROLLOVER_INDEX - 1]).toHaveTextContent("11pm");
  });
});

describe("HourlyCard — precipitation", () => {
  it("prints a dry hour as 0%, in the same place as every other chance", () => {
    render(<HourlyCard hourly={hourly()} tz={TZ} />);

    expect(row("Chance of precipitation")[0]).toHaveTextContent("0%");
  });

  it("prints the chance and nothing else, amount included", () => {
    render(<HourlyCard hourly={hourly({ 0: { chanceOfRain: 60, willItRain: true } })} tz={TZ} />);

    const cell = row("Chance of precipitation")[0];
    expect(cell?.textContent).toBe("60%");
  });

  it("reads the snow chance, not the rain chance, on a snowy hour", () => {
    render(
      <HourlyCard
        hourly={hourly({
          0: {
            temp: temperature(-4, 24.8),
            conditionText: "Light snow",
            chanceOfRain: 10,
            chanceOfSnow: 80,
            willItRain: true,
            willItSnow: true,
          },
        })}
        tz={TZ}
      />,
    );

    expect(row("Chance of precipitation")[0]?.textContent).toBe("80%");
  });

  it("reads the snow chance when upstream reports no chance of rain", () => {
    // Upstream reports `chanceOfRain: 0` for a sub-zero hour with snow falling.
    render(
      <HourlyCard
        hourly={hourly({
          0: {
            temp: temperature(-4, 24.8),
            conditionText: "Light snow",
            chanceOfRain: 0,
            chanceOfSnow: 70,
            willItRain: false,
            willItSnow: false,
          },
        })}
        tz={TZ}
      />,
    );

    expect(row("Chance of precipitation")[0]?.textContent).toBe("70%");
  });

  it("prints the chance even when the flag says no precipitation lands", () => {
    render(<HourlyCard hourly={hourly({ 0: { chanceOfRain: 70, willItRain: false } })} tz={TZ} />);

    expect(row("Chance of precipitation")[0]?.textContent).toBe("70%");
  });
});

describe("HourlyCard — the scroll controls", () => {
  it("offers both directions and starts with nowhere to go back to", () => {
    render(<HourlyCard hourly={hourly()} tz={TZ} />);

    // jsdom reports every element as 0×0, so neither end has anything past it.
    expect(screen.getByRole("button", { name: /earlier hours/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /later hours/i })).toBeDisabled();
  });

  it("renders no view-switch toggles", () => {
    render(<HourlyCard hourly={hourly()} tz={TZ} />);

    expect(screen.queryByRole("button", { pressed: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { pressed: false })).not.toBeInTheDocument();
  });

  it("hides every icon from the accessible names", () => {
    const { container } = render(
      <HourlyCard hourly={hourly({ 0: { chanceOfRain: 60, willItRain: true } })} tz={TZ} />,
    );

    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(24);
    icons.forEach((icon) => expect(icon).toHaveAttribute("aria-hidden", "true"));
  });
});

describe("HourlyCard — before the forecast tier lands", () => {
  it("shimmers instead of rendering columns", () => {
    render(<HourlyCard hourly={undefined} tz={TZ} />);

    expect(screen.queryAllByRole("columnheader")).toHaveLength(0);
    expect(screen.getByRole("button", { name: /later hours/i })).toBeInTheDocument();
  });
});
