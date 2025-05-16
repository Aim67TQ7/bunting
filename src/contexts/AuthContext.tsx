
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string, isTestMode?: boolean) => Promise<{
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

  useEffect(() => {
    if (initialized.current) return;
    
    console.log("[AuthProvider] Initializing auth state");
    initialized.current = true;
    setIsLoading(true); // Ensure we start in loading state

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log("[AuthProvider] Auth state changed:", event, currentSession?.user?.id);
      
      // Update session and user synchronously to prevent rendering issues
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Only show toasts for specific events the user should be notified about
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
          setSession(initialSession);
          setUser(initialSession.user);
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
  }, []); // No dependencies to prevent re-runs

  // Special sign in function with test mode option
  const signIn = async (email: string, password: string, isTestMode = false) => {
    console.log(`Attempting to sign in: ${email}${isTestMode ? ' (Test Mode)' : ''}`);
    
    try {
      setIsLoading(true);
      
      // Create a synthetic user for Bunting emails in test mode
      if (isTestMode && email.toLowerCase().endsWith('@buntingmagnetics.com')) {
        // Try normal sign in first
        const result = await supabase.auth.signInWithPassword({ email, password });
        
        // If normal sign in works, use that
        if (!result.error) {
          console.log("Regular login successful for Bunting email");
          return result;
        }
        
        // If login fails but it's a Bunting email, create a test session
        console.log("Regular login failed, but creating test session for Bunting domain");
        
        // For test purposes, try to sign up this user with the provided password
        const signUpResult = await supabase.auth.signUp({ 
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        
        // If sign-up succeeds (or user already exists), try sign in again
        if (!signUpResult.error || signUpResult.error.message.includes('already registered')) {
          const secondSignInAttempt = await supabase.auth.signInWithPassword({ 
            email, 
            password 
          });
          
          return secondSignInAttempt;
        }
        
        return signUpResult;
      }
      
      // Normal authentication flow
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

  const getBaseUrl = () => {
    return window.location.origin || "https://buntinggpt.com";
  };

  const resetPassword = async (email: string) => {
    const baseUrl = getBaseUrl();
    try {
      setIsLoading(true);
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/auth/callback#type=recovery`,
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
