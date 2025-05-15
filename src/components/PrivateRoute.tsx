
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading, session } = useAuth();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Add a small delay to ensure auth state is properly loaded
    const timer = setTimeout(() => {
      console.log("PrivateRoute: Session check complete", { user: !!user, session: !!session });
      setCheckingSession(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [user, session]);
  
  // Show loading state when authentication is still being checked
  if (isLoading || checkingSession) {
    console.log("PrivateRoute: Still loading or checking session");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If no user is found after loading is complete, redirect to auth page
  if (!user || !session) {
    console.log("PrivateRoute: No user or session, redirecting to /auth");
    return <Navigate to="/auth" />;
  }
  
  // User is authenticated, render children
  console.log("PrivateRoute: User is authenticated, rendering children");
  return <>{children}</>;
}
