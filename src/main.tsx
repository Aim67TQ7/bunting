
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "@/components/theme-provider";
import "./index.css";
import { createAvatarBucket } from "./utils/createAvatarBucket";

// Attempt to create avatar bucket on app initialization
createAvatarBucket().catch(console.error);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="bunting-ui-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
