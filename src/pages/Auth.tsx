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
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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

const emailSignupSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@buntingmagnetics.com'), 
    { message: "Only buntingmagnetics.com emails are allowed" }
  ),
});

const otpSignupSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@buntingmagnetics.com'), 
    { message: "Only buntingmagnetics.com emails are allowed" }
  ),
  otp: z.string().length(6, "OTP must be 6 digits"),
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

const otpResetSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@buntingmagnetics.com'), 
    { message: "Only buntingmagnetics.com emails are allowed" }
  ),
  otp: z.string().length(6, "OTP must be 6 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Auth() {
  const { user, isLoading, signIn, signUp, signUpWithEmailOnly, resetPassword, verifyOtpAndUpdatePassword, verifyOtpAndCreateAccount } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup" | "email-signup" | "otp-signup" | "reset" | "otp-reset">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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

  // Form for email-only signup
  const emailSignupForm = useForm<z.infer<typeof emailSignupSchema>>({
    resolver: zodResolver(emailSignupSchema),
    defaultValues: {
      email: "",
    },
  });

  // Form for OTP signup
  const otpSignupForm = useForm<z.infer<typeof otpSignupSchema>>({
    resolver: zodResolver(otpSignupSchema),
    defaultValues: {
      email: "",
      otp: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Form for OTP password reset
  const otpResetForm = useForm<z.infer<typeof otpResetSchema>>({
    resolver: zodResolver(otpResetSchema),
    defaultValues: {
      email: "",
      otp: "",
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

  // Handle email-only signup submission
  const onEmailSignupSubmit = async (values: z.infer<typeof emailSignupSchema>) => {
    const { error } = await signUpWithEmailOnly(values.email);
    
    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Verification code sent",
        description: "Check your email for the 6-digit verification code",
      });
      // Store email and switch to OTP entry
      setSignupEmail(values.email);
      otpSignupForm.setValue("email", values.email);
      setAuthMode("otp-signup");
    }
  };

  // Handle OTP signup submission
  const onOtpSignupSubmit = async (values: z.infer<typeof otpSignupSchema>) => {
    const { error } = await verifyOtpAndCreateAccount(values.email, values.otp, values.password);
    
    if (error) {
      toast({
        title: "Account creation failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created successfully",
        description: "Welcome! You can now start using the app",
      });
      // User will be automatically logged in, no need to switch modes
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
        title: "Reset code sent",
        description: "Check your email for the 6-digit reset code",
      });
      // Store email and switch to OTP entry
      setResetEmail(values.email);
      otpResetForm.setValue("email", values.email);
      setAuthMode("otp-reset");
    }
  };

  // Handle OTP reset submission
  const onOtpResetSubmit = async (values: z.infer<typeof otpResetSchema>) => {
    const { error } = await verifyOtpAndUpdatePassword(values.email, values.otp, values.password);
    
    if (error) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated",
      });
      // Switch back to login
      setAuthMode("login");
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${isMobile ? 'p-2' : 'p-4'} bg-muted/30`}>
      <div className={`${isMobile ? 'mb-4' : 'mb-8'}`}>
        <BrandLogo size={isMobile ? "md" : "lg"} />
      </div>

      <Card className={`w-full ${isMobile ? 'max-w-sm mx-2' : 'max-w-md'}`}>
        <CardHeader className={isMobile ? 'pb-4' : ''}>
          {authMode === "login" && (
            <>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Login</CardTitle>
              <CardDescription className={isMobile ? 'text-sm' : ''}>
                Enter your buntingmagnetics.com email to sign in to your account
              </CardDescription>
            </>
          )}
          {authMode === "signup" && (
            <>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Create an account</CardTitle>
              <CardDescription className={isMobile ? 'text-sm' : ''}>
                Enter your buntingmagnetics.com email to create a new account
              </CardDescription>
            </>
          )}
          {authMode === "email-signup" && (
            <>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Create an account</CardTitle>
              <CardDescription className={isMobile ? 'text-sm' : ''}>
                Enter your buntingmagnetics.com email to get started
              </CardDescription>
            </>
          )}
          {authMode === "otp-signup" && (
            <>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Verify your email</CardTitle>
              <CardDescription className={isMobile ? 'text-sm' : ''}>
                Enter the 6-digit code sent to {signupEmail} and create your password
              </CardDescription>
            </>
          )}
          {authMode === "reset" && (
            <>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Reset Password</CardTitle>
              <CardDescription className={isMobile ? 'text-sm' : ''}>
                Enter your email to receive a 6-digit reset code
              </CardDescription>
            </>
          )}
          {authMode === "otp-reset" && (
            <>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Enter Reset Code</CardTitle>
              <CardDescription className={isMobile ? 'text-sm' : ''}>
                Enter the 6-digit code sent to {resetEmail} and your new password
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className={isMobile ? 'px-4' : ''}>
          {authMode === "login" && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className={`space-y-${isMobile ? '3' : '4'}`}>
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={isMobile ? 'text-sm' : ''}>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@buntingmagnetics.com" 
                          type="email" 
                          className={isMobile ? 'h-12 text-base' : ''} 
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
                      <FormLabel className={isMobile ? 'text-sm' : ''}>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="••••••••" 
                            type={showPassword ? "text" : "password"} 
                            className={isMobile ? 'h-12 text-base pr-12' : ''} 
                            {...field} 
                          />
                          <button 
                            type="button"
                            className={`absolute inset-y-0 right-0 flex items-center ${isMobile ? 'pr-4' : 'pr-3'} text-gray-400 hover:text-gray-600`}
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <Eye className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className={`w-full ${isMobile ? 'h-12 text-base' : ''}`} disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          )}

          {authMode === "signup" && (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className={`space-y-${isMobile ? '3' : '4'}`}>
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
                        <div className="relative">
                          <Input 
                            placeholder="••••••••" 
                            type={showPassword ? "text" : "password"} 
                            {...field} 
                          />
                          <button 
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <Eye className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
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
                        <div className="relative">
                          <Input 
                            placeholder="••••••••" 
                            type={showConfirmPassword ? "text" : "password"} 
                            {...field} 
                          />
                          <button 
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <Eye className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className={`w-full ${isMobile ? 'h-12 text-base' : ''}`} disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </Form>
          )}

          {authMode === "email-signup" && (
            <Form {...emailSignupForm}>
              <form onSubmit={emailSignupForm.handleSubmit(onEmailSignupSubmit)} className="space-y-4">
                <FormField
                  control={emailSignupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@buntingmagnetics.com" 
                          type="email" 
                          className={isMobile ? 'h-12 text-base' : ''}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className={`w-full ${isMobile ? 'h-12 text-base' : ''}`} disabled={isLoading}>
                  {isLoading ? "Sending code..." : "Continue"}
                </Button>
              </form>
            </Form>
          )}

          {authMode === "otp-signup" && (
            <Form {...otpSignupForm}>
              <form onSubmit={otpSignupForm.handleSubmit(onOtpSignupSubmit)} className="space-y-4">
                <FormField
                  control={otpSignupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@buntingmagnetics.com" 
                          type="email" 
                          disabled
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={otpSignupForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>6-Digit Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123456" 
                          maxLength={6}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={otpSignupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Create Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="••••••••" 
                            type={showPassword ? "text" : "password"} 
                            {...field} 
                          />
                          <button 
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <Eye className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={otpSignupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="••••••••" 
                            type={showConfirmPassword ? "text" : "password"} 
                            {...field} 
                          />
                          <button 
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <Eye className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
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
                  {isLoading ? "Sending..." : "Send reset code"}
                </Button>
              </form>
            </Form>
          )}

          {authMode === "otp-reset" && (
            <Form {...otpResetForm}>
              <form onSubmit={otpResetForm.handleSubmit(onOtpResetSubmit)} className="space-y-4">
                <FormField
                  control={otpResetForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@buntingmagnetics.com" 
                          type="email" 
                          disabled
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={otpResetForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>6-Digit Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123456" 
                          maxLength={6}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={otpResetForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="••••••••" 
                            type={showPassword ? "text" : "password"} 
                            {...field} 
                          />
                          <button 
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <Eye className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={otpResetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="••••••••" 
                            type={showConfirmPassword ? "text" : "password"} 
                            {...field} 
                          />
                          <button 
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <Eye className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update password"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className={`flex flex-col space-y-2 ${isMobile ? 'px-4 pb-4' : ''}`}>
          {authMode === "login" && (
            <>
              <Button variant="link" onClick={() => setAuthMode("reset")} className={`${isMobile ? 'text-sm h-auto p-2' : 'text-sm'}`}>
                Forgot your password?
              </Button>
              <div className={`text-center ${isMobile ? 'text-sm' : 'text-sm'}`}>
                Don't have an account?{" "}
                <Button variant="link" onClick={() => setAuthMode("email-signup")} className={`p-0 ${isMobile ? 'text-sm h-auto' : ''}`}>
                  Sign up
                </Button>
              </div>
            </>
          )}
          {authMode === "signup" && (
            <div className={`text-center ${isMobile ? 'text-sm' : 'text-sm'}`}>
              Already have an account?{" "}
              <Button variant="link" onClick={() => setAuthMode("login")} className={`p-0 ${isMobile ? 'text-sm h-auto' : ''}`}>
                Sign in
              </Button>
            </div>
          )}
          {authMode === "email-signup" && (
            <div className={`text-center ${isMobile ? 'text-sm' : 'text-sm'}`}>
              Already have an account?{" "}
              <Button variant="link" onClick={() => setAuthMode("login")} className={`p-0 ${isMobile ? 'text-sm h-auto' : ''}`}>
                Sign in
              </Button>
            </div>
          )}
          {authMode === "otp-signup" && (
            <div className="flex flex-col space-y-2 w-full">
              <Button variant="link" onClick={() => setAuthMode("email-signup")} className={`${isMobile ? 'text-sm h-auto p-2' : 'text-sm'}`}>
                Change email
              </Button>
              <Button variant="link" onClick={() => setAuthMode("login")} className={`${isMobile ? 'text-sm h-auto p-2' : 'text-sm'}`}>
                Back to login
              </Button>
            </div>
          )}
          {authMode === "reset" && (
            <Button variant="link" onClick={() => setAuthMode("login")} className={`${isMobile ? 'text-sm h-auto p-2' : 'text-sm'}`}>
              Back to login
            </Button>
          )}
          {authMode === "otp-reset" && (
            <div className="flex flex-col space-y-2 w-full">
              <Button variant="link" onClick={() => setAuthMode("reset")} className={`${isMobile ? 'text-sm h-auto p-2' : 'text-sm'}`}>
                Resend code
              </Button>
              <Button variant="link" onClick={() => setAuthMode("login")} className={`${isMobile ? 'text-sm h-auto p-2' : 'text-sm'}`}>
                Back to login
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
