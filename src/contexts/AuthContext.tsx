import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { useBuntingAuth } from '@/hooks/useBuntingAuth';
import { isDemoMode, getDemoEmail, disableDemoMode } from "@/utils/demoMode";
import { Database } from "@/integrations/supabase/types";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================
type EmployeeLocation = Database["public"]["Enums"]["employee_location"];
type JobLevel = Database["public"]["Enums"]["job_level"];

const VALID_LOCATIONS: EmployeeLocation[] = ["Newton", "DuBois", "Redditch", "Berkhamsted", "Home-Office"];
const VALID_JOB_LEVELS: JobLevel[] = ["Admin", "Employee", "Executive", "Lead", "Manager", "Supervisor"];

const AUTH_HUB_URL = 'https://login.buntinggpt.com';

// =============================================================================
// CACHED SESSION FOR INSTANT AUTH BROADCAST TO IFRAMES
// =============================================================================
let cachedAccessToken: string | null = null;

const broadcastAuth = () => {
  console.log('[Auth] Broadcasting to all iframes, token exists:', !!cachedAccessToken);
  
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

const updateCachedToken = (token: string | null) => {
  cachedAccessToken = token;
  console.log('[Auth] Token cache updated, exists:', !!token);
};

// =============================================================================
// HELPER FUNCTIONS FOR USER RECORD MANAGEMENT
// =============================================================================
const ensureEmployeeLink = async (userId: string, userEmail: string) => {
  if (!userId || !userEmail) return;
  
  try {
    const { data: existingLink } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingLink) {
      console.log('[AuthContext] User already linked to employee record');
      return;
    }
    
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
      const { error: updateError } = await supabase
        .from('employees')
        .update({ user_id: userId })
        .eq('id', employee.id);
      
      if (updateError) {
        console.warn('[AuthContext] Failed to link user to employee:', updateError.message);
      } else {
        console.log('[AuthContext] Successfully linked user to employee record');
      }
    }
  } catch (err) {
    console.warn('[AuthContext] ensureEmployeeLink error:', err);
  }
};

const ensureUserRecordsExist = async (user: User) => {
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
      const firstName = fullName.split(' ')[0] || email.split('@')[0];
      await supabase.from('profiles').insert({ id: userId, first_name: firstName });
      console.log('[AuthContext] Created profiles record');
    }
    
    // Check/create emps record
    const { data: existingEmp } = await supabase
      .from('emps')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!existingEmp) {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('location, job_level, department, job_title')
        .eq('user_email', email)
        .maybeSingle();
      
      const rawLocation = employeeData?.location;
      const validLocation: EmployeeLocation | null = 
        rawLocation && VALID_LOCATIONS.includes(rawLocation as EmployeeLocation) 
          ? (rawLocation as EmployeeLocation) : null;
      
      const rawJobLevel = employeeData?.job_level;
      const validJobLevel: JobLevel | null = 
        rawJobLevel && VALID_JOB_LEVELS.includes(rawJobLevel as JobLevel) 
          ? (rawJobLevel as JobLevel) : null;
      
      await supabase.from('emps').insert({
        user_id: userId,
        display_name: fullName,
        location: validLocation,
        job_level: validJobLevel,
        department: employeeData?.department || null,
        job_title: employeeData?.job_title || null
      });
      console.log('[AuthContext] Created emps record');
    }
    
    // Check/create user_preferences record
    const { data: existingPrefs } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!existingPrefs) {
      await supabase.from('user_preferences').insert({ user_id: userId });
      console.log('[AuthContext] Created user_preferences record');
    }
  } catch (err) {
    console.warn('[AuthContext] ensureUserRecordsExist error:', err);
  }
};

