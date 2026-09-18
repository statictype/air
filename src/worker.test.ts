import { fetchMock, SELF } from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

/** `fetchMock` intercepts fetches made inside the Worker runtime. */

const upstreamLocation = {
  name: "London",
  region: "City of London, Greater London",
  country: "United Kingdom",
  localtime: "2026-04-07 14:32",
  tz_id: "Europe/London",
  lat: 51.52,
  lon: -0.11,
};

const upstreamCurrentFixture = {
  location: upstreamLocation,
  current: {
    temp_c: 12.3456,
    temp_f: 54.2,
    feelslike_c: 11.1,
    feelslike_f: 52.0,
    is_day: 1,
    condition: { text: "Partly cloudy", code: 1003 },
    wind_kph: 14.4,
    wind_mph: 8.9,
    wind_dir: "WSW",
    wind_degree: 240,
    gust_kph: 22,
    gust_mph: 13.7,
    humidity: 67,
    pressure_mb: 1015,
    pressure_in: 29.97,
    vis_km: 10,
    vis_miles: 6,
    uv: 4,
    cloud: 40,
    dewpoint_c: 6.2,
    dewpoint_f: 43.2,
    precip_mm: 0,
  },
};

const upstreamAstro = {
  sunrise: "06:32 AM",
  sunset: "07:48 PM",
  moonrise: "10:00 PM",
  moonset: "08:14 AM",
  moon_phase: "Waxing Gibbous",
  moon_illumination: 72,
};

const upstreamHour = {
  time: "2026-04-07 15:00",
  temp_c: 13.2,
  temp_f: 55.8,
  feelslike_c: 12.0,
  feelslike_f: 53.6,
  is_day: 1,
  condition: { text: "Light rain", code: 1063 },
  chance_of_rain: 80,
  chance_of_snow: 10,
  will_it_rain: 1,
  will_it_snow: 0,
  precip_mm: 2.44,
  snow_cm: 0,
  cloud: 90,
};

const upstreamForecastFixture = {
  location: upstreamLocation,
  forecast: {
    forecastday: [
      {
        date: "2026-04-07",
        day: {
          mintemp_c: 8.0,
          mintemp_f: 46.4,
          maxtemp_c: 15.5,
          maxtemp_f: 59.9,
          daily_chance_of_rain: 20,
          daily_will_it_rain: 1,
          daily_chance_of_snow: 15,
          daily_will_it_snow: 0,
          totalprecip_mm: 4.26,
          totalsnow_cm: 0,
          condition: { text: "Partly cloudy", code: 1003 },
        },
        astro: upstreamAstro,
        hour: [upstreamHour],
      },
      {
        date: "2026-04-08",
        day: {
          mintemp_c: 9.0,
          mintemp_f: 48.2,
          maxtemp_c: 16.0,
          maxtemp_f: 60.8,
          daily_chance_of_rain: 15,
          condition: { text: "Sunny", code: 1000 },
        },
        astro: upstreamAstro,
      },
      {
        date: "2026-04-09",
        day: {
          mintemp_c: 7.0,
          mintemp_f: 44.6,
          maxtemp_c: 14.0,
          maxtemp_f: 57.2,
          daily_chance_of_rain: 40,
          condition: { text: "Light rain", code: 1063 },
        },
        astro: upstreamAstro,
      },
    ],
  },
};

const upstreamAlert = {
  event: "Wind Warning",
  headline: "Wind Warning issued for Greater London",
  severity: "Severe",
  areas: "Greater London",
  effective: "2026-04-07T06:00:00+01:00",
  expires: "2026-04-07T21:00:00+01:00",
  desc: "Gusts of 60-70 mph expected.",
  instruction: "Secure loose objects.",
};

const upstreamSearchHit = {
  id: 2801268,
  name: "London",
  region: "City of London, Greater London",
  country: "United Kingdom",
  lat: 51.52,
  lon: -0.11,
  url: "london-city-of-london-greater-london-united-kingdom",
};

/** The `q` a Worker fetch put on the wire. */
function sentQuery(path: string): string {
  return new URLSearchParams(path.slice(path.indexOf("?"))).get("q") ?? "";
}

/** Every weather request resolves its query to a location id first. */
function mockResolve(hits: unknown[] = [upstreamSearchHit]): void {
  fetchMock
    .get("https://api.weatherapi.com")
    .intercept({ path: (p) => p.startsWith("/v1/search.json") })
    .reply(200, hits);
}

function mockSearchFor(query: string, hits: unknown[]): void {
  fetchMock
    .get("https://api.weatherapi.com")
    .intercept({ path: (p) => p.startsWith("/v1/search.json") && sentQuery(p) === query })
    .reply(200, hits);
}

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
});

