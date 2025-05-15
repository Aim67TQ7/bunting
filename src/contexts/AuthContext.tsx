
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const [authChangeProcessed, setAuthChangeProcessed] = useState<boolean>(false);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Only update state if session actually changed to prevent refresh loops
        if (JSON.stringify(newSession) !== JSON.stringify(session)) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setAuthChangeProcessed(true);
          
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
        }
      }
    );

    // Then check for existing session, but don't trigger duplicate state updates
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (JSON.stringify(currentSession) !== JSON.stringify(session)) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
      setIsLoading(false);
    };
    
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, session]);

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
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
    await supabase.auth.signOut();
  };

  const getBaseUrl = () => {
    // Always use the production URL for consistency
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
    
    if (!result.error) {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
    }
    
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
