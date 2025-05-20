
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { createAvatarBucket } from "./utils/createAvatarBucket";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client for TanStack Query with more sensible defaults to prevent excessive refetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Attempt to create avatar bucket on app initialization
createAvatarBucket().catch(console.error);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