describe("Worker /api/weather (current)", () => {
  it("returns a shaped current DTO and marks the response as MISS", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/current.json") })
      .reply(200, upstreamCurrentFixture);

    const res = await SELF.fetch("https://example.com/api/weather?q=London-current-success");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Air-Cache")).toBe("MISS");

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      location: { name: "London", country: "United Kingdom" },
      current: {
        temp: {
          metric: { text: "12°", value: "12", suffix: "°", spoken: "12 degrees" },
          imperial: { text: "54°", value: "54", suffix: "°", spoken: "54 degrees" },
        },
        wind: {
          metric: { text: "14 km/h", suffix: "km/h" },
          imperial: { text: "9 mph", suffix: "mph" },
        },
        pressure: {
          metric: { text: "1015 mb" },
          imperial: { text: "29.97 inHg", spoken: "29.97 inches of mercury" },
        },
        visibility: { metric: { text: "10 km" }, imperial: { text: "6 mi" } },
        conditionText: "Partly cloudy",
        conditionCode: 1003,
        timeOfDay: "day",
        windDir: "WSW",
        humidity: 67,
        pressureMb: 1015,
        beaufort: "Gentle breeze",
        comfort: { thermal: "Cool", air: "Slightly dry" },
      },
    });
    expect(body.forecast).toBeUndefined();
    expect(body.astro).toBeUndefined();
    expect(body.today).toBeUndefined();
  });

  it("ships no raw Celsius or kph — the readings render, their raw form does not", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/current.json") })
      .reply(200, upstreamCurrentFixture);

    const res = await SELF.fetch("https://example.com/api/weather?q=CurrentNoRawFields");
    const body = (await res.json()) as { current: Record<string, unknown> };
    for (const field of [
      "tempC",
      "feelsLikeC",
      "heatIndexC",
      "windchillC",
      "dewpointC",
      "windKph",
      "gustKph",
      "visibilityKm",
      "precipMm",
    ]) {
      expect(body.current[field]).toBeUndefined();
    }
  });

  it("returns 404 with not_found kind for upstream code 1006", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/current.json") })
      .reply(400, { error: { code: 1006, message: "No matching location found." } });

    const res = await SELF.fetch("https://example.com/api/weather?q=Xyznotacity1");
    expect(res.status).toBe(404);
    expect(((await res.json()) as { error: { kind: string } }).error.kind).toBe("not_found");
  });

  it("returns 429 with quota_exceeded for upstream code 2007", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/current.json") })
      .reply(403, { error: { code: 2007, message: "API key quota has been exceeded." } });

    const res = await SELF.fetch("https://example.com/api/weather?q=quotacity");
    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: { kind: string } }).error.kind).toBe("quota_exceeded");
  });

  it("maps a structurally-broken upstream body to upstream / 502 without leaking field names", async () => {
    const broken = structuredClone(upstreamCurrentFixture) as unknown as {
      current: { temp_c: unknown };
    };
    broken.current.temp_c = "hot";
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/current.json") })
      .reply(200, broken);

    const res = await SELF.fetch("https://example.com/api/weather?q=CurrentSchemaReject");
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: { kind: string; message: string } };
    expect(body.error.kind).toBe("upstream");
    expect(body.error.message.toLowerCase()).not.toContain("temp");
  });

  it("collapses unknown upstream errors to the generic upstream kind without leaking vendor detail", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/current.json") })
      .reply(401, { error: { code: 2006, message: "API key is invalid." } });

    const res = await SELF.fetch("https://example.com/api/weather?q=keyissuecity");
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: { kind: string; message: string } };
    expect(body.error.kind).toBe("upstream");
    expect(body.error.message.toLowerCase()).not.toContain("key");
  });

  it("rejects empty queries with invalid_query without calling upstream", async () => {
    const res = await SELF.fetch("https://example.com/api/weather?q=");
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: { kind: string } }).error.kind).toBe("invalid_query");
  });

  it("caches a successful response and serves the second call as HIT", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/current.json") })
      .reply(200, upstreamCurrentFixture);

    const first = await SELF.fetch("https://example.com/api/weather?q=CurrentCache1");
    expect(first.headers.get("X-Air-Cache")).toBe("MISS");
    await first.text();

    const second = await SELF.fetch("https://example.com/api/weather?q=CurrentCache1");
    expect(second.headers.get("X-Air-Cache")).toBe("HIT");
  });

  it("normalizes the query so casing / whitespace variants share one cache entry", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/current.json") })
      .reply(200, upstreamCurrentFixture);

    const first = await SELF.fetch("https://example.com/api/weather?q=CurrentNormalizeCity");
    expect(first.headers.get("X-Air-Cache")).toBe("MISS");
    await first.text();

    const second = await SELF.fetch(
      `https://example.com/api/weather?q=${encodeURIComponent("  currentnormalizecity  ")}`,
    );
    expect(second.headers.get("X-Air-Cache")).toBe("HIT");
  });
});

