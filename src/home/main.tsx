import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource-variable/manrope";
import App from "./App";
import "./home.css";

const client = new QueryClient();
const root = document.getElementById("root")!;
const application = (
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={client}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);

// Production HTML contains the real page; development starts from an empty shell.
// Hydration preserves immediately visible text and the discoverable Earth image.
if (root.hasChildNodes()) hydrateRoot(root, application);
else createRoot(root).render(application);
