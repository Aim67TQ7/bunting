/**
 * Bunting Auth Hook - Reusable authentication for *.buntinggpt.com apps
 * 
 * USAGE:
 * 1. Import this hook in your app's root or protected routes
 * 2. The Supabase client uses cookie storage on production (*.buntinggpt.com)
 *    and localStorage in development (localhost)
 * 
 * NOTE: The Supabase client in @/integrations/supabase/client already has
 * cookie-based storage with 3KB chunking for cross-subdomain session sharing.
 * See src/integrations/supabase/client.ts for implementation details.
 */

import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Configuration - Update these for your environment
const AUTH_HUB_URL = 'https://login.buntinggpt.com';
const ALLOWED_DOMAINS = ['.buntinggpt.com', 'localhost'];

interface BuntingAuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface UseBuntingAuthOptions {
  /** If true, automatically redirects to login when not authenticated */
  requireAuth?: boolean;
  /** Custom return URL after login (defaults to current page) */
  returnUrl?: string;
  /** Callback when auth state changes */
  onAuthChange?: (state: BuntingAuthState) => void;
}

interface UseBuntingAuthReturn extends BuntingAuthState {
  /** Redirect to the central login hub */
  login: () => void;
  /** Sign out and redirect to logout page */
  logout: () => void;
  /** Get the user's display name */
  displayName: string | null;
  /** Get the user's email */
  email: string | null;
}

/**
 * Check if the current domain is allowed
 */
const isAllowedDomain = (): boolean => {
  const hostname = window.location.hostname;
  return ALLOWED_DOMAINS.some(domain => 
    domain === 'localhost' 
      ? hostname === 'localhost' 
      : hostname.endsWith(domain)
  );
};

/**
 * Detect if current URL contains OAuth callback parameters
 */
const hasOAuthCallbackParams = (): boolean => {
  const hash = window.location.hash;
  const search = window.location.search;
  
  // Check for OAuth tokens in hash (implicit flow)
  if (hash.includes('access_token=') || hash.includes('error=')) {
    return true;
  }
  
  // Check for OAuth code in search params (PKCE flow)
  if (search.includes('code=') || search.includes('error=')) {
    return true;
  }
  
  return false;
};

/**
 * Clean OAuth parameters from URL after processing
 */
const cleanOAuthParamsFromUrl = (): void => {
  const url = new URL(window.location.href);
  url.hash = '';
  url.searchParams.delete('code');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  window.history.replaceState({}, '', url.toString());
};

/**
 * Bunting Authentication Hook
 * 
 * Provides authentication state and methods for apps in the *.buntinggpt.com domain.
 * Sessions are shared across all subdomains via Supabase's built-in session management.
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { isLoading, isAuthenticated, user, logout } = useBuntingAuth({ 
 *     requireAuth: true 
 *   });
 * 
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!isAuthenticated) return null; // Will redirect automatically
 * 
 *   return (
 *     <div>
 *       <p>Welcome, {user?.email}</p>
 *       <button onClick={logout}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBuntingAuth(options: UseBuntingAuthOptions = {}): UseBuntingAuthReturn {
  const { requireAuth = false, returnUrl, onAuthChange } = options;

  const [state, setState] = useState<BuntingAuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });
  
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Redirect to the central login hub
  const login = useCallback(() => {
    const currentUrl = returnUrl || window.location.href;
    const loginUrl = `${AUTH_HUB_URL}?return_url=${encodeURIComponent(currentUrl)}`;
    window.location.href = loginUrl;
  }, [returnUrl]);

  // Sign out and redirect to logout page
  const logout = useCallback(async () => {
    // Clear local session first
    await supabase.auth.signOut();
    const logoutUrl = `${AUTH_HUB_URL}/logout`;
    window.location.href = logoutUrl;
  }, []);

  useEffect(() => {
    // Validate domain
    if (!isAllowedDomain()) {
      console.warn('[BuntingAuth] This hook only works on *.buntinggpt.com domains');
      setState(prev => ({ ...prev, isLoading: false }));
      setInitialCheckDone(true);
      return;
    }

    let isMounted = true;
    const isOAuthCallback = hasOAuthCallbackParams();

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log('[BuntingAuth] Auth state changed:', event, 'user:', session?.user?.email || 'none');
        
        const newState: BuntingAuthState = {
          user: session?.user ?? null,
          session,
          isLoading: false,
          isAuthenticated: !!session?.user,
        };
        
        setState(newState);
        
        // Clean URL after successful sign in from OAuth
        if (event === 'SIGNED_IN' && isOAuthCallback) {
          cleanOAuthParamsFromUrl();
        }
        
        // Only trigger callback for meaningful events (not initial session which we handle separately)
        if (event !== 'INITIAL_SESSION') {
          onAuthChange?.(newState);
        }

        // Redirect to login if auth is required and user is not authenticated
        if (requireAuth && !session?.user && event === 'SIGNED_OUT') {
          login();
        }
      }
    );

    // Handle OAuth callback with PKCE code exchange
    const handleOAuthCallback = async (): Promise<Session | null> => {
      if (!isOAuthCallback) return null;
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (error) {
        console.error('[BuntingAuth] OAuth error:', error, urlParams.get('error_description'));
        cleanOAuthParamsFromUrl();
        return null;
      }
      
      if (code) {
        console.log('[BuntingAuth] OAuth code detected, exchanging for session...');
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('[BuntingAuth] Code exchange error:', exchangeError);
            cleanOAuthParamsFromUrl();
            return null;
          }
          
          if (data.session) {
            console.log('[BuntingAuth] Session established from code exchange:', data.session.user?.email);
            cleanOAuthParamsFromUrl();
            return data.session;
          }
        } catch (err) {
          console.error('[BuntingAuth] Code exchange exception:', err);
          cleanOAuthParamsFromUrl();
          return null;
        }
      }
      
      return null;
    };

    // Initialize auth
    const initAuth = async () => {
      let session: Session | null = null;
      
      // First, handle OAuth callback if present
      if (isOAuthCallback) {
        session = await handleOAuthCallback();
        if (session) {
          console.log('[BuntingAuth] Session from OAuth callback:', session.user?.email);
          // Update state immediately with the session we got from code exchange
          if (isMounted) {
            const newState: BuntingAuthState = {
              user: session.user ?? null,
              session,
              isLoading: false,
              isAuthenticated: !!session.user,
            };
            setState(newState);
            setInitialCheckDone(true);
            onAuthChange?.(newState);
          }
          return;
        }
      }
      
      // Normal session check (no OAuth callback or callback failed)
      const { data, error } = await supabase.auth.getSession();
      session = data.session;
      
      if (!isMounted) return;
      
      if (error) {
        console.error('[BuntingAuth] Error getting session:', error);
      }

      console.log('[BuntingAuth] Initial session check:', session?.user?.email || 'no session');

      const newState: BuntingAuthState = {
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session?.user,
      };
      
      setState(newState);
      setInitialCheckDone(true);
      
      // Call onAuthChange after initial check
      onAuthChange?.(newState);

      // Redirect to login if auth is required and no session
      if (requireAuth && !session?.user) {
        login();
      }
    };
    
    initAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requireAuth, returnUrl]); // Intentionally exclude onAuthChange to prevent re-subscription

  // Derived user info
  const displayName = state.user?.user_metadata?.full_name 
    || state.user?.user_metadata?.name 
    || state.user?.email?.split('@')[0] 
    || null;

  const email = state.user?.email || null;

  return {
    ...state,
    isLoading: state.isLoading || !initialCheckDone,
    login,
    logout,
    displayName,
    email,
  };
}
