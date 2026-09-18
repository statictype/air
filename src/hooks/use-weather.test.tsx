import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { WeatherCurrent, WeatherForecast } from "@/api/types";
import { server } from "@/test/msw-server";
import { distance, pressure, speed, temperature } from "@/worker/format";
import { precipAmountPair, precipPair } from "@/worker/precip";
import { useWeather, useWeatherForecast } from "./use-weather";

const currentFixture: WeatherCurrent = {
  location: {
    name: "London",
    region: "",
    country: "UK",
    localTime: "2026-04-07T14:32",
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
    wind: speed(14.4, 8.9),
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

const forecastFixture: WeatherForecast = {
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

function makeWrapper(client?: QueryClient) {
  const c =
    client ??
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={c}>{children}</QueryClientProvider>
  );
}

describe("useWeather", () => {
  it("is disabled when the query is shorter than minLength", async () => {
    const { result } = renderHook(() => useWeather({ query: "Lo" }), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("is disabled when the query is null", async () => {
    const { result } = renderHook(() => useWeather({ query: null }), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fetches and returns the DTO on success", async () => {
    server.use(http.get("/api/weather", () => HttpResponse.json(currentFixture)));

    const { result } = renderHook(() => useWeather({ query: "London" }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(currentFixture);
  });

  it("surfaces typed errors with the correct kind", async () => {
    server.use(
      http.get("/api/weather", () =>
        HttpResponse.json(
          { error: { kind: "not_found", message: "No matching location found." } },
          { status: 404 },
        ),
      ),
    );

    const { result } = renderHook(() => useWeather({ query: "Xyznotacity" }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.kind).toBe("not_found");
  });

  it("collapses whitespace so equivalent queries share one cache entry", async () => {
    let calls = 0;
    server.use(
      http.get("/api/weather", () => {
        calls += 1;
        return HttpResponse.json(currentFixture);
      }),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = makeWrapper(client);

    const first = renderHook(() => useWeather({ query: "New  York" }), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

    const second = renderHook(() => useWeather({ query: "New York" }), { wrapper });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));

    expect(calls).toBe(1);
  });
});

describe("useWeatherForecast", () => {
  it("is disabled when the query is too short", () => {
    const { result } = renderHook(() => useWeatherForecast("Lo"), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("returns the forecast DTO on success", async () => {
    server.use(http.get("/api/weather/forecast", () => HttpResponse.json(forecastFixture)));

    const { result } = renderHook(() => useWeatherForecast("London"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(forecastFixture);
  });

  it("surfaces typed errors with the correct kind", async () => {
    server.use(
      http.get("/api/weather/forecast", () =>
        HttpResponse.json(
          { error: { kind: "not_found", message: "No matching location found." } },
          { status: 404 },
        ),
      ),
    );

    const { result } = renderHook(() => useWeatherForecast("Xyznotacity"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.kind).toBe("not_found");
  });
});