describe("Worker /api/weather/forecast", () => {
  it("returns three forecast days and astro, with no separate today field, marked MISS", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/forecast.json") })
      .reply(200, upstreamForecastFixture);

    const res = await SELF.fetch("https://example.com/api/weather/forecast?q=ForecastCity1");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Air-Cache")).toBe("MISS");

    const body = (await res.json()) as {
      today?: unknown;
      forecast: Array<Record<string, unknown>>;
      astro: { sunrise: string };
    };
    expect(body.today).toBeUndefined();
    expect(body.forecast).toHaveLength(3);
    expect(body.forecast[0]).toMatchObject({
      date: "2026-04-07",
      min: { metric: { text: "8°" }, imperial: { text: "46°" } },
      max: { metric: { text: "16°" }, imperial: { text: "60°" } },
      chanceOfRain: 20,
      willItRain: true,
      chanceOfSnow: 15,
      willItSnow: false,
      totalPrecip: {
        metric: { text: "4.3 mm", spoken: "4.3 millimetres" },
        imperial: { text: "0.17 in", spoken: "0.17 inches" },
      },
      totalSnow: null,
    });
    expect(body.astro.sunrise).toBe("06:32 AM");
  });

  it("requests alerts from upstream", async () => {
    let seenPath = "";
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({
        path: (p) => {
          if (!p.startsWith("/v1/forecast.json")) return false;
          seenPath = p;
          return true;
        },
      })
      .reply(200, upstreamForecastFixture);

    await SELF.fetch("https://example.com/api/weather/forecast?q=ForecastAlertsParam");
    const params = new URLSearchParams(seenPath.slice(seenPath.indexOf("?")));
    expect(params.get("alerts")).toBe("yes");
    expect(params.get("aqi")).toBe("yes");
    // Asks for today + 2; free keys cap the reply at 3 days total.
    expect(params.get("days")).toBe("3");
  });

  it("shapes the hourly precipitation fields", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/forecast.json") })
      .reply(200, upstreamForecastFixture);

    const res = await SELF.fetch("https://example.com/api/weather/forecast?q=ForecastHourlyPrecip");
    const body = (await res.json()) as { hourly: Array<Record<string, unknown>> };
    expect(body.hourly[0]).toMatchObject({
      time: "2026-04-07 15:00",
      chanceOfRain: 80,
      chanceOfSnow: 10,
      willItRain: true,
      willItSnow: false,
      temp: { metric: { text: "13°" }, imperial: { text: "56°" } },
    });
    expect(body.hourly[0]?.precipMm).toBeUndefined();
    expect(body.hourly[0]?.snowCm).toBeUndefined();
  });

  it("defaults omitted day and hour fields to 0, false or null", async () => {
    const sparse = structuredClone(upstreamForecastFixture) as unknown as {
      forecast: {
        forecastday: Array<{
          day: Record<string, unknown>;
          hour?: Array<Record<string, unknown>>;
        }>;
      };
    };
    const day0 = sparse.forecast.forecastday[0];
    if (!day0) throw new Error("fixture has three days");
    for (const key of [
      "daily_will_it_rain",
      "daily_chance_of_snow",
      "daily_will_it_snow",
      "totalprecip_mm",
      "totalsnow_cm",
    ]) {
      delete day0.day[key];
    }
    for (const key of ["chance_of_snow", "will_it_rain", "will_it_snow"]) {
      delete day0.hour?.[0]?.[key];
    }

    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/forecast.json") })
      .reply(200, sparse);

    const res = await SELF.fetch("https://example.com/api/weather/forecast?q=ForecastSparseFields");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      forecast: Array<Record<string, unknown>>;
      hourly: Array<Record<string, unknown>>;
    };
    expect(body.forecast[0]).toMatchObject({
      willItRain: false,
      chanceOfSnow: 0,
      willItSnow: false,
      totalPrecip: null,
      totalSnow: null,
    });
    expect(body.hourly[0]).toMatchObject({
      chanceOfSnow: 0,
      willItRain: false,
      willItSnow: false,
    });
  });

  it("returns an empty alerts array when upstream omits the block entirely", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/forecast.json") })
      .reply(200, upstreamForecastFixture);

    const res = await SELF.fetch("https://example.com/api/weather/forecast?q=ForecastNoAlertBlock");
    const body = (await res.json()) as { alerts: unknown[] };
    expect(body.alerts).toEqual([]);
  });

  it("returns an empty alerts array when the block is present but empty", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/forecast.json") })
      .reply(200, { ...upstreamForecastFixture, alerts: { alert: [] } });

    const res = await SELF.fetch("https://example.com/api/weather/forecast?q=ForecastEmptyAlerts");
    const body = (await res.json()) as { alerts: unknown[] };
    expect(body.alerts).toEqual([]);
  });

  it("normalizes alert severity and sorts worst-first", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/forecast.json") })
      .reply(200, {
        ...upstreamForecastFixture,
        alerts: {
          alert: [
            { ...upstreamAlert, event: "Fog", severity: "" },
            { ...upstreamAlert, event: "Wind", severity: "orange" },
            { ...upstreamAlert, event: "Flood", severity: "Extreme" },
          ],
        },
      });

    const res = await SELF.fetch("https://example.com/api/weather/forecast?q=ForecastAlertSort");
    const body = (await res.json()) as {
      alerts: Array<{ event: string; severity: string }>;
    };
    expect(body.alerts.map((a) => [a.event, a.severity])).toEqual([
      ["Flood", "extreme"],
      ["Wind", "severe"],
      ["Fog", "unknown"],
    ]);
  });

  it("caps alerts at five and drops the fields a reader cannot act on", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/forecast.json") })
      .reply(200, {
        ...upstreamForecastFixture,
        alerts: {
          alert: Array.from({ length: 7 }, (_, i) => ({
            ...upstreamAlert,
            event: `Alert ${i}`,
            msgtype: "Alert",
            category: "Met",
            certainty: "Likely",
            urgency: "Expected",
            note: "",
          })),
        },
      });

    const res = await SELF.fetch("https://example.com/api/weather/forecast?q=ForecastAlertCap");
    const body = (await res.json()) as { alerts: Array<Record<string, unknown>> };
    expect(body.alerts).toHaveLength(5);
    expect(Object.keys(body.alerts[0] ?? {}).sort()).toEqual([
      "areas",
      "desc",
      "effective",
      "event",
      "expires",
      "headline",
      "instruction",
      "severity",
    ]);
  });

  it("fills missing alert strings rather than rejecting the response", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/forecast.json") })
      .reply(200, {
        ...upstreamForecastFixture,
        alerts: { alert: [{ event: "Bare", severity: "Minor" }] },
      });

    const res = await SELF.fetch("https://example.com/api/weather/forecast?q=ForecastAlertSparse");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { alerts: Array<Record<string, unknown>> };
    expect(body.alerts[0]).toEqual({
      event: "Bare",
      headline: "",
      severity: "minor",
      areas: "",
      effective: "",
      expires: "",
      desc: "",
      instruction: "",
    });
  });

  it("caches forecast responses independently from current", async () => {
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/forecast.json") })
      .reply(200, upstreamForecastFixture);

    const first = await SELF.fetch("https://example.com/api/weather/forecast?q=ForecastCache1");
    expect(first.headers.get("X-Air-Cache")).toBe("MISS");
    await first.text();

    const second = await SELF.fetch("https://example.com/api/weather/forecast?q=ForecastCache1");
    expect(second.headers.get("X-Air-Cache")).toBe("HIT");
  });

  it("rejects empty queries with invalid_query", async () => {
    const res = await SELF.fetch("https://example.com/api/weather/forecast?q=");
    expect(res.status).toBe(400);
  });

  it("maps a structurally-broken upstream body to upstream / 502 without leaking field names", async () => {
    const broken = structuredClone(upstreamForecastFixture) as unknown as {
      forecast: { forecastday: Array<{ day: { mintemp_c: unknown } }> };
    };
    // biome-ignore lint/style/noNonNullAssertion: fixture has three days
    broken.forecast.forecastday[0]!.day.mintemp_c = null;
    mockResolve();
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (p) => p.startsWith("/v1/forecast.json") })
      .reply(200, broken);

    const res = await SELF.fetch("https://example.com/api/weather/forecast?q=ForecastSchemaReject");
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: { kind: string; message: string } };
    expect(body.error.kind).toBe("upstream");
    expect(body.error.message.toLowerCase()).not.toContain("mintemp");
  });
});

