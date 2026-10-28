import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

/** Render real static page content; the browser hydrates this same component tree. */
export function renderPage(location: string): string {
  const client = new QueryClient();
  try {
    return renderToString(
      <StaticRouter location={location}>
        <QueryClientProvider client={client}>
          <App />
        </QueryClientProvider>
      </StaticRouter>,
    );
  } finally {
    client.clear();
  }
}
