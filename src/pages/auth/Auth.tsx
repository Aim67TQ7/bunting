
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/contexts/AuthContext";

type AuthTab = "login" | "signup" | "forgot-password";

export default function Auth() {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  
  // Get the redirectUrl from location state (from PrivateRoute)
  const redirectUrl = location.state?.from?.pathname || "/";
  
  // Handle successful login
  const handleLoginSuccess = () => {
    console.log("Login successful, redirecting to:", redirectUrl);
    navigate(redirectUrl, { replace: true });
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

  // Wait for auth state to stabilize before making any redirect decisions
  useEffect(() => {
    if (!auth.isLoading) {
      console.log("Auth check completed:", { user: !!auth.user, redirectUrl });
      setAuthCheckComplete(true);
    }
  }, [auth.isLoading, redirectUrl]);

  // Only redirect if we've completed the auth check and found a user
  useEffect(() => {
    if (authCheckComplete && auth.user && auth.session) {
      console.log("User is already authenticated, redirecting to:", redirectUrl);
      navigate(redirectUrl, { replace: true });
    }
  }, [authCheckComplete, auth.user, auth.session, navigate, redirectUrl]);

  // If still loading auth state, show a minimal loading state
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Checking authentication...</p>
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