describe("Worker location resolution", () => {
  it("asks for weather by the resolved id, never by the viewer's string", async () => {
    let asked = "";
    mockResolve([{ ...upstreamSearchHit, id: 1772504, name: "Tromso" }]);
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({
        path: (path) => {
          if (!path.startsWith("/v1/current.json")) return false;
          asked = sentQuery(path);
          return true;
        },
      })
      .reply(200, upstreamCurrentFixture);

    const res = await SELF.fetch(
      `https://example.com/api/weather?q=${encodeURIComponent("Tromsø, Norway")}`,
    );
    expect(res.status).toBe(200);
    expect(asked).toBe("id:1772504");
  });

  it("folds an accented query before it reaches the location index", async () => {
    let asked = "";
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({
        path: (path) => {
          if (!path.startsWith("/v1/search.json")) return false;
          asked = sentQuery(path);
          return true;
        },
      })
      .reply(200, [upstreamSearchHit]);
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (path) => path.startsWith("/v1/current.json") })
      .reply(200, upstreamCurrentFixture);

    await SELF.fetch(`https://example.com/api/weather?q=${encodeURIComponent("Malmö, Sweden")}`);
    expect(asked).toBe("malmo, sweden");
  });

  it("hands back the spelling the viewer asked for, cased as upstream sent it", async () => {
    mockResolve([{ ...upstreamSearchHit, id: 518116, name: "Medellin" }]);
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (path) => path.startsWith("/v1/current.json") })
      .reply(200, {
        ...upstreamCurrentFixture,
        location: { ...upstreamLocation, name: "Medellin", country: "Colombia" },
      });

    const res = await SELF.fetch(
      `https://example.com/api/weather?q=${encodeURIComponent("Medellín, Colombia")}`,
    );
    const body = (await res.json()) as { location: { name: string } };
    expect(body.location.name).toBe("Medellín");
  });

  it("resolves once for both tiers, so current and forecast cannot land on different cities", async () => {
    mockResolve([{ ...upstreamSearchHit, id: 769250, name: "Krakow" }]);
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (path) => path.startsWith("/v1/current.json") })
      .reply(200, upstreamCurrentFixture);
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({ path: (path) => path.startsWith("/v1/forecast.json") })
      .reply(200, upstreamForecastFixture);

    const city = encodeURIComponent("Kraków, Poland");
    const current = await SELF.fetch(`https://example.com/api/weather?q=${city}`);
    const forecast = await SELF.fetch(`https://example.com/api/weather/forecast?q=${city}`);

    expect(current.status).toBe(200);
    expect(forecast.status).toBe(200);
    // One search interceptor for two tiers: afterEach fails on a pending one.
  });

  it("returns not_found without asking for weather when the index has no hit", async () => {
    mockResolve([]);

    const res = await SELF.fetch("https://example.com/api/weather?q=Zzznowherecity");
    expect(res.status).toBe(404);
    expect(((await res.json()) as { error: { kind: string } }).error.kind).toBe("not_found");
  });

  it("passes coordinates through untouched", async () => {
    let asked = "";
    fetchMock
      .get("https://api.weatherapi.com")
      .intercept({
        path: (path) => {
          if (!path.startsWith("/v1/current.json")) return false;
          asked = sentQuery(path);
          return true;
        },
      })
      .reply(200, upstreamCurrentFixture);

    await SELF.fetch("https://example.com/api/weather?q=69.649,18.956");
    expect(asked).toBe("69.649,18.956");
  });
});

