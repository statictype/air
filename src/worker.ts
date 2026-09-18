import { handleSearch } from "./worker/search-handler";
import { createTierHandler } from "./worker/tiers";
import type { Env } from "./worker/types";

const handleCurrent = createTierHandler("current");
const handleForecast = createTierHandler("forecast");

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET") {
      switch (url.pathname) {
        case "/api/weather":
          return handleCurrent(request, env);
        case "/api/weather/forecast":
          return handleForecast(request, env);
        case "/api/search":
          return handleSearch(request, env);
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        { error: { kind: "not_found", message: "Unknown API route" } },
        { status: 404 },
      );
    }

    // Everything outside /api/: the static-asset binding serves the SPA.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
