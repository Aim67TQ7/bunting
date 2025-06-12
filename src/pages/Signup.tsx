
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

export default function Signup() {
  const { user, isLoading, signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Form for signup
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
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
        <div className={`animate-spin rounded-full border-b-2 border-primary ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`}></div>
      </div>
    );
  }

  // If already authenticated, don't render the signup form
  if (user) {
    return null; // The useEffect will handle the redirect
  }

  // Handle signup submission
  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
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
        description: "Your account has been created successfully. Please check your email to verify your account.",
      });
      // Redirect to login page
      navigate("/auth");
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${isMobile ? 'p-2' : 'p-4'} bg-muted/30`}>
      <div className={`${isMobile ? 'mb-4' : 'mb-8'}`}>
        <BrandLogo size={isMobile ? "md" : "lg"} />
      </div>

      <Card className={`w-full ${isMobile ? 'max-w-sm mx-2' : 'max-w-md'}`}>
        <CardHeader className={isMobile ? 'pb-4' : ''}>
          <CardTitle className={isMobile ? 'text-lg' : ''}>Create an account</CardTitle>
          <CardDescription className={isMobile ? 'text-sm' : ''}>
            Enter your buntingmagnetics.com email to create a new account
          </CardDescription>
        </CardHeader>
        
        <CardContent className={isMobile ? 'px-4' : ''}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-${isMobile ? '3' : '4'}`}>
              <FormField
                control={form.control}
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
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={isMobile ? 'text-sm' : ''}>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="••••••••" 
                          type={showPassword ? "text" : "password"} 
                          className={isMobile ? 'h-12 text-base pr-12' : 'pr-12'} 
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={isMobile ? 'text-sm' : ''}>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="••••••••" 
                          type={showConfirmPassword ? "text" : "password"} 
                          className={isMobile ? 'h-12 text-base pr-12' : 'pr-12'} 
                          {...field} 
                        />
                        <button 
                          type="button"
                          className={`absolute inset-y-0 right-0 flex items-center ${isMobile ? 'pr-4' : 'pr-3'} text-gray-400 hover:text-gray-600`}
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
        </CardContent>
        
        <CardFooter className={`flex flex-col space-y-2 ${isMobile ? 'px-4 pb-4' : ''}`}>
          <div className={`text-center ${isMobile ? 'text-sm' : 'text-sm'}`}>
            Already have an account?{" "}
            <Button variant="link" onClick={() => navigate("/auth")} className={`p-0 ${isMobile ? 'text-sm h-auto' : ''}`}>
              Sign in
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