describe("Worker /api/search", () => {
  it("restores the diacritics the viewer typed onto each suggestion", async () => {
    mockSearchFor("munchen, germany", [
      { ...upstreamSearchHit, id: 604719, name: "Munchen", region: "Bayern", country: "Germany" },
    ]);

    const res = await SELF.fetch(
      `https://example.com/api/search?q=${encodeURIComponent("München, Germany")}`,
    );
    const body = (await res.json()) as Array<{ name: string; region: string }>;
    expect(body[0]?.name).toBe("München");
    expect(body[0]?.region).toBe("Bayern");
  });

  it("retries folded when the accented spelling has no record", async () => {
    mockSearchFor("łódź", []);
    mockSearchFor("lodz", [
      { ...upstreamSearchHit, id: 1966663, name: "Lodz", region: "", country: "Poland" },
    ]);

    const res = await SELF.fetch(`https://example.com/api/search?q=${encodeURIComponent("łódź")}`);
    const body = (await res.json()) as Array<{ name: string }>;
    expect(body[0]?.name).toBe("Łódź");
  });
});

describe("Worker unknown API routes", () => {
  it("404s an unmatched /api path without calling upstream", async () => {
    const res = await SELF.fetch("https://example.com/api/weather/yesterday?q=London");
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { kind: string } };
    expect(body.error.kind).toBe("not_found");
  });
});
