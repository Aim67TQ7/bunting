
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type AuthTab = "login" | "signup" | "forgot-password";

export default function Auth() {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, isLoading } = useAuth();
  
  // Get the redirectUrl from location state (from PrivateRoute)
  const redirectUrl = location.state?.from?.pathname || "/";
  
  console.log("Auth page status:", { 
    isLoading, 
    hasUser: !!user, 
    hasSession: !!session,
    redirectUrl,
    isRedirecting
  });

  // Handle successful login
  const handleLoginSuccess = () => {
    console.log("Login successful, redirecting to:", redirectUrl);
    setIsRedirecting(true);
    // Add a slight delay to allow state to update properly
    setTimeout(() => {
      navigate(redirectUrl, { replace: true });
    }, 100);
  };

  // Handle successful registration
  const handleRegistrationSuccess = () => {
    console.log("Registration successful, switching to login tab");
    setActiveTab("login");
  };

  // Handle successful password reset request
  const handlePasswordResetSuccess = () => {
    console.log("Password reset email sent, switching to login tab");
    setActiveTab("login");
  };

  // Handle redirection for already authenticated users
  useEffect(() => {
    // Only redirect if user is authenticated and we're not already redirecting
    if (!isLoading && user && session && !isRedirecting) {
      console.log("User already authenticated, redirecting to:", redirectUrl);
      setIsRedirecting(true);
      // Add a slight delay to allow state to update properly
      setTimeout(() => {
        navigate(redirectUrl, { replace: true });
      }, 100);
    }
  }, [isLoading, user, session, navigate, redirectUrl, isRedirecting]);

  // If redirecting, show loading indicator
  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // If still loading auth state, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is already authenticated but we haven't started redirecting yet
  if (user && session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Already authenticated, redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <BrandLogo size="lg" />
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome to BuntingGPT</h1>
            <p className="text-gray-500 mt-2">Your AI-powered assistant for Bunting Magnetics</p>
          </div>
          
          <div className="bg-card rounded-lg shadow-md p-8">
            <div className="flex border-b mb-6">
              <button
                className={`px-4 py-2 font-medium ${activeTab === "login" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => setActiveTab("login")}
              >
                Login
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === "signup" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => setActiveTab("signup")}
              >
                Sign Up
              </button>
            </div>
            
            {activeTab === "login" && (
              <LoginForm onSuccess={handleLoginSuccess} />
            )}
            
            {activeTab === "signup" && (
              <RegisterForm onSuccess={handleRegistrationSuccess} />
            )}
            
            {activeTab === "forgot-password" && (
              <ForgotPasswordForm onSuccess={handlePasswordResetSuccess} />
            )}

            {activeTab === "login" && (
              <div className="mt-4 text-center">
                <button 
                  className="text-sm text-primary hover:underline" 
                  onClick={() => setActiveTab("forgot-password")}
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {activeTab === "forgot-password" && (
              <div className="mt-4 text-center">
                <button 
                  className="text-sm text-primary hover:underline" 
                  onClick={() => setActiveTab("login")}
                >
                  Back to login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <footer className="py-4 text-center text-muted-foreground text-sm">
        &copy; {new Date().getFullYear()} Bunting Magnetics. All rights reserved.
      </footer>
    </div>
  );
}
