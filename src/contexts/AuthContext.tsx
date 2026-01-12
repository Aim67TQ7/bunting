import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { isDemoMode, getDemoEmail, disableDemoMode } from "@/utils/demoMode";
import { Database } from "@/integrations/supabase/types";

type EmployeeLocation = Database["public"]["Enums"]["employee_location"];
type JobLevel = Database["public"]["Enums"]["job_level"];

const VALID_LOCATIONS: EmployeeLocation[] = ["Newton", "DuBois", "Redditch", "Berkhamsted", "Home-Office"];
const VALID_JOB_LEVELS: JobLevel[] = ["Admin", "Employee", "Executive", "Lead", "Manager", "Supervisor"];

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
  isSettingUpRecords: boolean;
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
  isSettingUpRecords: false,
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

// Helper function to link auth user to employees table via email
const ensureEmployeeLink = async (userId: string, userEmail: string) => {
  if (!userId || !userEmail) return;
  
  try {
    // Check if user is already linked to an employee
    const { data: existingLink } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingLink) {
      console.log('[AuthContext] User already linked to employee record');
      return;
    }
    
    // Try to find employee by email and link them
    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, user_id')
      .eq('user_email', userEmail)
      .maybeSingle();
    
    if (error) {
      console.warn('[AuthContext] Employee lookup error:', error.message);
      return;
    }
    
    if (employee && !employee.user_id) {
      // Found an unlinked employee with matching email - link them
      const { error: updateError } = await supabase
        .from('employees')
        .update({ user_id: userId })
        .eq('id', employee.id);
      
      if (updateError) {
        console.warn('[AuthContext] Failed to link user to employee:', updateError.message);
      } else {
        console.log('[AuthContext] Successfully linked user to employee record');
      }
    } else if (!employee) {
      console.log('[AuthContext] No employee record found for email:', userEmail);
    }
  } catch (err) {
    console.warn('[AuthContext] ensureEmployeeLink error:', err);
  }
};

// Helper function to ensure profiles and emps records exist for OAuth users
const ensureUserRecordsExist = async (user: { id: string; email?: string; user_metadata?: any }) => {
  if (!user?.id) return;
  
  const userId = user.id;
  const email = user.email || '';
  const fullName = user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   email.split('@')[0] || 'User';
  
  console.log('[AuthContext] Ensuring user records exist for:', email);
  
  try {
    // Check/create profiles record
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (!existingProfile) {
      console.log('[AuthContext] Creating missing profiles record');
      const firstName = fullName.split(' ')[0] || email.split('@')[0];
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          first_name: firstName
        });
      
      if (profileError) {
        console.warn('[AuthContext] Failed to create profiles record:', profileError.message);
      } else {
        console.log('[AuthContext] Created profiles record for:', email);
      }
    }
    
    // Check/create emps record
    const { data: existingEmp } = await supabase
      .from('emps')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!existingEmp) {
      console.log('[AuthContext] Creating missing emps record');
      
      // Try to get data from employees table by email for location/job info
      const { data: employeeData } = await supabase
        .from('employees')
        .select('location, job_level, department, job_title')
        .eq('user_email', email)
        .maybeSingle();
      
      // Validate location against emps enum values
      const rawLocation = employeeData?.location;
      const validLocation: EmployeeLocation | null = 
        rawLocation && VALID_LOCATIONS.includes(rawLocation as EmployeeLocation) 
          ? (rawLocation as EmployeeLocation) 
          : null;
      
      // Validate job_level against emps enum values
      const rawJobLevel = employeeData?.job_level;
      const validJobLevel: JobLevel | null = 
        rawJobLevel && VALID_JOB_LEVELS.includes(rawJobLevel as JobLevel) 
          ? (rawJobLevel as JobLevel) 
          : null;
      
      const { error: empError } = await supabase
        .from('emps')
        .insert({
          user_id: userId,
          display_name: fullName,
          location: validLocation,
          job_level: validJobLevel,
          department: employeeData?.department || null,
          job_title: employeeData?.job_title || null
        });
      
      if (empError) {
        console.warn('[AuthContext] Failed to create emps record:', empError.message);
      } else {
        console.log('[AuthContext] Created emps record for:', email);
      }
    }
    
    // Check/create user_preferences record
    const { data: existingPrefs } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!existingPrefs) {
      console.log('[AuthContext] Creating missing user_preferences record');
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId
        });
      
      if (prefsError) {
        console.warn('[AuthContext] Failed to create user_preferences record:', prefsError.message);
      } else {
        console.log('[AuthContext] Created user_preferences record for:', email);
      }
    }
  } catch (err) {
    console.warn('[AuthContext] ensureUserRecordsExist error:', err);
  }
};

