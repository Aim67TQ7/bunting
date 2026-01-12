import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { createAvatarBucket } from "./utils/createAvatarBucket";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// =============================================================================
// PRODUCTION-ONLY HOST ENFORCEMENT
// Redirect non-production hosts (except localhost) to buntinggpt.com immediately
// =============================================================================
const CANONICAL_PRODUCTION_HOST = 'buntinggpt.com';

const isProductionHostname = (hostname: string): boolean => {
  return hostname === CANONICAL_PRODUCTION_HOST ||
         hostname === `www.${CANONICAL_PRODUCTION_HOST}` ||
         hostname.endsWith(`.${CANONICAL_PRODUCTION_HOST}`);
};

const isLocalhost = (hostname: string): boolean => {
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

// Enforce production-only access - redirect non-production hosts immediately
(() => {
  if (typeof window === 'undefined') return;
  
  const hostname = window.location.hostname;
  console.log('[main.tsx] Current hostname:', hostname);
  
  if (isLocalhost(hostname)) {
    console.log('[main.tsx] Localhost detected - allowing development access');
    return;
  }
  
  if (isProductionHostname(hostname)) {
    console.log('[main.tsx] Production host confirmed:', hostname);
    return;
  }
  
  // Non-production, non-localhost host - redirect to canonical production
  const targetUrl = `https://${CANONICAL_PRODUCTION_HOST}${window.location.pathname}${window.location.search}${window.location.hash}`;
  console.warn('[main.tsx] Non-production host detected! Redirecting to:', targetUrl);
  window.location.replace(targetUrl);
})();

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
