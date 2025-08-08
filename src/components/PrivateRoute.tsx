
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { isDemoMode } from "@/utils/demoMode";

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  // Bypass auth when Demo Mode is enabled
  const demoMode = isDemoMode();
  if (demoMode) {
    return <>{children}</>;
  }

  // Add console log to debug auth state
  console.log("PrivateRoute render - loading:", isLoading, "user:", user);
  // Show loading state while checking authentication
  if (isLoading && !demoMode) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className={`animate-spin rounded-full border-b-2 border-primary ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`}></div>
      </div>
    );
  }

  // Redirect to auth page if not logged in (unless demo mode)
  if (!user && !demoMode) {
    // Pass the current location in state so we can redirect back after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Render the protected content if authenticated
  return <>{children}</>;
}
