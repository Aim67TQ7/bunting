
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  const { user, isLoading } = useAuth();
  const redirectChecked = useRef(false);
  const hasRedirected = useRef(false);
  
  useEffect(() => {
    // Only check once when component first mounts or when auth state changes
    if (redirectChecked.current) {
      return;
    }
    
    // Only check for redirection if we're not currently loading auth state
    if (!isLoading) {
      redirectChecked.current = true;
      console.log("Auth: Authentication check complete", { user: !!user });
      
      // If user is authenticated, redirect to home page
      if (user && !hasRedirected.current) {
        console.log("Auth: User authenticated, redirecting to /");
        hasRedirected.current = true;
        // Use a short timeout to ensure state is updated before navigation
        setTimeout(() => navigate("/"), 100);
      }
    }
  }, [user, isLoading, navigate]);

  // Handle successful login
  const handleLoginSuccess = () => {
    console.log("Auth: Login successful, redirecting to /");
    hasRedirected.current = true;
    navigate("/");
  };
  
  // Handle successful registration
  const handleRegisterSuccess = () => {
    console.log("Auth: Registration successful, switching to login tab");
    setAuthTab("login");
  };
  
  // Handle successful forgot password
  const handleForgotPasswordSuccess = () => {
    console.log("Auth: Password reset email sent, switching to login tab");
    setAuthTab("login");
  };

  // If already authenticated and about to redirect, show loading message
  if (user && !hasRedirected.current) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">Redirecting to dashboard...</div>
      </div>
    );
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
