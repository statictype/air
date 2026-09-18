import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import { getHistorySnapshot } from "@/hooks/use-history";
import { createQueryClient } from "@/lib/query-client";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

// Seed the URL before React mounts, so the app only sees the URL-driven path.
// `replaceState` keeps the back stack clean.
const bootstrapUrl = new URL(window.location.href);
if (!bootstrapUrl.searchParams.get("city")) {
  const last = getHistorySnapshot()[0];
  if (last) {
    bootstrapUrl.searchParams.set("city", last.query);
    window.history.replaceState(null, "", bootstrapUrl.toString());
  }
}

const queryClient = createQueryClient();

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
