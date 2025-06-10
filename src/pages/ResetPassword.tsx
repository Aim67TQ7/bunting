
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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

const newPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const { updatePassword, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  // Form for new password
  const form = useForm<z.infer<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Check if we have the necessary URL parameters for password reset
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    if (type === 'recovery' && accessToken && refreshToken) {
      setIsValidToken(true);
    } else {
      setIsValidToken(false);
      toast({
        title: "Invalid reset link",
        description: "This password reset link is invalid or has expired. Please request a new one.",
        variant: "destructive",
      });
      // Redirect to auth page after 3 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    }
  }, [searchParams, navigate]);

  const onSubmit = async (values: z.infer<typeof newPasswordSchema>) => {
    const { error } = await updatePassword(values.password);
    
    if (error) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated successfully",
        description: "You can now sign in with your new password.",
      });
      // Redirect to login page
      navigate("/auth");
    }
  };

  if (isValidToken === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className={`animate-spin rounded-full border-b-2 border-primary ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`}></div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${isMobile ? 'p-2' : 'p-4'} bg-muted/30`}>
        <div className={`${isMobile ? 'mb-4' : 'mb-8'}`}>
          <BrandLogo size={isMobile ? "md" : "lg"} />
        </div>

        <Card className={`w-full ${isMobile ? 'max-w-sm mx-2' : 'max-w-md'}`}>
          <CardHeader className={isMobile ? 'pb-4' : ''}>
            <CardTitle className={`text-destructive ${isMobile ? 'text-lg' : ''}`}>Invalid Reset Link</CardTitle>
            <CardDescription className={isMobile ? 'text-sm' : ''}>
              This password reset link is invalid or has expired. You will be redirected to the login page shortly.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${isMobile ? 'p-2' : 'p-4'} bg-muted/30`}>
      <div className={`${isMobile ? 'mb-4' : 'mb-8'}`}>
        <BrandLogo size={isMobile ? "md" : "lg"} />
      </div>

      <Card className={`w-full ${isMobile ? 'max-w-sm mx-2' : 'max-w-md'}`}>
        <CardHeader className={isMobile ? 'pb-4' : ''}>
          <CardTitle className={isMobile ? 'text-lg' : ''}>Set New Password</CardTitle>
          <CardDescription className={isMobile ? 'text-sm' : ''}>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        
        <CardContent className={isMobile ? 'px-4' : ''}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-${isMobile ? '3' : '4'}`}>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={isMobile ? 'text-sm' : ''}>New Password</FormLabel>
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
                    <FormLabel className={isMobile ? 'text-sm' : ''}>Confirm New Password</FormLabel>
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
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
