import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { __resetHistoryStoreForTests } from "@/hooks/use-history";
import { App } from "./App";

function renderApp() {
  __resetHistoryStoreForTests();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

describe("App (smoke)", () => {
  it("renders the wordmark and the empty state", () => {
    renderApp();
    expect(screen.getByRole("heading", { name: "air", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /what's the weather/i })).toBeInTheDocument();
  });

  it("shows the search trigger and the unit switch, and no field, while closed", () => {
    renderApp();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Units" })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});
