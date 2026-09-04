import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { ForecastDay } from "@/api/types";
import { __resetUnitSystemForTests } from "@/hooks/use-unit-system";
import { temperature } from "@/worker/format";
import { precipPair } from "@/worker/precip";
import { ForecastCard } from "./forecast-card";

/** Index 0 of the payload is today, which the card leads with. It renders that
 *  day and whatever future days follow — 2 on a free key, 3 on a paid one —
 *  each with its own precipitation line. */

function day(date: string, over: Partial<ForecastDay> = {}): ForecastDay {
  return {
    date,
    min: temperature(8, 46.4),
    max: temperature(15.5, 59.9),
    chanceOfRain: 20,
    willItRain: false,
    chanceOfSnow: 0,
    willItSnow: false,
    totalPrecip: null,
    totalSnow: null,
    conditionText: "Partly cloudy",
    conditionCode: 1003,
    isDay: true,
    ...over,
  };
}

/** Mondays, so the weekday labels below are stable regardless of the run date. */
const TODAY = "2026-04-06";
const DAYS = ["2026-04-07", "2026-04-08", "2026-04-09"];

function labels(): string[] {
  return screen
    .queryAllByText(/^(today|tomorrow|mon|tue|wed|thu|fri|sat|sun)$/i)
    .map((el) => el.textContent!);
}

beforeEach(() => {
  __resetUnitSystemForTests("metric");
});

describe("ForecastCard", () => {
  it("leads with today, then the 2 future days a free key returns", () => {
    render(<ForecastCard forecast={[day(TODAY), day(DAYS[0]!), day(DAYS[1]!)]} />);

    expect(labels()).toEqual(["Today", "Tomorrow", "Wed"]);
  });

  it("renders the fourth day when the payload carries one", () => {
    render(<ForecastCard forecast={[day(TODAY), day(DAYS[0]!), day(DAYS[1]!), day(DAYS[2]!)]} />);

    expect(labels()).toEqual(["Today", "Tomorrow", "Wed", "Thu"]);
  });

  it("caps at 4 days even if upstream sends more", () => {
    const extra = ["2026-04-10", "2026-04-11"].map((d) => day(d));
    render(
      <ForecastCard
        forecast={[day(TODAY), day(DAYS[0]!), day(DAYS[1]!), day(DAYS[2]!), ...extra]}
      />,
    );

    expect(labels()).toHaveLength(4);
  });

  it("gives every day its own precipitation line", () => {
    render(
      <ForecastCard
        forecast={[
          day(TODAY, { chanceOfRain: 60, willItRain: true, totalPrecip: precipPair(4, "mm") }),
          day(DAYS[0]!, { chanceOfRain: 5 }),
          day(DAYS[1]!, { chanceOfRain: 30 }),
        ]}
      />,
    );

    const lines = screen.getAllByRole("img", { name: /chance of rain/i });
    expect(lines).toHaveLength(3);
    expect(lines[0]).toHaveAccessibleName("Chance of rain, 60 percent, 4 millimetres");
    expect(lines[1]).toHaveAccessibleName("Chance of rain, 5 percent");
  });

  it("shows skeletons while the forecast tier is in flight", () => {
    const { container } = render(<ForecastCard forecast={undefined} />);

    expect(labels()).toHaveLength(0);
    // Each placeholder column is one aria-hidden wrapper of pulsing bars.
    expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(3);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("sets the column count from the day count, so 4 days do not overflow 3 columns", () => {
    const { container, rerender } = render(
      <ForecastCard forecast={[day(TODAY), day(DAYS[0]!), day(DAYS[1]!)]} />,
    );
    const grid = () => container.querySelector(".grid")!;

    expect(grid().className).toContain("fc-wide:grid-cols-3");

    rerender(<ForecastCard forecast={[day(TODAY), day(DAYS[0]!), day(DAYS[1]!), day(DAYS[2]!)]} />);
    expect(grid().className).toContain("fc-wide:grid-cols-4");
  });
});
