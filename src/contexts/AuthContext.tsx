
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";

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
  const initialized = useRef(false);
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    console.log("Setting up auth state listener");
    initialized.current = true;

    // Set up auth state listener first
    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log("Auth state changed:", event, currentSession?.user?.id);
      
      // Update state with the new session and user
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Update previous user ID for comparison
      previousUserId.current = currentSession?.user?.id || null;
      
      // Show toast notifications for certain events
      if (event === 'SIGNED_IN') {
        toast({
          title: "Signed in successfully",
          description: "Welcome back!",
        });
      } else if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed out successfully",
          description: "You have been signed out.",
        });
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("Initial session check:", initialSession?.user?.id);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      previousUserId.current = initialSession?.user?.id || null;
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // No dependencies to prevent re-runs

  const signIn = async (email: string, password: string) => {
    console.log("Attempting to sign in:", email);
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      console.log("Sign in result:", result.error ? "Error" : "Success");
      return result;
    } catch (error) {
      console.error("Error during sign in:", error);
      return { 
        error: new Error("Failed to sign in"),
        data: { user: null, session: null } 
      };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${getBaseUrl()}/auth/callback`
        }
      });
      return result;
    } catch (error) {
      console.error("Error during sign up:", error);
      return { 
        error: new Error("Failed to sign up"),
        data: { user: null, session: null } 
      };
    }
  };

  const signOut = async () => {
    console.log("Signing out");
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out properly",
        variant: "destructive",
      });
    }
  };

  const getBaseUrl = () => {
    return window.location.origin || "https://buntinggpt.com";
  };

  const resetPassword = async (email: string) => {
    const baseUrl = getBaseUrl();
    try {
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/auth/callback#type=recovery`,
      });
      return result;
    } catch (error) {
      console.error("Error during password reset:", error);
      return { error: new Error("Failed to send password reset email") };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const result = await supabase.auth.updateUser({
        password: password,
      });
      return result;
    } catch (error) {
      console.error("Error updating password:", error);
      return { error: new Error("Failed to update password") };
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
