import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { isDemoMode } from "@/utils/demoMode";

const AUTH_HUB_URL = 'https://gate.buntinggpt.com';

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading, sessionChecked } = useAuth();
  const isMobile = useIsMobile();
  
  // Bypass auth when Demo Mode is enabled
  if (isDemoMode()) {
    return <>{children}</>;
  }

  console.log("PrivateRoute - loading:", isLoading, "sessionChecked:", sessionChecked, "user:", user?.email || null);
  
  // Show loading state while checking authentication
  if (isLoading || !sessionChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className={`animate-spin rounded-full border-b-2 border-primary ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`}></div>
      </div>
    );
  }

  // Redirect to centralized login hub if not logged in
  if (!user) {
    console.log("PrivateRoute - No user, redirecting to login hub");
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${AUTH_HUB_URL}?return_url=${returnUrl}`;
    return (
      <div className="flex items-center justify-center h-screen">
        <div className={`animate-spin rounded-full border-b-2 border-primary ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`}></div>
      </div>
    );
  }

  // Render the protected content if authenticated
  return <>{children}</>;
}
