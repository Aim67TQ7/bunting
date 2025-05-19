
import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";

// Define schemas for form validation
const loginSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@buntingmagnetics.com'), 
    { message: "Only buntingmagnetics.com emails are allowed" }
  ),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@buntingmagnetics.com'), 
    { message: "Only buntingmagnetics.com emails are allowed" }
  ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const resetSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@buntingmagnetics.com'), 
    { message: "Only buntingmagnetics.com emails are allowed" }
  ),
});

// Updated schema to remove OTP
const newPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Auth() {
  const { user, isLoading, signIn, signUp, resetPassword, updatePassword } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup" | "reset" | "new-password">("login");
  const [resetEmail, setResetEmail] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Form for login
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Form for signup
  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Form for password reset
  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  // Form for new password
  const newPasswordForm = useForm<z.infer<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      // Redirect to the page they were trying to access, or to home
      const origin = location.state?.from?.pathname || "/";
      navigate(origin, { replace: true });
    }
  }, [user, isLoading, navigate, location.state]);
  
  // Check for password reset hash in URL
  useEffect(() => {
    // If we have a #access_token in the URL, we're in the password reset flow
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      console.log("Detected password reset hash in URL");
      setAuthMode("new-password");
    }
  }, []);

  // If still loading, show loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If already authenticated, don't render the login form
  if (user) {
    return null; // The useEffect will handle the redirect
  }

  // Handle login submission
  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    const { error } = await signIn(values.email, values.password);
    
    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    }
  };

  // Handle signup submission
  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    const { error } = await signUp(values.email, values.password);
    
    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created",
        description: "Your account has been created successfully",
      });
      // Switch back to login tab
      setAuthMode("login");
    }
  };

  // Handle password reset submission
  const onResetSubmit = async (values: z.infer<typeof resetSchema>) => {
    const { error } = await resetPassword(values.email);
    
    if (error) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset email sent",
        description: "Check your email for a password reset link",
      });
      setResetEmail(values.email);
      setAuthMode("login"); // Go back to login since we now use link-based reset
    }
  };

  // Handle new password submission
  const onNewPasswordSubmit = async (values: z.infer<typeof newPasswordSchema>) => {
    const { error } = await updatePassword(values.password);
    
    if (error) {
      toast({
        title: "Password update failed",
        description: error.message || "An error occurred while updating your password",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
      setAuthMode("login");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/30">
      <div className="mb-8">
        <BrandLogo size="lg" />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          {authMode === "login" && (
            <>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your buntingmagnetics.com email to sign in to your account
              </CardDescription>
            </>
          )}
          {authMode === "signup" && (
            <>
              <CardTitle>Create an account</CardTitle>
              <CardDescription>
                Enter your buntingmagnetics.com email to create a new account
              </CardDescription>
            </>
          )}
          {authMode === "reset" && (
            <>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                Enter your buntingmagnetics.com email to receive a password reset link
              </CardDescription>
            </>
          )}
          {authMode === "new-password" && (
            <>
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>
                Create a new secure password for your account
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent>
          {authMode === "login" && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@buntingmagnetics.com" 
                          type="email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          )}

          {authMode === "signup" && (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@buntingmagnetics.com" 
                          type="email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </Form>
          )}

          {authMode === "reset" && (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@buntingmagnetics.com" 
                          type="email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            </Form>
          )}

          {authMode === "new-password" && (
            <Form {...newPasswordForm}>
              <form onSubmit={newPasswordForm.handleSubmit(onNewPasswordSubmit)} className="space-y-4">
                <FormField
                  control={newPasswordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newPasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          {authMode === "login" && (
            <>
              <Button variant="link" onClick={() => setAuthMode("reset")} className="text-sm">
                Forgot your password?
              </Button>
              <div className="text-center text-sm">
                Don't have an account?{" "}
                <Button variant="link" onClick={() => setAuthMode("signup")} className="p-0">
                  Sign up
                </Button>
              </div>
            </>
          )}
          {authMode === "signup" && (
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Button variant="link" onClick={() => setAuthMode("login")} className="p-0">
                Sign in
              </Button>
            </div>
          )}
          {(authMode === "reset" || authMode === "new-password") && (
            <Button variant="link" onClick={() => setAuthMode("login")} className="text-sm">
              Back to login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
