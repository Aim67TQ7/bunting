import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { isDemoMode, getDemoEmail, disableDemoMode } from "@/utils/demoMode";

// =============================================================================
// IFRAME REGISTRY - Global tracking of embedded apps for token propagation
// =============================================================================
const activeIframes = new Map<string, { iframe: HTMLIFrameElement; origin: string }>();

export function registerIframe(id: string, iframe: HTMLIFrameElement, origin: string) {
  activeIframes.set(id, { iframe, origin });
  console.log(`[AuthContext] Iframe registered: ${origin} (${activeIframes.size} total)`);
}

export function unregisterIframe(id: string) {
  activeIframes.delete(id);
  console.log(`[AuthContext] Iframe unregistered (${activeIframes.size} remaining)`);
}

// Propagate tokens to ALL registered iframes (called on TOKEN_REFRESHED and SIGNED_IN)
function propagateTokensToIframes(session: Session) {
  if (activeIframes.size === 0) return;
  
  console.log(`[AuthContext] Propagating tokens to ${activeIframes.size} iframes`);
  
  activeIframes.forEach(({ iframe, origin }, id) => {
    if (!iframe.contentWindow) {
      console.warn(`[AuthContext] Iframe ${id} has no contentWindow`);
      return;
    }
    
    try {
      // Send new standardized format
      iframe.contentWindow.postMessage({
        type: 'BUNTINGGPT_AUTH_TOKEN',
        user: {
          id: session.user.id,
          email: session.user.email || ''
        },
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        access_token: session.access_token,  // Legacy format
        refresh_token: session.refresh_token, // Legacy format
        token: session.access_token,          // Legacy format
        expiresAt: session.expires_at,
        origin: window.location.origin,
        timestamp: Date.now()
      }, origin);
      
      // Also send legacy format for older embedded apps
      iframe.contentWindow.postMessage({
        type: 'PROVIDE_TOKEN',
        token: session.access_token,
        refreshToken: session.refresh_token,
        origin: window.location.origin,
        timestamp: Date.now()
      }, origin);
      
      iframe.contentWindow.postMessage({
        type: 'PROVIDE_USER',
        user: { 
          id: session.user.id, 
          email: session.user.email || '' 
        },
        origin: window.location.origin,
        timestamp: Date.now()
      }, origin);
      
      console.log(`[AuthContext] Tokens sent to iframe: ${origin}`);
    } catch (err) {
      console.error(`[AuthContext] Failed to send tokens to iframe ${origin}:`, err);
    }
  });
}

// =============================================================================
// AUTH CONTEXT TYPE
// =============================================================================
interface BadgeLookupResult {
  exists: boolean;
  hasAccount?: boolean;
  employeeName?: string;
  supervisorEmail?: string;
  error?: string;
  requiresPinChange?: boolean;
}

interface AuthContextType {
  user: any;
  session: any;
  isLoading: boolean;
  sessionChecked: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any | null }>;
  signUpWithEmailOnly: (email: string) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signInWithMicrosoft: () => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  verifyOtpAndUpdatePassword: (email: string, token: string, password: string) => Promise<{ error: any | null }>;
  verifyOtpAndCreateAccount: (email: string, token: string, password: string) => Promise<{ error: any | null }>;
  updatePassword: (password: string) => Promise<{ error: any | null }>;
  // Badge auth methods
  lookupBadge: (badgeNumber: string) => Promise<BadgeLookupResult>;
  signUpWithBadge: (badgeNumber: string) => Promise<{ error: any | null; supervisorEmail?: string }>;
  verifyBadgeSignup: (badgeNumber: string, otp: string, pin: string) => Promise<{ error: any | null; session?: any }>;
  signInWithBadge: (badgeNumber: string, pin: string) => Promise<{ error: any | null; requiresPinChange?: boolean }>;
  resetBadgePin: (badgeNumber: string) => Promise<{ error: any | null; supervisorEmail?: string }>;
  verifyBadgePinReset: (badgeNumber: string, otp: string, newPin: string) => Promise<{ error: any | null }>;
  // QR code signup flow
  quickSignUpWithBadge: (badgeNumber: string, pin: string) => Promise<{ error: any | null; requiresPinChange?: boolean; employeeName?: string }>;
  changeBadgePin: (badgeNumber: string, currentPin: string, newPin: string) => Promise<{ error: any | null }>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  sessionChecked: false,
  signUp: async () => ({ error: null }),
  signUpWithEmailOnly: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signInWithMicrosoft: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  verifyOtpAndUpdatePassword: async () => ({ error: null }),
  verifyOtpAndCreateAccount: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  // Badge auth defaults
  lookupBadge: async () => ({ exists: false }),
  signUpWithBadge: async () => ({ error: null }),
  verifyBadgeSignup: async () => ({ error: null }),
  signInWithBadge: async () => ({ error: null }),
  resetBadgePin: async () => ({ error: null }),
  verifyBadgePinReset: async () => ({ error: null }),
  // QR code signup flow
  quickSignUpWithBadge: async () => ({ error: null }),
  changeBadgePin: async () => ({ error: null }),
});

