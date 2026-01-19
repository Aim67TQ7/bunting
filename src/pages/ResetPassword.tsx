import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const AUTH_HUB_URL = 'https://gate.buntinggpt.com';

/**
 * Reset Password Page - Redirects to centralized login hub
 * 
 * Password resets are now handled by login.buntinggpt.com.
 * This page redirects to the login hub's reset password flow.
 */
export default function ResetPassword() {
  const isMobile = useIsMobile();

  useEffect(() => {
    // Preserve any tokens from the URL for the login hub to handle
    const params = window.location.search + window.location.hash;
    window.location.href = `${AUTH_HUB_URL}/reset-password${params}`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-primary mx-auto mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`}></div>
        <p className="text-muted-foreground">Redirecting to password reset...</p>
      </div>
    </div>
  );
}
