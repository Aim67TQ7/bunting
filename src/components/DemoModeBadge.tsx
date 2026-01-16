
import React from "react";
import { isDemoMode, disableDemoMode } from "@/utils/demoMode";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function DemoModeBadge() {
  const { signOut } = useAuth();

  if (!isDemoMode()) return null;

  const handleExit = async () => {
    try {
      disableDemoMode();
      await signOut(); // safe even if no session
    } catch {
      // ignore
    }
    // signOut() redirects to the centralized login hub
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-primary-foreground shadow-lg">
      <span className="text-xs font-semibold tracking-wide">DEMO MODE</span>
      <button
        aria-label="Exit demo mode"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
        onClick={handleExit}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default DemoModeBadge;
