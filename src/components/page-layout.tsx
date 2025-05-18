
import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  const { user, isLoading } = useAuth();
  
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
  
  // Redirect to auth page if not authenticated
  if (!user) {
    console.log("PageLayout: No authenticated user, redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className={cn("flex-1", className)}>
        {children}
      </main>
    </div>
  );
}
