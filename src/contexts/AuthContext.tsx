import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null };
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null };
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
};

// Create context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log("[AuthProvider] Setting up auth state");
    setIsLoading(true);

    // Set up auth state listener first to catch all future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log("[AuthProvider] Auth state changed:", event, currentSession?.user?.id);
      
      // Update state synchronously
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      } else {
        setUser(currentSession?.user ?? null);
        setSession(currentSession);
      }
      
      // Only show toasts for important events
      if (event === 'SIGNED_IN' && currentSession?.user) {
        toast({
          title: "Signed in successfully",
          description: `Welcome, ${currentSession.user.email}!`,
        });
      } else if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed out successfully",
          description: "You have been signed out.",
        });
      }
    });

    // Then check for existing session
    const checkSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log("[AuthProvider] Initial session check:", initialSession?.user?.id);
        
        if (initialSession?.user) {
          setUser(initialSession.user);
          setSession(initialSession);
        }
      } catch (error) {
        console.error("[AuthProvider] Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to run once

  // Standard sign in function (without test mode)
  const signIn = async (email: string, password: string) => {
    console.log(`Attempting to sign in: ${email}`);
    
    try {
      setIsLoading(true);
      
      // Regular authentication flow
      const result = await supabase.auth.signInWithPassword({ email, password });
      console.log("Sign in result:", result.error ? "Error" : "Success");
      return result;
    } catch (error) {
      console.error("Error during sign in:", error);
      return { 
        error: new Error("Failed to sign in"),
        data: { user: null, session: null } 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("Signing up new user with email:", email);
      
      // Direct sign up with auto-confirmation (no magic link)
      const result = await supabase.auth.signUp({ 
        email,
        password
      });
      
      console.log("Sign up response:", result.error ? "Error" : "Success");
      
      // If signup is successful but no session (email confirmation required),
      // try to sign in directly to create the session
      if (!result.error && !result.data.session && result.data.user) {
        console.log("Signup successful but no session. Attempting direct login...");
        return await signIn(email, password);
      }
      
      return result;
    } catch (error) {
      console.error("Error during sign up:", error);
      return { 
        error: new Error("Failed to sign up"),
        data: { user: null, session: null } 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log("Signing out");
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out properly",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback#type=recovery`,
      });
      return result;
    } catch (error) {
      console.error("Error during password reset:", error);
      return { error: new Error("Failed to send password reset email") };
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    try {
      setIsLoading(true);
      const result = await supabase.auth.updateUser({
        password: password,
      });
      return result;
    } catch (error) {
      console.error("Error updating password:", error);
      return { error: new Error("Failed to update password") };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
