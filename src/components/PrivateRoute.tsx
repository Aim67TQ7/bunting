
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading, session } = useAuth();
  const location = useLocation();
  
  // Show loading state when authentication is still being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // After loading completes, if no user is found, redirect to auth page
  if (!user || !session) {
    console.log("PrivateRoute: No authenticated user, redirecting to /auth", {
      path: location.pathname
    });
    
    // Only redirect to /auth if we're not already there to prevent loops
    if (location.pathname !== "/auth") {
      // Pass current location so we can redirect back after login
      return <Navigate to="/auth" replace state={{ from: location }} />;
    }
  }
  
  // User is authenticated, render children
  return <>{children}</>;
}
