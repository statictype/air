import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";
import type { SuggestionItem, WeatherCurrent, WeatherForecast } from "@/api/types";
import { __resetHistoryStoreForTests } from "@/hooks/use-history";
import { __resetUnitSystemForTests } from "@/hooks/use-unit-system";
import { __resetFirstRunForTests } from "@/lib/first-run";
import { server } from "@/test/msw-server";
import { distance, pressure, speed, temperature } from "@/worker/format";
import { precipAmountPair, precipPair } from "@/worker/precip";

const londonCurrent: WeatherCurrent = {
  location: {
    name: "London",
    region: "Greater London",
    country: "United Kingdom",
    localTime: "",
    tz: "Europe/London",
    lat: 51.52,
    lon: -0.11,
  },
  current: {
    temp: temperature(12.3, 54.1),
    feelsLike: temperature(11.1, 52),
    heatIndex: temperature(12.3, 54.1),
    windchill: temperature(11.1, 52),
    dewpoint: temperature(6.2, 43.2),
    conditionText: "Partly cloudy",
    conditionCode: 1003,
    timeOfDay: "day",
    wind: speed(14, 8.7),
    gust: speed(22, 13.7),
    windDir: "WSW",
    windDegree: 240,
    humidity: 67,
    pressureMb: 1015,
    pressure: pressure(1015, 29.97),
    visibility: distance(10, 6),
    uv: 4,
    cloud: 40,
    precip: precipAmountPair(0, "mm"),
    comfort: { thermal: "Cool", air: "Slightly dry", sentence: "Cool but slightly dry" },
    beaufort: "Gentle breeze",
  },
};

const londonForecast: WeatherForecast = {
  airQualityIndex: 2,
  forecast: [
    {
      date: "2026-04-07",
      min: temperature(8, 46.4),
      max: temperature(15.5, 59.9),
      chanceOfRain: 20,
      willItRain: false,
      chanceOfSnow: 0,
      willItSnow: false,
      totalPrecip: precipPair(0, "mm"),
      totalSnow: precipPair(0, "cm"),
      conditionText: "Partly cloudy",
      conditionCode: 1003,
      isDay: true,
    },
    {
      date: "2026-04-08",
      min: temperature(9, 48.2),
      max: temperature(16.5, 61.7),
      chanceOfRain: 30,
      willItRain: true,
      chanceOfSnow: 0,
      willItSnow: false,
      totalPrecip: precipPair(2.4, "mm"),
      totalSnow: precipPair(0, "cm"),
      conditionText: "Light rain",
      conditionCode: 1183,
      isDay: true,
    },
    {
      date: "2026-04-09",
      min: temperature(10, 50),
      max: temperature(17.5, 63.5),
      chanceOfRain: 10,
      willItRain: false,
      chanceOfSnow: 0,
      willItSnow: false,
      totalPrecip: precipPair(0, "mm"),
      totalSnow: precipPair(0, "cm"),
      conditionText: "Sunny",
      conditionCode: 1000,
      isDay: true,
    },
  ],
  astro: {
    sunrise: "06:32 AM",
    sunset: "07:48 PM",
    moonrise: "10:00 PM",
    moonset: "08:14 AM",
    moonPhase: "Waxing Gibbous",
    moonIllumination: 72,
  },
  hourly: [],
  alerts: [],
};

const londonSuggestion: SuggestionItem = {
  id: 1,
  name: "London",
  region: "Greater London",
  country: "United Kingdom",
  lat: 51.52,
  lon: -0.11,
  url: "london-greater-london-united-kingdom",
};

/** The closed bar carries no field, so searching starts with a trigger click. */
async function openSearch(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Search" }));
  return screen.getByRole("searchbox");
}

