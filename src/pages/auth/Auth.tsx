
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

// Form schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const registerSchema = z.object({
  employee: z.string().uuid({ message: "Please select an employee from the list" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type AuthTab = "login" | "register" | "forgot-password";

// Interface for Employee data
interface Employee {
  employee_id: string;
  displayName: string;
  userPrincipalName: string;
}

export default function Auth() {
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Forms initialization
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      employee: "",
    },
  });

  // Fetch available employees (those without user_id)
  const { data: employees = [], isError, error } = useQuery<Employee[]>({
    queryKey: ["availableEmployees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("Employee_id")
        .select("employee_id, displayName, userPrincipalName")
        .is("user_id", null);

      if (error) {
        console.error("Error fetching employees:", error);
        throw error;
      }
      return data || [];
    },
  });

  // Log any errors for debugging
  if (isError) {
    console.error("Query error fetching employees:", error);
  }

  // Handle login form submission
  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Redirect to the main page after successful login
        navigate("/");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password form submission
  const onForgotPasswordSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await resetPassword(data.email);
      
      if (error) {
        toast({
          title: "Reset password failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset password email sent",
          description: "Check your email for a reset password link",
        });
        setAuthTab("login");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration form submission (send magic link)
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Find the selected employee
      const selectedEmployee = employees.find(emp => emp.employee_id === data.employee);
      
      if (!selectedEmployee) {
        toast({
          title: "Error",
          description: "Selected employee not found",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Send magic link to the employee's email
      const { error } = await supabase.auth.signInWithOtp({
        email: selectedEmployee.userPrincipalName,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email sent",
          description: `Check ${selectedEmployee.userPrincipalName} for a magic link to complete your registration`,
        });
        setAuthTab("login");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@bunting.com" {...field} />
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
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              {...field} 
                              className="pr-10"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {showPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Registration Form */}
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="employee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Your Name</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your name from the list" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.length === 0 ? (
                              <SelectItem value="none" disabled>No available employees found</SelectItem>
                            ) : (
                              employees.map((employee) => (
                                <SelectItem key={employee.employee_id} value={employee.employee_id}>
                                  {employee.displayName} ({employee.userPrincipalName})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="text-sm text-muted-foreground">
                    A magic link will be sent to your email address to complete the registration.
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading || employees.length === 0}>
                    {isLoading ? "Sending magic link..." : "Send Magic Link"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Forgot Password Form */}
            <TabsContent value="forgot-password">
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@bunting.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending reset link..." : "Send Reset Link"}
                  </Button>
                </form>
              </Form>
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