// Helper function to validate email domain
const isValidBuntingEmail = (email: string): boolean => {
  return email.endsWith('@buntingmagnetics.com') || email.endsWith('@buntinggpt.com');
};

// Helper to detect if we're returning from OAuth callback
const hasOAuthCallbackParams = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash;
  const search = window.location.search;
  return hash.includes('access_token') || 
         hash.includes('error') ||
         search.includes('code=') ||
         search.includes('error=');
};

// =============================================================================
// ENSURE USER RECORDS EXIST - Defensive creation for OAuth users
// =============================================================================
async function ensureUserRecordsExist(userId: string, userMetadata: any, email: string | undefined) {
  console.log('[AuthContext] Ensuring user records exist for:', email);
  
  try {
    // Check and create profiles record if missing
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (!profile && !profileError) {
      const fullName = userMetadata?.full_name || userMetadata?.name || '';
      const firstName = fullName ? fullName.split(' ')[0] : (email ? email.split('@')[0] : 'User');
      
      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId,
        first_name: firstName,
      });
      
      if (insertError) {
        console.warn('[AuthContext] Failed to create profile:', insertError.message);
      } else {
        console.log('[AuthContext] Created profiles record');
      }
    }
    
    // Check and create emps record if missing
    const { data: emp, error: empError } = await supabase
      .from('emps')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!emp && !empError) {
      const displayName = userMetadata?.full_name || userMetadata?.name || (email ? email.split('@')[0] : 'New User');
      
      const { error: insertError } = await supabase.from('emps').insert({
        user_id: userId,
        display_name: displayName,
      });
      
      if (insertError) {
        console.warn('[AuthContext] Failed to create emps record:', insertError.message);
      } else {
        console.log('[AuthContext] Created emps record');
      }
    }
    
    // Check and create user_preferences record if missing
    const { data: prefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!prefs && !prefsError) {
      const { error: insertError } = await supabase.from('user_preferences').insert({
        user_id: userId,
        theme: 'dark',
        enabled_functions: ['magnetism_calculator', 'five_why', 'ai_assistant'],
      });
      
      if (insertError) {
        console.warn('[AuthContext] Failed to create user_preferences:', insertError.message);
      } else {
        console.log('[AuthContext] Created user_preferences record');
      }
    }
    
    console.log('[AuthContext] User records check complete');
  } catch (error) {
    console.error('[AuthContext] Error ensuring user records exist:', error);
  }
}