// Provider component that wraps app
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isSettingUpRecords, setIsSettingUpRecords] = useState(false);

  useEffect(() => {
    let mounted = true;
    let oauthTimeout: NodeJS.Timeout | null = null;

    // Async handler to properly await record creation before updating state
    const handleAuthStateChange = async (event: string, currentSession: Session | null) => {
      console.log('Auth state change:', event, currentSession?.user?.email);
      
      // Debug: Log token lengths (never log actual values for security)
      if (currentSession) {
        console.log('[AuthContext] Token diagnostics:', {
          event,
          hasAccessToken: !!currentSession.access_token,
          accessTokenLength: currentSession.access_token?.length || 0,
          hasRefreshToken: !!currentSession.refresh_token,
          refreshTokenLength: currentSession.refresh_token?.length || 0,
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
        // CRITICAL: Propagate tokens to ALL registered iframes
        if (currentSession) {
          console.log(`[AuthContext] ${event} - propagating to iframes`);
          propagateTokensToIframes(currentSession);
          
          // On SIGNED_IN, ensure user records exist BEFORE updating state
          // This prevents Auth.tsx from checking emps before records are created
          if (event === 'SIGNED_IN' && currentSession.user) {
            setIsSettingUpRecords(true);  // Block Auth.tsx redirect
            try {
              const userEmail = currentSession.user.email;
              if (userEmail) {
                console.log('[AuthContext] Awaiting ensureEmployeeLink...');
                await ensureEmployeeLink(currentSession.user.id, userEmail);
              }
              console.log('[AuthContext] Awaiting ensureUserRecordsExist...');
              await ensureUserRecordsExist(currentSession.user);
              console.log('[AuthContext] User records setup complete');
            } finally {
              setIsSettingUpRecords(false);
            }
          }
        }
        
        // NOW update state - Auth.tsx useEffect will find the records
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
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
    };

    // Set up authentication state listener - calls async handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        handleAuthStateChange(event, currentSession);
      }
    );

    // ==========================================================================
    // GLOBAL AUTH REQUEST HANDLER
    // Responds to BUNTINGGPT_AUTH_REQUEST from ANY *.buntinggpt.com subdomain
    // ==========================================================================
    const handleGlobalAuthRequest = async (event: MessageEvent) => {
      // Only accept requests from *.buntinggpt.com origins
      const origin = event.origin;
      if (!origin.endsWith('.buntinggpt.com') && origin !== 'https://buntinggpt.com') {
        return;
      }
      
      const messageType = event.data?.type;
      if (messageType !== 'BUNTINGGPT_AUTH_REQUEST' && messageType !== 'REQUEST_TOKEN') {
        return;
      }
      
      console.log('[AuthContext] Global auth request received from:', origin, messageType);
      
      // Get fresh session (don't rely on state which may be stale)
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token || !currentSession?.refresh_token) {
        console.warn('[AuthContext] No session available to respond to auth request');
        return;
      }
      
      // Validate access token format (must be JWT with 3 parts)
      if (currentSession.access_token.split('.').length !== 3) {
        console.error('[AuthContext] Invalid access token format - not a JWT');
        return;
      }
      
      // Validate refresh token (opaque string, just check minimum length)
      if (currentSession.refresh_token.length < 20) {
        console.error('[AuthContext] Refresh token appears truncated:', currentSession.refresh_token.length);
        return;
      }
      
      // Reply to the requesting window
      const sourceWindow = event.source as Window;
      if (!sourceWindow) {
        console.warn('[AuthContext] No source window to reply to');
        return;
      }
      
      // Send BUNTINGGPT_AUTH_TOKEN response with both formats
      const authMessage = {
        type: 'BUNTINGGPT_AUTH_TOKEN',
        // Camel case format (new standard)
        accessToken: currentSession.access_token,
        refreshToken: currentSession.refresh_token,
        // Snake case format (legacy compatibility)
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token,
        user: {
          id: currentSession.user.id,
          email: currentSession.user.email || ''
        },
        origin: window.location.origin,
        timestamp: Date.now()
      };
      
      try {
        sourceWindow.postMessage(authMessage, origin);
        console.log('[AuthContext] Auth response sent to:', origin);
      } catch (err) {
        console.error('[AuthContext] Failed to send auth response:', err);
      }
    };
    
    window.addEventListener('message', handleGlobalAuthRequest);

    // Check for existing session with better error handling
    const initializeAuth = async () => {
      // If we're returning from OAuth, wait for the auth event instead of calling getSession immediately
      if (hasOAuthCallbackParams()) {
        console.log('OAuth callback detected, waiting for auth event...');
        
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
      window.removeEventListener('message', handleGlobalAuthRequest);
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
  
  // Helper to pad badge numbers to 5 digits with leading zeros
  const padBadgeNumber = (badge: string): string => {
    // Remove any non-digit characters and pad to 5 digits
    const digitsOnly = badge.replace(/\D/g, '');
    return digitsOnly.padStart(5, '0');
  };
  
  const lookupBadge = async (badgeNumber: string): Promise<BadgeLookupResult> => {
    try {
      const paddedBadge = padBadgeNumber(badgeNumber);
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'lookup', badgeNumber: paddedBadge },
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
      const paddedBadge = padBadgeNumber(badgeNumber);
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'signup-request', badgeNumber: paddedBadge },
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
      const paddedBadge = padBadgeNumber(badgeNumber);
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'signup-verify', badgeNumber: paddedBadge, otp, pin },
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
      const paddedBadge = padBadgeNumber(badgeNumber);
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'login', badgeNumber: paddedBadge, pin },
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
      const paddedBadge = padBadgeNumber(badgeNumber);
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'reset-request', badgeNumber: paddedBadge },
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
      const paddedBadge = padBadgeNumber(badgeNumber);
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'reset-verify', badgeNumber: paddedBadge, otp, pin: newPin },
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
      const paddedBadge = padBadgeNumber(badgeNumber);
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'quick-signup', badgeNumber: paddedBadge, pin },
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
      const paddedBadge = padBadgeNumber(badgeNumber);
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'change-pin', badgeNumber: paddedBadge, pin: currentPin, newPin },
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
    isSettingUpRecords,
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
