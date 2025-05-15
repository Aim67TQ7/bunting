
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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
  const initialized = useRef(false);
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    console.log("Auth provider effect running");
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    
    const initializeAuth = async () => {
      try {
        // First get the session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        console.log("Initial session check:", currentSession ? "Session exists" : "No session");
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          previousUserId.current = currentSession.user.id;
        }
        
        // Then set up the auth listener
        authListener = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log("Auth state change:", event);
          
          // Only update if there's a meaningful change
          const newUserId = newSession?.user?.id;
          const hasUserChanged = newUserId !== previousUserId.current;
          const isSignOut = event === 'SIGNED_OUT';
          
          if (hasUserChanged || isSignOut) {
            console.log("Updating auth state due to:", 
              hasUserChanged ? "User ID change" : "Sign out");
            
            setSession(newSession);
            setUser(newSession?.user ?? null);
            previousUserId.current = newUserId ?? null;
            
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
        });
        
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        // Always mark as initialized and not loading
        setIsLoading(false);
        initialized.current = true;
      }
    };

    initializeAuth();

    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []); // Removed dependencies to prevent re-initialization

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
