
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

type AuthTab = "login" | "register" | "forgot-password";

export default function Auth() {
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const navigate = useNavigate();

  // Handle successful login
  const handleLoginSuccess = () => {
    navigate("/");
  };
  
  // Handle successful registration
  const handleRegisterSuccess = () => {
    setAuthTab("login");
  };
  
  // Handle successful forgot password
  const handleForgotPasswordSuccess = () => {
    setAuthTab("login");
  };

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
