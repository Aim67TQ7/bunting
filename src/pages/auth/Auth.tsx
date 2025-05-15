
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { useAuth } from "@/contexts/AuthContext";

type AuthTab = "login" | "register" | "forgot-password";

export default function Auth() {
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const [redirectChecked, setRedirectChecked] = useState(false);
  const hasRedirected = useRef(false);
  
  console.log("Auth page - Current state:", { 
    isLoading, 
    hasUser: !!user,
    redirectChecked,
    hasRedirected: hasRedirected.current
  });
  
  // Check if user is already logged in
  useEffect(() => {
    // Only perform redirect logic when not loading and we haven't redirected yet
    if (!isLoading && !hasRedirected.current) {
      if (user) {
        console.log("Auth page - User is authenticated, redirecting");
        // Get the redirect path from location state or default to home
        const from = location.state?.from?.pathname || "/";
        hasRedirected.current = true;
        navigate(from, { replace: true });
      }
      setRedirectChecked(true);
    }
  }, [user, isLoading, navigate, location]);

  // Handle successful login
  const handleLoginSuccess = () => {
    const from = location.state?.from?.pathname || "/";
    hasRedirected.current = true;
    navigate(from, { replace: true });
  };
  
  // Handle successful registration
  const handleRegisterSuccess = () => {
    setAuthTab("login");
  };
  
  // Handle successful forgot password
  const handleForgotPasswordSuccess = () => {
    setAuthTab("login");
  };

  // If still loading or haven't checked redirect, show loading state
  if (isLoading || !redirectChecked) {
    return null;
  }
  
  // If user is already authenticated, we'll redirect in the useEffect
  if (user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">BuntingGPT</CardTitle>
          <CardDescription className="text-center">
            {authTab === "login" && "Sign in to your account"}
            {authTab === "register" && "Register as a new Bunting user"}
            {authTab === "forgot-password" && "Reset your password"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as AuthTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">New User</TabsTrigger>
              <TabsTrigger value="forgot-password">Forgot Password</TabsTrigger>
            </TabsList>
            
            {/* Login Form */}
            <TabsContent value="login">
              <LoginForm onSuccess={handleLoginSuccess} />
            </TabsContent>
            
            {/* Registration Form */}
            <TabsContent value="register">
              <RegisterForm onSuccess={handleRegisterSuccess} />
            </TabsContent>
            
            {/* Forgot Password Form */}
            <TabsContent value="forgot-password">
              <ForgotPasswordForm onSuccess={handleForgotPasswordSuccess} />
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            {authTab === "login" && "Don't have an account? "}
            {authTab === "register" && "Already have an account? "}
            {authTab === "forgot-password" && "Remember your password? "}
            <Button 
              variant="link" 
              className="p-0 h-auto" 
              onClick={() => setAuthTab(authTab === "login" ? "register" : "login")}
            >
              {authTab === "login" && "Register"}
              {authTab === "register" && "Sign in"}
              {authTab === "forgot-password" && "Sign in"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
