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
// CACHED SESSION FOR INSTANT AUTH BROADCAST - No async calls needed!
// =============================================================================
let cachedAccessToken: string | null = null;

// SYNCHRONOUS broadcast - uses cached token, no await needed
const broadcastAuth = () => {
  console.log('[Auth] Broadcasting to all iframes, token exists:', !!cachedAccessToken);
  
  // Find all iframes and send token immediately
  document.querySelectorAll('iframe').forEach(iframe => {
    const iframeEl = iframe as HTMLIFrameElement;
    if (iframeEl.contentWindow && iframeEl.src) {
      try {
        const iframeOrigin = new URL(iframeEl.src).origin;
        iframeEl.contentWindow.postMessage({
          type: 'AUTH_TOKEN',
          token: cachedAccessToken
        }, iframeOrigin);
        console.log('[Auth] Sent token to iframe:', iframeOrigin);
      } catch (e) {
        console.warn('[Auth] Failed to send to iframe:', e);
      }
    }
  });
};

// Update the cached token - call this whenever session changes
const updateCachedToken = (token: string | null) => {
  cachedAccessToken = token;
  console.log('[Auth] Token cache updated, exists:', !!token);
};

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

    // ==========================================================================
    // LISTEN FOR CHILD APPS REQUESTING AUTH
    // ==========================================================================
    // SYNCHRONOUS handler - uses cached token, no await needed!
    const handleAuthRequest = (event: MessageEvent) => {
      // Validate origin is one of your subdomains
      if (!event.origin.endsWith('.buntinggpt.com') && event.origin !== 'https://buntinggpt.com') {
        return;
      }
      
      if (event.data?.type === 'REQUEST_AUTH') {
        console.log('[Auth] Received REQUEST_AUTH from:', event.origin);
        if (cachedAccessToken && event.source) {
          (event.source as Window).postMessage({
            type: 'AUTH_TOKEN',
            token: cachedAccessToken
          }, event.origin);
          console.log('[Auth] Responded with AUTH_TOKEN to:', event.origin);
        }
      }
    };
    
    window.addEventListener('message', handleAuthRequest);

    // Observe DOM for new iframes and add load listeners
    const handleIframeLoad = () => broadcastAuth();
    
    const addLoadListenerToIframe = (iframe: HTMLIFrameElement) => {
      iframe.removeEventListener('load', handleIframeLoad);
      iframe.addEventListener('load', handleIframeLoad);
    };
    
    // Add listeners to existing iframes
    document.querySelectorAll('iframe').forEach(iframe => {
      addLoadListenerToIframe(iframe as HTMLIFrameElement);
    });
    
    // Watch for new iframes - also broadcast immediately if we have cached token
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IFRAME') {
            addLoadListenerToIframe(node as HTMLIFrameElement);
            // Broadcast immediately if we already have a token cached
            if (cachedAccessToken) {
              setTimeout(broadcastAuth, 0); // Next tick to let iframe initialize
            }
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // ==========================================================================
    // AUTH STATE CHANGE HANDLER
    // ==========================================================================
    const handleAuthStateChange = async (event: string, currentSession: Session | null) => {
      console.log('Auth state change:', event, currentSession?.user?.email);
      
      if (!mounted) return;

      // Clear OAuth timeout if we got an auth event
      if (oauthTimeout) {
        clearTimeout(oauthTimeout);
        oauthTimeout = null;
      }
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        // Clear cached token and broadcast logout
        updateCachedToken(null);
        broadcastAuth();
        // Support demo mode fallback after sign out
        if (isDemoMode()) {
          setUser({ id: 'demo', email: getDemoEmail() || 'demo@buntingmagnetics.com' });
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (currentSession) {
          // Update cache and broadcast immediately (synchronous!)
          updateCachedToken(currentSession.access_token);
          broadcastAuth();
          
          // On SIGNED_IN, ensure user records exist BEFORE updating state
          if (event === 'SIGNED_IN' && currentSession.user) {
            setIsSettingUpRecords(true);
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
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Clean URL after OAuth callback
        if (hasOAuthCallbackParams()) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        
        setSessionChecked(true);
        setIsLoading(false);
      } else if (event === 'USER_UPDATED') {
        setUser(currentSession?.user ?? null);
      } else if (event === 'INITIAL_SESSION') {
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          // Update cache and broadcast IMMEDIATELY - no delay!
          updateCachedToken(currentSession.access_token);
          broadcastAuth();
        } else if (isDemoMode()) {
          setUser({ id: 'demo', email: getDemoEmail() || 'demo@buntingmagnetics.com' });
        }
        
        if (!hasOAuthCallbackParams()) {
          setSessionChecked(true);
          setIsLoading(false);
        }
      } else if (!currentSession && isDemoMode()) {
        setUser({ id: 'demo', email: getDemoEmail() || 'demo@buntingmagnetics.com' });
      }
      
      if (event !== 'INITIAL_SESSION' && !hasOAuthCallbackParams()) {
        setIsLoading(false);
      }
    };

    // Set up authentication state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        handleAuthStateChange(event, currentSession);
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      if (hasOAuthCallbackParams()) {
        console.log('[AuthContext] OAuth params detected, waiting for auth callback...');
        oauthTimeout = setTimeout(() => {
          console.log('[AuthContext] OAuth timeout - falling back to getSession');
          if (mounted) {
            checkExistingSession();
          }
        }, 5000);
        return;
      }
      
      await checkExistingSession();
    };

    const checkExistingSession = async () => {
      try {
        console.log('[AuthContext] Checking existing session...');
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
            setSessionChecked(true);
          }
          return;
        }

        if (!mounted) return;

        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
          // Broadcast on initial load
          setTimeout(broadcastAuth, 100);
        } else if (isDemoMode()) {
          setUser({ id: 'demo', email: getDemoEmail() || 'demo@buntingmagnetics.com' });
        }
        
        setIsLoading(false);
        setSessionChecked(true);
      } catch (error) {
        console.error('[AuthContext] Exception getting session:', error);
        if (mounted) {
          setIsLoading(false);
          setSessionChecked(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (oauthTimeout) clearTimeout(oauthTimeout);
      subscription.unsubscribe();
      window.removeEventListener('message', handleAuthRequest);
      observer.disconnect();
    };
  }, []);

  // =============================================================================
  // AUTH METHODS
  // =============================================================================
  
  const signUp = async (email: string, password: string) => {
    if (!isValidBuntingEmail(email)) {
      return { error: { message: 'Only Bunting email addresses are allowed to register.' } };
    }

    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error('Sign up error:', error.message);
    }
    
    return { error };
  };

  const signUpWithEmailOnly = async (email: string) => {
    if (!isValidBuntingEmail(email)) {
      return { error: { message: 'Only Bunting email addresses are allowed to register.' } };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error('Email-only sign up error:', error.message);
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('Sign in error:', error.message);
    }
    
    return { error };
  };

  const signInWithMicrosoft = async () => {
    console.log('[AuthContext] Starting Microsoft OAuth sign-in...');
    console.log('[AuthContext] Current origin:', window.location.origin);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'openid profile email',
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error('[AuthContext] Microsoft sign-in error:', error.message);
    } else {
      console.log('[AuthContext] OAuth initiated - browser should redirect...');
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('[AuthContext] Signing out...');
    
    // Disable demo mode when signing out
    if (isDemoMode()) {
      disableDemoMode();
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setUser(null);
      setSession(null);
      // Broadcast logout
      broadcastAuth();
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      console.error('Reset password error:', error.message);
    }
    
    return { error };
  };

  const verifyOtpAndUpdatePassword = async (email: string, token: string, password: string) => {
    // First verify the OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery'
    });
    
    if (verifyError) {
      console.error('OTP verification error:', verifyError.message);
      return { error: verifyError };
    }

    // Then update the password
    const { error: updateError } = await supabase.auth.updateUser({ password });
    
    if (updateError) {
      console.error('Password update error:', updateError.message);
    }
    
    return { error: updateError };
  };

  const verifyOtpAndCreateAccount = async (email: string, token: string, password: string) => {
    // First verify the OTP to establish a session
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });
    
    if (verifyError) {
      console.error('OTP verification error:', verifyError.message);
      return { error: verifyError };
    }

    // Then update the user with a password
    const { error: updateError } = await supabase.auth.updateUser({ password });
    
    if (updateError) {
      console.error('Password update error:', updateError.message);
      return { error: updateError };
    }

    // Ensure user records exist
    if (data?.user) {
      await ensureUserRecordsExist(data.user);
    }
    
    return { error: null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      console.error('Update password error:', error.message);
    }
    
    return { error };
  };

  // =============================================================================
  // BADGE AUTH METHODS
  // =============================================================================
  
  const lookupBadge = async (badgeNumber: string): Promise<BadgeLookupResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'lookup', badgeNumber }
      });
      
      if (error) {
        return { exists: false, error: error.message };
      }
      
      return data;
    } catch (err) {
      console.error('Badge lookup error:', err);
      return { exists: false, error: 'Failed to lookup badge' };
    }
  };

  const signUpWithBadge = async (badgeNumber: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'signup', badgeNumber }
      });
      
      if (error) {
        return { error: { message: error.message } };
      }
      
      if (data?.error) {
        return { error: { message: data.error } };
      }
      
      return { error: null, supervisorEmail: data?.supervisorEmail };
    } catch (err) {
      console.error('Badge signup error:', err);
      return { error: { message: 'Failed to start badge signup' } };
    }
  };

  const verifyBadgeSignup = async (badgeNumber: string, otp: string, pin: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'verify-signup', badgeNumber, otp, pin }
      });
      
      if (error) {
        return { error: { message: error.message } };
      }
      
      if (data?.error) {
        return { error: { message: data.error } };
      }
      
      // If we got a session back, set it
      if (data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }
      
      return { error: null, session: data?.session };
    } catch (err) {
      console.error('Badge verify signup error:', err);
      return { error: { message: 'Failed to verify badge signup' } };
    }
  };

  const signInWithBadge = async (badgeNumber: string, pin: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'signin', badgeNumber, pin }
      });
      
      if (error) {
        return { error: { message: error.message } };
      }
      
      if (data?.error) {
        return { error: { message: data.error }, requiresPinChange: data?.requiresPinChange };
      }
      
      // If we got a session back, set it
      if (data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }
      
      return { error: null, requiresPinChange: data?.requiresPinChange };
    } catch (err) {
      console.error('Badge signin error:', err);
      return { error: { message: 'Failed to sign in with badge' } };
    }
  };

  const resetBadgePin = async (badgeNumber: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'reset-pin', badgeNumber }
      });
      
      if (error) {
        return { error: { message: error.message } };
      }
      
      if (data?.error) {
        return { error: { message: data.error } };
      }
      
      return { error: null, supervisorEmail: data?.supervisorEmail };
    } catch (err) {
      console.error('Badge reset pin error:', err);
      return { error: { message: 'Failed to request PIN reset' } };
    }
  };

  const verifyBadgePinReset = async (badgeNumber: string, otp: string, newPin: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'verify-reset', badgeNumber, otp, newPin }
      });
      
      if (error) {
        return { error: { message: error.message } };
      }
      
      if (data?.error) {
        return { error: { message: data.error } };
      }
      
      return { error: null };
    } catch (err) {
      console.error('Badge verify reset error:', err);
      return { error: { message: 'Failed to verify PIN reset' } };
    }
  };

  const quickSignUpWithBadge = async (badgeNumber: string, pin: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'quick-signup', badgeNumber, pin }
      });
      
      if (error) {
        return { error: { message: error.message } };
      }
      
      if (data?.error) {
        return { error: { message: data.error }, requiresPinChange: data?.requiresPinChange };
      }
      
      // If we got a session back, set it
      if (data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }
      
      return { 
        error: null, 
        requiresPinChange: data?.requiresPinChange,
        employeeName: data?.employeeName 
      };
    } catch (err) {
      console.error('Quick badge signup error:', err);
      return { error: { message: 'Failed to sign up with badge' } };
    }
  };

  const changeBadgePin = async (badgeNumber: string, currentPin: string, newPin: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('badge-auth', {
        body: { action: 'change-pin', badgeNumber, currentPin, newPin }
      });
      
      if (error) {
        return { error: { message: error.message } };
      }
      
      if (data?.error) {
        return { error: { message: data.error } };
      }
      
      return { error: null };
    } catch (err) {
      console.error('Change badge PIN error:', err);
      return { error: { message: 'Failed to change PIN' } };
    }
  };

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================
  
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
    quickSignUpWithBadge,
    changeBadgePin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