function renderAppAt(url: string) {
  __resetHistoryStoreForTests();
  __resetUnitSystemForTests("metric");
  __resetFirstRunForTests();
  window.history.replaceState(null, "", url);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  __resetHistoryStoreForTests();
  __resetUnitSystemForTests("metric");
  __resetFirstRunForTests();
  window.history.replaceState(null, "", "/");

  // A 1100 px viewport: md and lg match, xl does not — the bar is a left rail
  // and the panel is fullscreen.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("min-width: 768px") || query.includes("min-width: 1024px"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  server.use(
    http.get("/api/weather", ({ request }) => {
      const q = new URL(request.url).searchParams.get("q")?.toLowerCase() ?? "";
      if (q.includes("london")) return HttpResponse.json(londonCurrent);
      return HttpResponse.json(
        { error: { kind: "not_found", message: "No matching location found." } },
        { status: 404 },
      );
    }),
    http.get("/api/weather/forecast", ({ request }) => {
      const q = new URL(request.url).searchParams.get("q")?.toLowerCase() ?? "";
      if (q.includes("london")) return HttpResponse.json(londonForecast);
      return HttpResponse.json(
        { error: { kind: "not_found", message: "No matching location found." } },
        { status: 404 },
      );
    }),
    http.get("/api/search", ({ request }) => {
      const q = new URL(request.url).searchParams.get("q")?.toLowerCase() ?? "";
      if (q.includes("london")) return HttpResponse.json([londonSuggestion]);
      return HttpResponse.json([]);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("air (integration)", () => {
  it("renders the weather for the city in the URL (no click-through)", async () => {
    renderAppAt("/?city=London");

    await screen.findByRole("heading", { name: /london/i });
    expect(screen.getAllByText(/12°/).length).toBeGreaterThan(0);
    expect(screen.getByText(/feels like/i)).toBeInTheDocument();
  });

  it("shows the empty state when the URL has no city", () => {
    renderAppAt("/");
    expect(screen.getByRole("heading", { name: /what's the weather/i })).toBeInTheDocument();
  });

  it("selecting a city suggestion updates the URL, fetches, and adds to history", async () => {
    const user = userEvent.setup();
    renderAppAt("/");

    const input = await openSearch(user);
    await user.type(input, "London");

    const suggestion = await screen.findByRole("button", { name: /search weather for london/i });
    await user.click(suggestion);

    await waitFor(() => {
      expect(new URL(window.location.href).searchParams.get("city")?.toLowerCase()).toContain(
        "london",
      );
    });

    await screen.findByRole("heading", { name: /london/i });

    // The panel held until the query settled, then collapsed on success.
    await waitFor(() => expect(screen.queryByRole("searchbox")).not.toBeInTheDocument());

    await openSearch(user);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /load weather for london/i })).toBeInTheDocument();
    });
  });

  it("clicking 'My location' multiple times dedupes despite GPS jitter", async () => {
    // These reads span ~15m and must collapse to one history entry.
    const readings = [
      { coords: { latitude: 51.52313, longitude: -0.12893 } },
      { coords: { latitude: 51.52319, longitude: -0.12889 } },
      { coords: { latitude: 51.52316, longitude: -0.12894 } },
    ];
    let readIdx = 0;
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success(readings[readIdx++ % readings.length] as GeolocationPosition);
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });

    server.use(http.get("/api/weather", () => HttpResponse.json(londonCurrent)));

    const user = userEvent.setup();
    renderAppAt("/");

    for (let i = 0; i < readings.length; i++) {
      await openSearch(user);
      const myLocation = await screen.findByRole("button", { name: "My location" });
      await user.click(myLocation);
      await waitFor(() => {
        expect(new URL(window.location.href).searchParams.get("city")).toBeTruthy();
      });
      await screen.findByRole("heading", { name: /london/i });
      // A repeat read resolves to the coordinates already in the URL; the hold
      // settles on that rather than waiting for a change that never comes.
      await waitFor(() => expect(screen.queryByRole("searchbox")).not.toBeInTheDocument());
    }

    await openSearch(user);
    const recentButtons = await screen.findAllByRole("button", {
      name: /load weather for/i,
    });
    expect(recentButtons).toHaveLength(1);
  });

  it("pressing Enter with no matching city is a silent no-op (no fetch, no alert)", async () => {
    const user = userEvent.setup();
    renderAppAt("/");

    const input = await openSearch(user);
    await user.type(input, "xyzgibberish");
    await user.keyboard("{Enter}");

    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
    await screen.findByText(/no cities found/i);

    expect(screen.getByRole("heading", { name: /what's the weather/i })).toBeInTheDocument();
  });

  it("names the failed city under the search field when the lookup 404s", async () => {
    const user = userEvent.setup();
    renderAppAt("/?city=Llanfairpwllgwyngyll");

    const input = await openSearch(user);
    const alert = screen.getByRole("alert");
    await waitFor(() => {
      expect(alert).toHaveTextContent(/no weather for “Llanfairpwllgwyngyll”/i);
    });
    expect(input).toHaveAttribute("aria-describedby", alert.id);
  });

  it("clears the input error once a real city lands", async () => {
    const user = userEvent.setup();
    renderAppAt("/?city=Nowhereville");

    const input = await openSearch(user);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/try a different spelling/i);
    });

    await user.type(input, "London");
    await user.click(await screen.findByRole("button", { name: /search weather for london/i }));

    await screen.findByRole("heading", { name: /london/i });
    await waitFor(() => expect(screen.queryByRole("searchbox")).not.toBeInTheDocument());

    const reopened = await openSearch(user);
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
    expect(reopened).not.toHaveAttribute("aria-describedby");
  });

  it("paints the hero before the forecast", async () => {
    // If the hero ever blocks on forecast, this hangs below.
    server.use(
      http.get("/api/weather", () => HttpResponse.json(londonCurrent)),
      http.get("/api/weather/forecast", async () => {
        await delay(30);
        return HttpResponse.json(londonForecast);
      }),
    );

    renderAppAt("/?city=London");

    // `/partly cloudy/i` double-matches once forecast lands.
    await screen.findByRole("heading", { name: /london/i });

    expect(document.querySelector("[aria-hidden='true'].animate-pulse")).toBeInTheDocument();

    await screen.findByText(/^tomorrow$/i);
  });

  it("switches every reading on the toggle without a network request", async () => {
    let weatherCalls = 0;
    let forecastCalls = 0;
    server.use(
      http.get("/api/weather", () => {
        weatherCalls += 1;
        return HttpResponse.json(londonCurrent);
      }),
      http.get("/api/weather/forecast", () => {
        forecastCalls += 1;
        return HttpResponse.json(londonForecast);
      }),
    );

    const user = userEvent.setup();
    renderAppAt("/?city=London");

    await screen.findByRole("heading", { name: /london/i });
    await screen.findByText(/^tomorrow$/i);
    const callsBefore = [weatherCalls, forecastCalls];

    expect(screen.getAllByText("12°").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "14 kilometres per hour" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "1015 millibars" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /imperial units/i }));

    // Every figure churns to its new reading over the sweep in `scramble.ts`,
    // so the settled text arrives a few hundred ms after the click.
    expect((await screen.findAllByText("54°")).length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "9 miles per hour" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "29.97 inches of mercury" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "14 kilometres per hour" })).not.toBeInTheDocument();

    expect([weatherCalls, forecastCalls]).toEqual(callsBefore);
  });

  it("keeps the classified words and the needle angle unchanged across a unit switch", async () => {
    const user = userEvent.setup();
    renderAppAt("/?city=London");

    await screen.findByRole("heading", { name: /london/i });

    const sentence = () => screen.getAllByText("Cool but slightly dry");
    const beaufort = () => screen.getAllByText("Gentle breeze");
    const band = () => screen.getByText("Normal");
    const needle = () =>
      document.querySelector("[transform^='rotate(']")?.getAttribute("transform");

    const before = [sentence().length, beaufort().length, band().textContent, needle()];

    await user.click(screen.getByRole("button", { name: /imperial units/i }));

    expect([sentence().length, beaufort().length, band().textContent, needle()]).toEqual(before);
  });

  it("renders an em dash for a reading the payload does not carry", async () => {
    const stale = structuredClone(londonCurrent) as unknown as {
      current: Record<string, unknown>;
    };
    delete stale.current.visibility;
    delete stale.current.temp;
    server.use(http.get("/api/weather", () => HttpResponse.json(stale)));

    renderAppAt("/?city=London");

    await screen.findByRole("heading", { name: /london/i });
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("removes a history item, shows undo toast, and restores it", async () => {
    const user = userEvent.setup();
    renderAppAt("/?city=London");

    await screen.findByRole("heading", { name: /london/i });
    await openSearch(user);
    await screen.findByRole("button", { name: /load weather for london/i });

    const removeBtn = await screen.findByRole("button", { name: /remove london/i });
    await user.click(removeBtn);

    expect(
      screen.queryByRole("button", { name: /load weather for london/i }),
    ).not.toBeInTheDocument();

    const undoBtn = await screen.findByRole("button", { name: /^undo$/i });
    await user.click(undoBtn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /load weather for london/i })).toBeInTheDocument();
    });
  });
});
