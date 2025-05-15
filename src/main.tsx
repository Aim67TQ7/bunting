
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "@/components/theme-provider";
import "./index.css";
import { createAvatarBucket } from "./utils/createAvatarBucket";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client for TanStack Query
const queryClient = new QueryClient();

// Attempt to create avatar bucket on app initialization
createAvatarBucket().catch(console.error);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
