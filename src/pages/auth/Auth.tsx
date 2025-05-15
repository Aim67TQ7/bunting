
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/brand-logo";

type AuthTab = "login" | "signup" | "forgot-password";

export default function Auth() {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectAttempted = useRef(false);

  useEffect(() => {
    // Only attempt to redirect once when user is detected
    if (user && !isLoading && !redirectAttempted.current) {
      redirectAttempted.current = true;
      console.log("Auth: User detected, redirecting to dashboard");
      setIsRedirecting(true);
      
      // Add a slight delay to ensure state updates properly
      setTimeout(() => {
        navigate("/");
      }, 100);
    }
  }, [user, isLoading, navigate]);

  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLoginSuccess = () => {
    console.log("Login successful, redirecting...");
    setIsRedirecting(true);
    navigate("/");
  };

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
              <RegisterForm />
            )}
            
            {activeTab === "forgot-password" && (
              <ForgotPasswordForm />
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
