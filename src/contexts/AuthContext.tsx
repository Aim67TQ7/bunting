
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Define a more complete auth context interface
interface AuthContextType {
  user: any;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: any | null }>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
});

// Helper function to validate email domain
const isValidBuntingEmail = (email: string): boolean => {
  return email.endsWith('@buntingmagnetics.com');
};

// Provider component that wraps app
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Set up authentication state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state change event:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession ? "Session found" : "No session");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email validation
  const signUp = async (email: string, password: string) => {
    if (!isValidBuntingEmail(email)) {
      return { error: { message: "Only buntingmagnetics.com email addresses are allowed" } };
    }

    try {
      console.log("Attempting signup with email:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Signup error:", error);
        return { error };
      }

      console.log("Signup successful:", data);
      return { error: null };
    } catch (error) {
      console.error("Exception during signup:", error);
      return { error };
    }
  };

  // Sign in with email validation
  const signIn = async (email: string, password: string) => {
    if (!isValidBuntingEmail(email)) {
      return { error: { message: "Only buntingmagnetics.com email addresses are allowed" } };
    }

    try {
      console.log("Attempting signin with email:", email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Signin error:", error);
        return { error };
      }

      console.log("Signin successful");
      return { error: null };
    } catch (error) {
      console.error("Exception during signin:", error);
      return { error };
    }
  };

  // Sign out
  const signOut = async () => {
    setIsLoading(true);
    console.log("Signing out");
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
  };

  // Reset password with email validation - Updated to use link-based method instead of OTP
  const resetPassword = async (email: string) => {
    if (!isValidBuntingEmail(email)) {
      return { error: { message: "Only buntingmagnetics.com email addresses are allowed" } };
    }

    try {
      console.log("Requesting password reset for:", email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/update-password',
      });

      if (error) {
        console.error("Password reset error:", error);
        return { error };
      }

      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link",
      });
      
      return { error: null };
    } catch (error) {
      console.error("Exception during password reset:", error);
      return { error };
    }
  };

  // Update password
  const updatePassword = async (newPassword: string) => {
    try {
      console.log("Updating password");
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Password update error:", error);
        return { error };
      }

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
      
      return { error: null };
    } catch (error) {
      console.error("Exception during password update:", error);
      return { error };
    }
  };

  const value = {
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for components to get auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