// Provider component that wraps app
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    let oauthTimeout: NodeJS.Timeout | null = null;

    // Set up authentication state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state change:', event, currentSession?.user?.email);
        
        // Debug: Log token lengths (never log actual values for security)
        if (currentSession) {
          console.log('[AuthContext] Token diagnostics:', {
            event,
            hasAccessToken: !!currentSession.access_token,
            accessTokenLength: currentSession.access_token?.length || 0,
            hasRefreshToken: !!currentSession.refresh_token,
            refreshTokenLength: currentSession.refresh_token?.length || 0,
            // Refresh tokens should be substantial (100+ chars typically)
            refreshTokenValid: (currentSession.refresh_token?.length || 0) > 20
          });
        }
        
        if (!mounted) return;

        // Clear OAuth timeout if we got an auth event
        if (oauthTimeout) {
          clearTimeout(oauthTimeout);
          oauthTimeout = null;
        }
        
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
          
          // CRITICAL: Propagate tokens to ALL registered iframes
          if (currentSession) {
            console.log(`[AuthContext] ${event} - propagating to iframes`);
            propagateTokensToIframes(currentSession);
            
            // DEFENSIVE: Ensure user records exist for OAuth users (especially Microsoft)
            // This runs in background without blocking the auth flow
            if (event === 'SIGNED_IN') {
              ensureUserRecordsExist(
                currentSession.user.id,
                currentSession.user.user_metadata,
                currentSession.user.email
              );
            }
          }
          
          // Clean URL after OAuth callback
          if (hasOAuthCallbackParams()) {
            window.history.replaceState({}, '', window.location.pathname);
          }
          
          // Mark session as checked for OAuth flow
          setSessionChecked(true);
          setIsLoading(false);
        } else if (event === 'USER_UPDATED') {
          setUser(currentSession?.user ?? null);
        } else if (event === 'INITIAL_SESSION') {
          // Handle initial session event - this fires when auth state is first determined
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            // Also propagate on initial session if iframes are already registered
            propagateTokensToIframes(currentSession);
          } else if (isDemoMode()) {
            setUser({ id: 'demo', email: getDemoEmail() || 'demo@buntingmagnetics.com' });
          }
          
          // Only mark as checked if NOT waiting for OAuth callback
          if (!hasOAuthCallbackParams()) {
            setSessionChecked(true);
            setIsLoading(false);
          }
        } else if (!currentSession && isDemoMode()) {
          // No session but demo mode enabled
          setUser({ id: 'demo', email: getDemoEmail() || 'demo@buntingmagnetics.com' });
        }
        
        // Only set loading false if we got a definitive auth event (and not OAuth waiting)
        if (event !== 'INITIAL_SESSION' && !hasOAuthCallbackParams()) {
          setIsLoading(false);
        }
      }
    );

    // Check for existing session with better error handling
    const initializeAuth = async () => {
      // If we're returning from OAuth, try to exchange the code immediately (more reliable than waiting)
      if (hasOAuthCallbackParams()) {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          console.log('[AuthContext] OAuth code detected, exchanging for session...');

          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (!mounted) return;

            if (error) {
              console.error('[AuthContext] OAuth code exchange failed:', error);
              toast({
                title: 'Microsoft login failed',
                description: error.message || 'Could not complete OAuth login. Please try again.',
                variant: 'destructive',
              });
              setSessionChecked(true);
              setIsLoading(false);
              window.history.replaceState({}, '', window.location.pathname);
              return;
            }

            console.log('[AuthContext] OAuth code exchange succeeded for:', data?.user?.email);
            // Session/user will also be set via onAuthStateChange, but set optimistic state to avoid loops.
            if (data?.session) {
              setSession(data.session);
              setUser(data.session.user);
              propagateTokensToIframes(data.session);
              setSessionChecked(true);
              setIsLoading(false);
            }

            window.history.replaceState({}, '', window.location.pathname);
            return;
          } catch (err) {
            console.error('[AuthContext] OAuth code exchange threw:', err);
            if (mounted) {
              toast({
                title: 'Microsoft login failed',
                description: 'Could not complete OAuth login. Please try again.',
                variant: 'destructive',
              });
              setSessionChecked(true);
              setIsLoading(false);
              window.history.replaceState({}, '', window.location.pathname);
            }
            return;
          }
        }

        console.log('[AuthContext] OAuth callback detected, waiting for auth event...');

        // Set a timeout to prevent infinite waiting if OAuth fails
        oauthTimeout = setTimeout(() => {
          if (mounted && isLoading) {
            console.log('OAuth callback timeout - no auth event received');
            setSessionChecked(true);
            setIsLoading(false);
            // Clean URL even on timeout
            window.history.replaceState({}, '', window.location.pathname);
          }
        }, 5000);

        return;
      }

      try {
        console.log('Initializing auth session...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.warn('Session recovery error:', error.message);
          await supabase.auth.signOut();
        } else if (currentSession) {
          console.log('Found existing session for:', currentSession.user?.email);
          // Debug: Log token lengths from getSession
          console.log('[AuthContext] getSession token diagnostics:', {
            accessTokenLength: currentSession.access_token?.length || 0,
            refreshTokenLength: currentSession.refresh_token?.length || 0,
            refreshTokenValid: (currentSession.refresh_token?.length || 0) > 20
          });
          setSession(currentSession);
          setUser(currentSession.user);
        } else if (isDemoMode()) {
          // No Supabase session but demo mode enabled
          console.log('No session, but demo mode enabled');
          setSession(null);
          setUser({ id: 'demo', email: getDemoEmail() || 'demo@buntingmagnetics.com' });
        } else {
          console.log('No session found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Still allow demo mode on initialization errors
        if (isDemoMode()) {
          setUser({ id: 'demo', email: getDemoEmail() || 'demo@buntingmagnetics.com' });
        }
      } finally {
        if (mounted) {
          setSessionChecked(true);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (oauthTimeout) clearTimeout(oauthTimeout);
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

  // Sign in with Microsoft (Azure AD)
  const signInWithMicrosoft = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          scopes: 'email profile openid',
        }
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Microsoft sign in error:', error);
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

  // =============================================================================
  // BADGE AUTHENTICATION METHODS
  // =============================================================================
  
  const lookupBadge = async (badgeNumber: string): Promise<BadgeLookupResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'lookup', badgeNumber },
      });

      if (error) {
        return { exists: false, error: error.message };
      }

      return data as BadgeLookupResult;
    } catch (error: any) {
      return { exists: false, error: error.message || 'Failed to lookup badge' };
    }
  };

  const signUpWithBadge = async (badgeNumber: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'signup-request', badgeNumber },
      });

      if (error) {
        return { error: { message: error.message } };
      }

      if (data.error) {
        return { error: { message: data.error } };
      }

      return { error: null, supervisorEmail: data.supervisorEmail };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to request badge signup' } };
    }
  };

  const verifyBadgeSignup = async (badgeNumber: string, otp: string, pin: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'signup-verify', badgeNumber, otp, pin },
      });

      if (error) {
        return { error: { message: error.message } };
      }

      if (data.error) {
        return { error: { message: data.error } };
      }

      // If we got a session back, set it
      if (data.session) {
        await supabase.auth.setSession(data.session);
        return { error: null, session: data.session };
      }

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to verify badge signup' } };
    }
  };

  const signInWithBadge = async (badgeNumber: string, pin: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'login', badgeNumber, pin },
      });

      if (error) {
        return { error: { message: error.message } };
      }

      if (data.error) {
        return { error: { message: data.error } };
      }

      // If we got a magic link, verify it to get a session
      if (data.magicLink) {
        // Extract the token from the magic link URL
        const url = new URL(data.magicLink);
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');

        if (token && type === 'magiclink') {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'magiclink',
          });

          if (verifyError) {
            return { error: { message: verifyError.message } };
          }
        }
      }

      return { error: null, requiresPinChange: data.requiresPinChange };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to sign in with badge' } };
    }
  };

  const resetBadgePin = async (badgeNumber: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'reset-request', badgeNumber },
      });

      if (error) {
        return { error: { message: error.message } };
      }

      if (data.error) {
        return { error: { message: data.error } };
      }

      return { error: null, supervisorEmail: data.supervisorEmail };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to request PIN reset' } };
    }
  };

  const verifyBadgePinReset = async (badgeNumber: string, otp: string, newPin: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'reset-verify', badgeNumber, otp, pin: newPin },
      });

      if (error) {
        return { error: { message: error.message } };
      }

      if (data.error) {
        return { error: { message: data.error } };
      }

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to reset PIN' } };
    }
  };

  // =============================================================================
  // QR CODE SIGNUP FLOW METHODS
  // =============================================================================

  const quickSignUpWithBadge = async (badgeNumber: string, pin: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'quick-signup', badgeNumber, pin },
      });

      if (error) {
        return { error: { message: error.message } };
      }

      if (data.error) {
        return { error: { message: data.error } };
      }

      // If we got a magic link, verify it to get a session
      if (data.magicLink) {
        const url = new URL(data.magicLink);
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');

        if (token && type === 'magiclink') {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'magiclink',
          });

          if (verifyError) {
            return { error: { message: verifyError.message } };
          }
        }
      }

      return { 
        error: null, 
        requiresPinChange: data.requiresPinChange,
        employeeName: data.employeeName,
      };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to create account' } };
    }
  };

  const changeBadgePin = async (badgeNumber: string, currentPin: string, newPin: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'change-pin', badgeNumber, pin: currentPin, newPin },
      });

      if (error) {
        return { error: { message: error.message } };
      }

      if (data.error) {
        return { error: { message: data.error } };
      }

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to change PIN' } };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    sessionChecked,
    signUp,
    signUpWithEmailOnly,
    signIn,
    signInWithMicrosoft,
    signOut,
    resetPassword,
    verifyOtpAndUpdatePassword,
    verifyOtpAndCreateAccount,
    updatePassword,
    // Badge auth
    lookupBadge,
    signUpWithBadge,
    verifyBadgeSignup,
    signInWithBadge,
    resetBadgePin,
    verifyBadgePinReset,
    // QR code signup flow
    quickSignUpWithBadge,
    changeBadgePin,
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
