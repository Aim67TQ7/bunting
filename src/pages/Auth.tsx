import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const AUTH_HUB_URL = 'https://login.buntinggpt.com';

/**
 * Auth Page - Redirects to centralized login hub
 * 
 * All authentication is now handled by login.buntinggpt.com.
 * This page redirects unauthenticated users to the login hub,
 * or sends authenticated users to the dashboard.
 */
export default function Auth() {
  const { user, isLoading, sessionChecked } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Wait for auth to be checked
    if (isLoading || !sessionChecked) return;

    if (user) {
      // Already authenticated - go to dashboard
      navigate("/", { replace: true });
    } else {
      // Not authenticated - redirect to login hub
      // Preserve any URL params (like badge_pin for QR codes)
      const currentParams = window.location.search;
      const returnUrl = encodeURIComponent(window.location.origin);
      window.location.href = `${AUTH_HUB_URL}${currentParams ? currentParams + '&' : '?'}return_url=${returnUrl}`;
    }
  }, [user, isLoading, sessionChecked, navigate]);

  // Show loading spinner while checking auth or redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-primary mx-auto mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`}></div>
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}
