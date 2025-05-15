
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading, session } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    // Once loading is completed, mark auth as checked
    if (!isLoading) {
      // Add a small delay to ensure state is settled
      const timer = setTimeout(() => {
        console.log("PrivateRoute: Auth check completed", { 
          user: !!user, 
          session: !!session,
          isLoading 
        });
        setAuthChecked(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, session, isLoading]);
  
  // Show loading state when authentication is still being checked
  if (isLoading || !authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // If no user is found after loading is complete, redirect to auth page
  if (!user || !session) {
    console.log("PrivateRoute: No user or session, redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }
  
  // User is authenticated, render children
  console.log("PrivateRoute: User is authenticated, rendering children");
  return <>{children}</>;
}
