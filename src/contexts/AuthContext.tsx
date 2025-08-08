import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { isDemoMode, getDemoEmail, disableDemoMode } from "@/utils/demoMode";

// Define a more complete auth context interface
interface AuthContextType {
  user: any;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any | null }>;
  signUpWithEmailOnly: (email: string) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  verifyOtpAndUpdatePassword: (email: string, token: string, password: string) => Promise<{ error: any | null }>;
  verifyOtpAndCreateAccount: (email: string, token: string, password: string) => Promise<{ error: any | null }>;
  updatePassword: (password: string) => Promise<{ error: any | null }>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signUp: async () => ({ error: null }),
  signUpWithEmailOnly: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  verifyOtpAndUpdatePassword: async () => ({ error: null }),
  verifyOtpAndCreateAccount: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
});

// Helper function to validate email domain
const isValidBuntingEmail = (email: string): boolean => {
  return email.endsWith('@buntingmagnetics.com') || email.endsWith('@buntinggpt.com');
};

// Provider component that wraps app
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    // Set up authentication state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state change:', event, currentSession?.user?.email);
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          // Support demo mode fallback after sign out
          if (isDemoMode()) {
            setUser({ id: 'demo', email: getDemoEmail() || 'demo@buntingmagnetics.com' });
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        } else if (event === 'USER_UPDATED') {
          setUser(currentSession?.user ?? null);
        } else if (!currentSession && isDemoMode()) {
          // No session but demo mode enabled
          setUser({ id: 'demo', email: getDemoEmail() || 'demo@buntingmagnetics.com' });
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session with better error handling
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Session recovery error:', error.message);
          await supabase.auth.signOut();
        } else if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
        } else if (isDemoMode()) {
          // No Supabase session but demo mode enabled
          setSession(null);
          setUser({ id: 'demo', email: getDemoEmail() || 'demo@buntingmagnetics.com' });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Still allow demo mode on initialization errors
        if (isDemoMode()) {
          setUser({ id: 'demo', email: getDemoEmail() || 'demo@buntingmagnetics.com' });
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email validation
  const signUp = async (email: string, password: string) => {
    if (!isValidBuntingEmail(email)) {
      return { error: { message: "Only @buntingmagnetics.com and @buntinggpt.com email addresses are allowed" } };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  // Sign in with email validation and better error handling
  const signIn = async (email: string, password: string) => {
    if (!isValidBuntingEmail(email)) {
      return { error: { message: "Only @buntingmagnetics.com and @buntinggpt.com email addresses are allowed" } };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle specific error cases
        if (error.message === 'fetch' || error.message.includes('fetch')) {
          return { error: { message: "Network error. Please check your connection and try again." } };
        }
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: "An unexpected error occurred. Please try again." } };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      // Exit demo mode on sign out
      disableDemoMode();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password with OTP - sends 6-digit code via email
  const resetPassword = async (email: string) => {
    if (!isValidBuntingEmail(email)) {
      return { error: { message: "Only @buntingmagnetics.com and @buntinggpt.com email addresses are allowed" } };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined, // Don't use redirect for OTP flow
      });

      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Verify OTP and update password
  const verifyOtpAndUpdatePassword = async (email: string, token: string, password: string) => {
    try {
      // First verify the OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery'
      });

      if (verifyError) {
        return { error: verifyError };
      }

      // Then update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        return { error: updateError };
      }
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Email-only signup - uses reset password flow for new accounts
  const signUpWithEmailOnly = async (email: string) => {
    if (!isValidBuntingEmail(email)) {
      return { error: { message: "Only @buntingmagnetics.com and @buntinggpt.com email addresses are allowed" } };
    }

    try {
      // First, try to sign in to check if user exists
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password-to-check-existence'
      });

      // If we get a specific "Invalid login credentials" error, user might exist
      // If we get any other error or success, user exists
      if (signInError && !signInError.message.includes('Invalid login credentials')) {
        // User exists, return special error to redirect to login
        return { error: { message: "EXISTING_USER", details: "An account with this email already exists. Please sign in instead." } };
      }

      // User doesn't exist, proceed with signup
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined, // Don't use redirect for OTP flow
      });

      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Verify OTP and create new account with password
  const verifyOtpAndCreateAccount = async (email: string, token: string, password: string) => {
    try {
      // First verify the OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery'
      });

      if (verifyError) {
        return { error: verifyError };
      }

      // Then update the password (this creates the account)
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        return { error: updateError };
      }
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Update password for authenticated users
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    isLoading,
    signUp,
    signUpWithEmailOnly,
    signIn,
    signOut,
    resetPassword,
    verifyOtpAndUpdatePassword,
    verifyOtpAndCreateAccount,
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
