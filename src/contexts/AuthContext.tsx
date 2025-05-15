
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
    // Avoid running the effect multiple times
    if (initialized.current) {
      return;
    }

    console.log("Setting up auth state listener");
    initialized.current = true;

    // Set up auth state listener first
    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log("Auth state changed:", event, currentSession?.user?.id);
      
      // Update state with the new session and user
      const newUserId = currentSession?.user?.id || null;
      
      // Only update state if the user ID has changed to prevent unnecessary re-renders
      if (previousUserId.current !== newUserId) {
        console.log("User ID changed from", previousUserId.current, "to", newUserId);
        previousUserId.current = newUserId;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
      
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
    const result = await supabase.auth.signInWithPassword({ email, password });
    console.log("Sign in result:", result.error ? "Error" : "Success");
    return result;
  };

  const signUp = async (email: string, password: string) => {
    const result = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${getBaseUrl()}/auth/callback`
      }
    });
    return result;
  };

  const signOut = async () => {
    console.log("Signing out");
    await supabase.auth.signOut();
  };

  const getBaseUrl = () => {
    return "https://buntinggpt.com";
  };

  const resetPassword = async (email: string) => {
    const baseUrl = getBaseUrl();
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/auth/callback#type=recovery`,
    });
    return result;
  };

  const updatePassword = async (password: string) => {
    const result = await supabase.auth.updateUser({
      password: password,
    });
    return result;
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
