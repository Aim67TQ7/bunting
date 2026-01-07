import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Eye, EyeOff, BadgeCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { enableDemoMode } from "@/utils/demoMode";

// Define schemas for form validation
const loginSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@buntingmagnetics.com') || email.endsWith('@buntinggpt.com'), 
    { message: "Only @buntingmagnetics.com and @buntinggpt.com emails are allowed" }
  ),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@buntingmagnetics.com') || email.endsWith('@buntinggpt.com'), 
    { message: "Only @buntingmagnetics.com and @buntinggpt.com emails are allowed" }
  ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const emailSignupSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@buntingmagnetics.com') || email.endsWith('@buntinggpt.com'), 
    { message: "Only @buntingmagnetics.com and @buntinggpt.com emails are allowed" }
  ),
});

const otpSignupSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@buntingmagnetics.com') || email.endsWith('@buntinggpt.com'), 
    { message: "Only @buntingmagnetics.com and @buntinggpt.com emails are allowed" }
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
    (email) => email.endsWith('@buntingmagnetics.com') || email.endsWith('@buntinggpt.com'), 
    { message: "Only @buntingmagnetics.com and @buntinggpt.com emails are allowed" }
  ),
});

const otpResetSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@buntingmagnetics.com') || email.endsWith('@buntinggpt.com'), 
    { message: "Only @buntingmagnetics.com and @buntinggpt.com emails are allowed" }
  ),
  otp: z.string().length(6, "OTP must be 6 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Badge authentication schemas
const badgeLookupSchema = z.object({
  badgeNumber: z.string().min(2, "Badge number is required"),
});

const badgeLoginSchema = z.object({
  badgeNumber: z.string().min(2, "Badge number is required"),
  pin: z.string().min(4, "PIN must be at least 4 digits").max(8, "PIN must be at most 8 digits"),
});

const badgeSignupSchema = z.object({
  badgeNumber: z.string().min(2, "Badge number is required"),
  otp: z.string().length(6, "Verification code must be 6 digits"),
  pin: z.string().min(4, "PIN must be at least 4 digits").max(8, "PIN must be at most 8 digits"),
  confirmPin: z.string(),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs don't match",
  path: ["confirmPin"],
});

const badgeResetSchema = z.object({
  badgeNumber: z.string().min(2, "Badge number is required"),
  otp: z.string().length(6, "Verification code must be 6 digits"),
  pin: z.string().min(4, "PIN must be at least 4 digits").max(8, "PIN must be at most 8 digits"),
  confirmPin: z.string(),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs don't match",
  path: ["confirmPin"],
});

export default function Auth() {
  const { 
    user, isLoading, signIn, signInWithMicrosoft, signUp, signUpWithEmailOnly, 
    resetPassword, verifyOtpAndUpdatePassword, verifyOtpAndCreateAccount,
    lookupBadge, signUpWithBadge, verifyBadgeSignup, signInWithBadge, resetBadgePin, verifyBadgePinReset,
    quickSignUpWithBadge, changeBadgePin
  } = useAuth();
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const [authMode, setAuthMode] = useState<
    "login" | "signup" | "email-signup" | "otp-signup" | "reset" | "otp-reset" |
    "badge-lookup" | "badge-login" | "badge-signup" | "badge-reset" | "badge-otp-reset" |
    "badge-qr-signup" | "badge-change-pin"
  >("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [badgeEmployeeName, setBadgeEmployeeName] = useState("");
  const [badgeSupervisorEmail, setBadgeSupervisorEmail] = useState("");
  const [qrPin, setQrPin] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [secretOpen, setSecretOpen] = useState(false);
  const [secretCode, setSecretCode] = useState("");

  // Check for QR code PIN in URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pinFromUrl = params.get('badge_pin');
    if (pinFromUrl) {
      setQrPin(pinFromUrl);
      setAuthMode("badge-qr-signup");
      // Clean URL
      window.history.replaceState({}, '', '/auth');
    }
  }, []);

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

  // Badge auth forms
  const badgeLookupForm = useForm<z.infer<typeof badgeLookupSchema>>({
    resolver: zodResolver(badgeLookupSchema),
    defaultValues: { badgeNumber: "" },
  });

  const badgeLoginForm = useForm<z.infer<typeof badgeLoginSchema>>({
    resolver: zodResolver(badgeLoginSchema),
    defaultValues: { badgeNumber: "", pin: "" },
  });

  const badgeSignupForm = useForm<z.infer<typeof badgeSignupSchema>>({
    resolver: zodResolver(badgeSignupSchema),
    defaultValues: { badgeNumber: "", otp: "", pin: "", confirmPin: "" },
  });

  const badgeResetForm = useForm<z.infer<typeof badgeResetSchema>>({
    resolver: zodResolver(badgeResetSchema),
    defaultValues: { badgeNumber: "", otp: "", pin: "", confirmPin: "" },
  });

  // Redirect if already authenticated - check if profile is complete
  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (user && !isLoading) {
        try {
          // Check if user has completed their employee profile
          const { data: empProfile, error } = await supabase
            .from("emps")
            .select("location, job_level")
            .eq("user_id", user.id)
            .maybeSingle();

          if (error && error.code !== "PGRST116") {
            console.error("Error checking employee profile:", error);
          }

          // If no profile or missing required fields, redirect to settings
          if (!empProfile || !empProfile.location || !empProfile.job_level) {
            navigate("/settings", { replace: true });
            return;
          }

          // Profile complete - redirect to original destination or home
          const origin = location.state?.from?.pathname || "/";
          navigate(origin, { replace: true });
        } catch (err) {
          console.error("Error in profile check:", err);
          // On error, default to redirecting to settings
          navigate("/settings", { replace: true });
        }
      }
    };

    checkProfileAndRedirect();
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
      if (error.message === "EXISTING_USER") {
        // User already exists, redirect to login
        loginForm.setValue("email", values.email);
        setAuthMode("login");
        toast({
          title: "Account Found",
          description: error.details || "An account with this email already exists. Please sign in instead.",
        });
      } else {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
      }
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

  // Handle Microsoft login
  const onMicrosoftLogin = async () => {
    setIsMicrosoftLoading(true);
    const { error } = await signInWithMicrosoft();
    
    if (error) {
      toast({
        title: "Microsoft login failed",
        description: error.message,
        variant: "destructive",
      });
      setIsMicrosoftLoading(false);
    }
    // Note: On success, user will be redirected to Microsoft, so no need to handle success state
  };

  // =============================================================================
  // BADGE AUTHENTICATION HANDLERS
  // =============================================================================

  // Handle badge lookup
  const onBadgeLookupSubmit = async (values: z.infer<typeof badgeLookupSchema>) => {
    const result = await lookupBadge(values.badgeNumber);
    
    if (!result.exists) {
      toast({
        title: "Badge not found",
        description: result.error || "Please check your badge number and try again.",
        variant: "destructive",
      });
      return;
    }

    setBadgeNumber(values.badgeNumber);
    setBadgeEmployeeName(result.employeeName || "");
    setBadgeSupervisorEmail(result.supervisorEmail || "");

    if (result.hasAccount) {
      // Existing user - go to login
      badgeLoginForm.setValue("badgeNumber", values.badgeNumber);
      setAuthMode("badge-login");
      toast({
        title: `Welcome back, ${result.employeeName}!`,
        description: "Please enter your PIN to sign in.",
      });
    } else {
      // New user - start signup
      const { error, supervisorEmail } = await signUpWithBadge(values.badgeNumber);
      
      if (error) {
        toast({
          title: "Signup request failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setBadgeSupervisorEmail(supervisorEmail || result.supervisorEmail || "");
      badgeSignupForm.setValue("badgeNumber", values.badgeNumber);
      setAuthMode("badge-signup");
      toast({
        title: `Hi ${result.employeeName}!`,
        description: `A verification code has been sent to your supervisor (${supervisorEmail || result.supervisorEmail}).`,
      });
    }
  };

  // Handle badge login
  const onBadgeLoginSubmit = async (values: z.infer<typeof badgeLoginSchema>) => {
    const { error } = await signInWithBadge(values.badgeNumber, values.pin);
    
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

  // Handle badge signup verification
  const onBadgeSignupSubmit = async (values: z.infer<typeof badgeSignupSchema>) => {
    const { error } = await verifyBadgeSignup(values.badgeNumber, values.otp, values.pin);
    
    if (error) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Welcome to BuntingGPT!",
      });
    }
  };

  // Handle badge PIN reset request
  const onBadgeResetRequest = async () => {
    const { error, supervisorEmail } = await resetBadgePin(badgeNumber);
    
    if (error) {
      toast({
        title: "Reset request failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setBadgeSupervisorEmail(supervisorEmail || "");
    badgeResetForm.setValue("badgeNumber", badgeNumber);
    setAuthMode("badge-otp-reset");
    toast({
      title: "Reset code sent",
      description: `A verification code has been sent to your supervisor (${supervisorEmail}).`,
    });
  };

  // Handle badge PIN reset verification
  const onBadgeResetSubmit = async (values: z.infer<typeof badgeResetSchema>) => {
    const { error } = await verifyBadgePinReset(values.badgeNumber, values.otp, values.pin);
    
    if (error) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "PIN updated",
        description: "Please log in with your new PIN.",
      });
      badgeLoginForm.setValue("badgeNumber", values.badgeNumber);
      setAuthMode("badge-login");
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${isMobile ? 'p-2' : 'p-4'} bg-muted/30`}>
      <div className={`${isMobile ? 'mb-4' : 'mb-8'}`}>
        <BrandLogo size={isMobile ? "md" : "lg"} className="scale-[3]" />
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
          {/* Badge auth headers */}
          {authMode === "badge-lookup" && (
            <>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Use my Badge</CardTitle>
              <CardDescription className={isMobile ? 'text-sm' : ''}>
                Enter your employee badge number to sign in
              </CardDescription>
            </>
          )}
          {authMode === "badge-login" && (
            <>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Welcome back, {badgeEmployeeName}!</CardTitle>
              <CardDescription className={isMobile ? 'text-sm' : ''}>
                Enter your PIN to sign in
              </CardDescription>
            </>
          )}
          {authMode === "badge-signup" && (
            <>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Create your PIN</CardTitle>
              <CardDescription className={isMobile ? 'text-sm' : ''}>
                Enter the code from your supervisor ({badgeSupervisorEmail}) and create a PIN
              </CardDescription>
            </>
          )}
          {(authMode === "badge-reset" || authMode === "badge-otp-reset") && (
            <>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Reset your PIN</CardTitle>
              <CardDescription className={isMobile ? 'text-sm' : ''}>
                Enter the code from your supervisor ({badgeSupervisorEmail}) and create a new PIN
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className={isMobile ? 'px-4' : ''}>
          {authMode === "login" && (
            <div className="space-y-4">
              {/* Microsoft Login Button */}
              <Button
                type="button"
                variant="outline"
                className={`w-full ${isMobile ? 'h-12 text-base' : ''} flex items-center justify-center gap-2`}
                onClick={onMicrosoftLogin}
                disabled={isMicrosoftLoading || isLoading}
              >
                <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                {isMicrosoftLoading ? "Connecting..." : "Sign in with Microsoft"}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    or continue with email
                  </span>
                </div>
              </div>

              {/* Email/Password Form */}
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

              {/* Badge Login Option */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className={`w-full ${isMobile ? 'h-12 text-base' : ''} flex items-center justify-center gap-2`}
                onClick={() => setAuthMode("badge-lookup")}
              >
                <BadgeCheck className="h-5 w-5" />
                Use my Badge
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                For employees without company email access
              </p>
            </div>
          )}

          {/* Badge Lookup Form */}
          {authMode === "badge-lookup" && (
            <Form {...badgeLookupForm}>
              <form onSubmit={badgeLookupForm.handleSubmit(onBadgeLookupSubmit)} className="space-y-4">
                <FormField
                  control={badgeLookupForm.control}
                  name="badgeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Badge Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your badge number" className={isMobile ? 'h-12 text-base' : ''} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className={`w-full ${isMobile ? 'h-12 text-base' : ''}`} disabled={isLoading}>
                  {isLoading ? "Looking up..." : "Continue"}
                </Button>
              </form>
            </Form>
          )}

          {/* Badge Login Form */}
          {authMode === "badge-login" && (
            <Form {...badgeLoginForm}>
              <form onSubmit={badgeLoginForm.handleSubmit(onBadgeLoginSubmit)} className="space-y-4">
                <FormField
                  control={badgeLoginForm.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIN</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your PIN" maxLength={8} className={isMobile ? 'h-12 text-base' : ''} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className={`w-full ${isMobile ? 'h-12 text-base' : ''}`} disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
                <Button type="button" variant="link" className="w-full" onClick={onBadgeResetRequest}>
                  Forgot PIN?
                </Button>
              </form>
            </Form>
          )}

          {/* Badge Signup Form */}
          {authMode === "badge-signup" && (
            <Form {...badgeSignupForm}>
              <form onSubmit={badgeSignupForm.handleSubmit(onBadgeSignupSubmit)} className="space-y-4">
                <FormField control={badgeSignupForm.control} name="otp" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl><Input placeholder="6-digit code" maxLength={6} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={badgeSignupForm.control} name="pin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Create PIN (4-8 digits)</FormLabel>
                    <FormControl><Input type="password" placeholder="Enter PIN" maxLength={8} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={badgeSignupForm.control} name="confirmPin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm PIN</FormLabel>
                    <FormControl><Input type="password" placeholder="Confirm PIN" maxLength={8} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          )}

          {/* Badge Reset Form */}
          {authMode === "badge-otp-reset" && (
            <Form {...badgeResetForm}>
              <form onSubmit={badgeResetForm.handleSubmit(onBadgeResetSubmit)} className="space-y-4">
                <FormField control={badgeResetForm.control} name="otp" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl><Input placeholder="6-digit code" maxLength={6} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={badgeResetForm.control} name="pin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>New PIN (4-8 digits)</FormLabel>
                    <FormControl><Input type="password" placeholder="Enter new PIN" maxLength={8} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={badgeResetForm.control} name="confirmPin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New PIN</FormLabel>
                    <FormControl><Input type="password" placeholder="Confirm PIN" maxLength={8} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update PIN"}
                </Button>
              </form>
            </Form>
          )}

          {/* QR Code Signup Form */}
          {authMode === "badge-qr-signup" && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Welcome! Enter your badge number to create your account.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-badge">Badge Number</Label>
                <Input 
                  id="qr-badge"
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  placeholder="Enter your badge number"
                  className={isMobile ? 'h-12 text-base' : ''}
                />
              </div>
              <Button 
                className={`w-full ${isMobile ? 'h-12 text-base' : ''}`}
                disabled={isLoading || !badgeNumber || !qrPin}
                onClick={async () => {
                  if (!qrPin) return;
                  const { error, requiresPinChange, employeeName } = await quickSignUpWithBadge(badgeNumber, qrPin);
                  if (error) {
                    toast({ title: "Signup failed", description: error.message, variant: "destructive" });
                  } else {
                    setBadgeEmployeeName(employeeName || "");
                    setAuthMode("badge-change-pin");
                    toast({ title: "Account created!", description: "Now set your personal PIN." });
                  }
                }}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </div>
          )}

          {/* PIN Change Form (after first login) */}
          {authMode === "badge-change-pin" && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {badgeEmployeeName ? `Welcome, ${badgeEmployeeName}! ` : ""}Please set your personal PIN to secure your account.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pin">New PIN (4-8 digits)</Label>
                <Input 
                  id="new-pin"
                  type="password"
                  maxLength={8}
                  placeholder="Enter new PIN"
                  className={isMobile ? 'h-12 text-base' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-pin">Confirm PIN</Label>
                <Input 
                  id="confirm-new-pin"
                  type="password"
                  maxLength={8}
                  placeholder="Confirm new PIN"
                  className={isMobile ? 'h-12 text-base' : ''}
                />
              </div>
              <Button 
                className={`w-full ${isMobile ? 'h-12 text-base' : ''}`}
                disabled={isLoading}
                onClick={async () => {
                  const newPin = (document.getElementById('new-pin') as HTMLInputElement)?.value;
                  const confirmPin = (document.getElementById('confirm-new-pin') as HTMLInputElement)?.value;
                  if (!newPin || !confirmPin) {
                    toast({ title: "Missing PIN", description: "Please enter and confirm your new PIN.", variant: "destructive" });
                    return;
                  }
                  if (newPin !== confirmPin) {
                    toast({ title: "PINs don't match", description: "Please make sure your PINs match.", variant: "destructive" });
                    return;
                  }
                  if (newPin.length < 4 || newPin.length > 8) {
                    toast({ title: "Invalid PIN", description: "PIN must be 4-8 digits.", variant: "destructive" });
                    return;
                  }
                  const { error } = await changeBadgePin(badgeNumber, qrPin || "", newPin);
                  if (error) {
                    toast({ title: "Failed to set PIN", description: error.message, variant: "destructive" });
                  } else {
                    toast({ title: "PIN set successfully!", description: "You can now use your badge and PIN to log in." });
                    // Navigate to dashboard
                    navigate("/", { replace: true });
                  }
                }}
              >
                {isLoading ? "Setting PIN..." : "Set PIN & Continue"}
              </Button>
            </div>
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
          {(authMode === "badge-lookup" || authMode === "badge-login" || authMode === "badge-signup" || authMode === "badge-otp-reset") && (
            <Button variant="link" onClick={() => setAuthMode("login")} className="text-sm">
              Back to email login
            </Button>
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

      {/* Secret demo mode trigger */}
      <button
        aria-label="Open secret demo access"
        className="fixed bottom-4 right-4 h-4 w-4 rounded-full bg-accent z-50 ring-2 ring-primary/30 hover:bg-accent/80 focus:outline-none"
        onClick={() => setSecretOpen(true)}
      />

      <Dialog open={secretOpen} onOpenChange={setSecretOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Access Code</DialogTitle>
            <DialogDescription>
              Enter the passcode to start Demo Mode.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Passcode"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (secretCode.trim() === '203') {
                  enableDemoMode('demo@buntingmagnetics.com');
                  toast({ title: 'Demo mode enabled', description: 'You can now explore the app. Conversations will not be saved.' });
                  const origin = (location as any)?.state?.from?.pathname || '/';
                  setTimeout(() => {
                    setSecretOpen(false);
                    navigate(origin, { replace: true });
                  }, 100);
                } else {
                  toast({ title: 'Invalid code', description: 'Please try again.', variant: 'destructive' });
                }
              }}
            >
              Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
    </div>
  );
}
