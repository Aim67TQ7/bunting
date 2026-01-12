import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { isDemoMode } from "@/utils/demoMode";
import { isProductionHost } from "@/integrations/supabase/client";

interface PrivateRouteProps {
  children: ReactNode;
}

// Check if we're on the production domain (now uses canonical helper)
const isProductionDomain = typeof window !== 'undefined' && isProductionHost(window.location.hostname);

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading, session, sessionChecked } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Bypass auth when Demo Mode is enabled
  const demoMode = isDemoMode();
  if (demoMode) {
    return <>{children}</>;
  }

  // Add console log to debug auth state
  console.log("PrivateRoute render - loading:", isLoading, "sessionChecked:", sessionChecked, "user:", user?.email || null, "production:", isProductionDomain);
  
  // Show loading state while checking authentication
  // CRITICAL: On production domains with cookie auth, we must wait for sessionChecked
  // to be true before making any redirect decisions
  if (isLoading || !sessionChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className={`animate-spin rounded-full border-b-2 border-primary ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`}></div>
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!user) {
    console.log("PrivateRoute - No user after session check, redirecting to auth");
    // Pass the current location in state so we can redirect back after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Render the protected content if authenticated
  return <>{children}</>;
}