// =============================================================================
// AUTH CONTEXT TYPE (Simplified - auth methods redirect to login hub)
// =============================================================================
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  sessionChecked: boolean;
  isSettingUpRecords: boolean;
  /** Redirect to login hub */
  login: () => void;
  /** Sign out via login hub */
  signOut: () => void;
  /** @deprecated Use login() instead - redirects to login hub */
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  /** @deprecated Use login() instead - redirects to login hub */
  signUp: (email: string, password: string) => Promise<{ error: any | null }>;
  /** @deprecated Use login() instead - redirects to login hub */
  signInWithMicrosoft: () => Promise<{ error: any | null }>;
  /** @deprecated Handled by login hub */
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  /** @deprecated Handled by login hub */
  updatePassword: (password: string) => Promise<{ error: any | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// AUTH PROVIDER - Uses useBuntingAuth + iframe broadcasting
// =============================================================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSettingUpRecords, setIsSettingUpRecords] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [recordsSetupDone, setRecordsSetupDone] = useState(false);
  
  // Use the centralized Bunting auth hook
  const buntingAuth = useBuntingAuth({
    requireAuth: false, // Let PrivateRoute handle redirects
  });

  // Handle auth state changes - broadcast tokens and set up user records
  useEffect(() => {
    // Don't process until initial load is complete
    if (buntingAuth.isLoading) return;
    
    console.log('[AuthContext] Auth state update:', buntingAuth.user?.email || 'no user', 'loading:', buntingAuth.isLoading);
    
    // Update token cache and broadcast to iframes
    if (buntingAuth.session?.access_token) {
      updateCachedToken(buntingAuth.session.access_token);
      broadcastAuth();
    } else {
      updateCachedToken(null);
      broadcastAuth();
    }
    
    // Mark session as checked once we have a definitive answer
    setSessionChecked(true);
    
    // Ensure user records exist for authenticated users
    if (buntingAuth.user && buntingAuth.isAuthenticated && !recordsSetupDone) {
      setIsSettingUpRecords(true);
      (async () => {
        try {
          if (buntingAuth.user?.email) {
            await ensureEmployeeLink(buntingAuth.user.id, buntingAuth.user.email);
          }
          await ensureUserRecordsExist(buntingAuth.user!);
        } finally {
          setIsSettingUpRecords(false);
          setRecordsSetupDone(true);
        }
      })();
    } else if (!buntingAuth.user) {
      // Reset for next login
      setRecordsSetupDone(false);
    }
  }, [buntingAuth.isLoading, buntingAuth.user, buntingAuth.isAuthenticated, buntingAuth.session, recordsSetupDone]);

  // Demo mode support
  const effectiveUser = isDemoMode() && !buntingAuth.user 
    ? { id: 'demo', email: getDemoEmail() || 'demo@buntingmagnetics.com' } as User
    : buntingAuth.user;

  // ==========================================================================
  // IFRAME AUTH REQUEST LISTENER
  // ==========================================================================
  useEffect(() => {
    const handleAuthRequest = async (event: MessageEvent) => {
      if (!event.origin.endsWith('.buntinggpt.com') && event.origin !== 'https://buntinggpt.com') {
        return;
      }
      
      if (event.data?.type === 'REQUEST_AUTH' || event.data?.type === 'BUNTINGGPT_AUTH_REQUEST') {
        console.log('[Auth] Received auth request from:', event.origin);
        
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession?.access_token && event.source) {
            (event.source as Window).postMessage({
              type: 'AUTH_TOKEN',
              token: currentSession.access_token,
              refreshToken: currentSession.refresh_token || null,
              user: currentSession.user ? { id: currentSession.user.id, email: currentSession.user.email } : null
            }, event.origin);
          } else if (cachedAccessToken && event.source) {
            (event.source as Window).postMessage({
              type: 'AUTH_TOKEN',
              token: cachedAccessToken
            }, event.origin);
          }
        } catch (e) {
          if (cachedAccessToken && event.source) {
            (event.source as Window).postMessage({
              type: 'AUTH_TOKEN',
              token: cachedAccessToken
            }, event.origin);
          }
        }
      }
    };
    
    window.addEventListener('message', handleAuthRequest);

    // Observe DOM for new iframes
    const handleIframeLoad = () => broadcastAuth();
    
    const addLoadListenerToIframe = (iframe: HTMLIFrameElement) => {
      iframe.removeEventListener('load', handleIframeLoad);
      iframe.addEventListener('load', handleIframeLoad);
    };
    
    document.querySelectorAll('iframe').forEach(iframe => {
      addLoadListenerToIframe(iframe as HTMLIFrameElement);
    });
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IFRAME') {
            addLoadListenerToIframe(node as HTMLIFrameElement);
            if (cachedAccessToken) {
              setTimeout(broadcastAuth, 0);
            }
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('message', handleAuthRequest);
      observer.disconnect();
    };
  }, []);

  // ==========================================================================
  // DEPRECATED AUTH METHODS (redirect to login hub)
  // ==========================================================================
  const signOut = () => {
    if (isDemoMode()) {
      disableDemoMode();
    }
    buntingAuth.logout();
  };

  const deprecatedRedirect = () => {
    buntingAuth.login();
    return Promise.resolve({ error: null });
  };

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================
  const value: AuthContextType = {
    user: effectiveUser,
    session: buntingAuth.session,
    isLoading: buntingAuth.isLoading,
    sessionChecked,
    isSettingUpRecords,
    login: buntingAuth.login,
    signOut,
    // Deprecated - redirect to login hub
    signIn: deprecatedRedirect,
    signUp: deprecatedRedirect,
    signInWithMicrosoft: deprecatedRedirect,
    resetPassword: deprecatedRedirect,
    updatePassword: deprecatedRedirect,
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
