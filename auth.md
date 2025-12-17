# Cross-Subdomain Authentication Guide

This document explains how authentication is shared between the primary BuntingGPT application (hosted on `buntinggpt.com`) and embedded iframe applications on subdomains (e.g., `notes.buntinggpt.com`, `prospector-uk.buntinggpt.com`).

## Why postMessage?

Modern browsers block third-party cookies in iframes for privacy reasons. This means embedded apps cannot directly read session cookies set by the parent domain. Instead, we use the `postMessage` API to securely pass authentication tokens from the parent app to embedded iframes.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    buntinggpt.com (Parent App)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     AuthContext.tsx                       │  │
│  │  • Manages Supabase session (access_token + refresh_token)│  │
│  │  • Uses chunked cookie storage for large JWT tokens       │  │
│  │  • Handles email/password & Microsoft OAuth               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Dashboard.tsx / Iframe.tsx                   │  │
│  │  • Detects when iframe loads                              │  │
│  │  • Sends PROVIDE_USER and PROVIDE_TOKEN via postMessage   │  │
│  │  • Listens for REQUEST_* messages from iframe             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                    postMessage()                                │
│                              │                                  │
│  ┌───────────────────────────▼──────────────────────────────┐  │
│  │                      <iframe>                             │  │
│  │              src="https://notes.buntinggpt.com"          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

                              │
                    postMessage()
                              │
                              ▼

┌─────────────────────────────────────────────────────────────────┐
│                notes.buntinggpt.com (Embedded App)              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  AuthContext.tsx                          │  │
│  │  • Detects if running in iframe                           │  │
│  │  • Listens for PROVIDE_USER and PROVIDE_TOKEN             │  │
│  │  • Calls supabase.auth.setSession() with tokens           │  │
│  │  • NEVER redirects to /auth when embedded                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    PrivateRoute.tsx                       │  │
│  │  • Detects iframe context                                 │  │
│  │  • Shows "waiting for auth" instead of redirecting        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Supabase Configuration (Shared by ALL Apps)

All apps on `*.buntinggpt.com` must use **identical** Supabase configuration:

```typescript
// src/integrations/supabase/client.ts

const SUPABASE_URL = "https://qzwxisdfwswsrbzvpzlo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGci..."; // Same anon key for all apps

// Detect production domain
const isProductionDomain = window.location.hostname.endsWith('.buntinggpt.com');

// Cookie storage for production (with chunking for large JWTs)
const cookieStorage = {
  getItem: (key) => { /* reassemble chunked cookies */ },
  setItem: (key, value) => { /* split large values into chunks */ },
  removeItem: (key) => { /* remove all chunks */ }
};

// Use localStorage for development/preview environments
const devStorage = window.localStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: isProductionDomain ? cookieStorage : devStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  }
});
```

**Critical:** The cookie domain is set to `.buntinggpt.com` which allows cookies to be shared across all subdomains. Large JWT tokens are automatically chunked into multiple cookies to avoid the 4KB browser limit.

---

## Message Types

### Messages Sent by Parent App

| Type | Payload | When Sent |
|------|---------|-----------|
| `PROVIDE_USER` | `{ user: { id, email }, origin, timestamp }` | On iframe load + on REQUEST_USER |
| `PROVIDE_TOKEN` | `{ token, refreshToken, origin, timestamp }` | On iframe load + on REQUEST_TOKEN |

### Messages Sent by Embedded Apps (Requests)

| Type | When Sent |
|------|-----------|
| `REQUEST_USER` | When app needs user data and hasn't received it |
| `REQUEST_TOKEN` | When app needs tokens and hasn't received them |

---

## Parent App Implementation

### Dashboard.tsx (for notes.buntinggpt.com)

```typescript
interface AuthMessage {
  type: 'PROVIDE_USER' | 'PROVIDE_TOKEN';
  user?: { id: string; email: string; };
  token?: string;
  refreshToken?: string;
  origin: string;
  timestamp: number;
}

// Send auth on iframe load
useEffect(() => {
  const handleIframeLoad = () => {
    if (iframe?.contentWindow && user && session) {
      // Send user info
      iframe.contentWindow.postMessage({
        type: 'PROVIDE_USER',
        user: { id: user.id, email: user.email || '' },
        origin: window.location.origin,
        timestamp: Date.now()
      }, 'https://notes.buntinggpt.com');

      // Send tokens (BOTH access_token AND refresh_token required!)
      iframe.contentWindow.postMessage({
        type: 'PROVIDE_TOKEN',
        token: session.access_token,
        refreshToken: session.refresh_token,
        origin: window.location.origin,
        timestamp: Date.now()
      }, 'https://notes.buntinggpt.com');
    }
  };
  
  iframe.addEventListener('load', handleIframeLoad);
}, [user, session]);

// Listen for requests from iframe
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== 'https://notes.buntinggpt.com') return;
    
    if (event.data?.type === 'REQUEST_USER') {
      // Respond with user data
    } else if (event.data?.type === 'REQUEST_TOKEN') {
      // Respond with tokens
    }
  };
  
  window.addEventListener('message', handleMessage);
}, [user, session]);
```

### Iframe.tsx (Generic for any subdomain)

The `Iframe.tsx` component handles any `*.buntinggpt.com` subdomain by detecting the URL:

```typescript
const isBuntingGptSubdomain = (url: string): boolean => {
  const parsedUrl = new URL(url);
  return parsedUrl.hostname.endsWith('.buntinggpt.com');
};

const needsSupabaseAuth = url ? isBuntingGptSubdomain(url) : false;
const targetOrigin = url ? getOriginFromUrl(url) : '*';

// In handleIframeLoad, check needsSupabaseAuth before sending postMessage
```

---

## Embedded App Implementation (Template)

### AuthContext.tsx for Embedded Apps

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: any;
  session: any;
  isLoading: boolean;
  isEmbedded: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isEmbedded: false,
});

// Detect if running inside an iframe
const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [receivedPostMessageAuth, setReceivedPostMessageAuth] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authTimeout: NodeJS.Timeout | null = null;

    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[Embedded Auth] State change:', event);
        if (!mounted) return;
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }
      }
    );

    // Listen for postMessage auth from parent
    const handleMessage = async (event: MessageEvent) => {
      // Only accept messages from parent buntinggpt.com domain
      if (!event.origin.endsWith('.buntinggpt.com') && 
          event.origin !== 'https://buntinggpt.com') {
        return;
      }

      console.log('[Embedded Auth] Received message:', event.data?.type);

      if (event.data?.type === 'PROVIDE_USER') {
        console.log('[Embedded Auth] Received user:', event.data.user?.email);
      }

      if (event.data?.type === 'PROVIDE_TOKEN' && 
          event.data.token && 
          event.data.refreshToken) {
        console.log('[Embedded Auth] Received tokens, establishing session...');
        
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: event.data.token,
            refresh_token: event.data.refreshToken
          });

          if (error) {
            console.error('[Embedded Auth] setSession error:', error);
          } else if (data.session) {
            console.log('[Embedded Auth] Session established for:', data.session.user?.email);
            setReceivedPostMessageAuth(true);
            
            // Clear timeout since we got auth
            if (authTimeout) {
              clearTimeout(authTimeout);
              authTimeout = null;
            }
          }
        } catch (err) {
          console.error('[Embedded Auth] Failed to set session:', err);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // If embedded, request auth from parent after a short delay
    if (isEmbedded) {
      console.log('[Embedded Auth] Running in iframe, requesting auth from parent');
      
      // Request auth immediately
      window.parent.postMessage({ type: 'REQUEST_USER' }, '*');
      window.parent.postMessage({ type: 'REQUEST_TOKEN' }, '*');
      
      // Set timeout for fallback check
      authTimeout = setTimeout(() => {
        if (mounted && isLoading && !receivedPostMessageAuth) {
          console.log('[Embedded Auth] Timeout waiting for postMessage auth');
          // Check if we have an existing session
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              setSession(session);
              setUser(session.user);
            }
            setIsLoading(false);
          });
        }
      }, 5000);
    } else {
      // Not embedded - normal session check
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      });
    }

    return () => {
      mounted = false;
      if (authTimeout) clearTimeout(authTimeout);
      subscription.unsubscribe();
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isEmbedded }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### PrivateRoute.tsx for Embedded Apps

```typescript
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, isLoading, isEmbedded } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        {isEmbedded && (
          <p className="ml-3 text-sm text-muted-foreground">
            Waiting for authentication from parent app...
          </p>
        )}
      </div>
    );
  }

  // CRITICAL: Never redirect to /auth when embedded in iframe!
  // This would show a login page inside the iframe, which is confusing UX
  if (!user) {
    if (isEmbedded) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
          <p className="text-sm text-muted-foreground text-center">
            Please log in to the main BuntingGPT application to access this content.
          </p>
        </div>
      );
    }
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
```

---

## Security Considerations

1. **Origin Validation**: Always validate `event.origin` before processing postMessage data
2. **Target Origin**: Always specify the exact target origin (never use `*` for sensitive data)
3. **Token Expiry**: Tokens expire; the embedded app should handle token refresh via `supabase.auth.onAuthStateChange`
4. **HTTPS Required**: All communication must be over HTTPS
5. **Cookie Domain**: Cookies use `domain=.buntinggpt.com` for cross-subdomain sharing
6. **Chunked Cookies**: Large JWT tokens are split into multiple cookies to avoid browser 4KB limits

---

## Troubleshooting

### "Session expired" or "Invalid Refresh Token" errors
- **Cause**: Large JWT tokens exceeding 4KB cookie limit
- **Solution**: Ensure chunked cookie storage is implemented in `client.ts`
- **Action**: User should sign out and sign back in to create properly chunked cookies

### Embedded app shows login page
- **Cause**: `PrivateRoute` is redirecting to `/auth` when embedded
- **Solution**: Check `isEmbedded` flag and show "waiting for auth" message instead

### Tokens not received in iframe
- **Cause**: Parent app not sending `refreshToken` alongside `token`
- **Solution**: Ensure both `session.access_token` AND `session.refresh_token` are sent in `PROVIDE_TOKEN` message

### Auth works on localhost but not production
- **Cause**: Different storage strategies (localStorage vs cookies)
- **Solution**: Verify `isProductionDomain` detection is correct

---

## Checklist for New Embedded Apps

- [ ] Copy `src/integrations/supabase/client.ts` exactly from parent app (same URL, key, storage config)
- [ ] Implement AuthContext with postMessage listener (see template above)
- [ ] Implement PrivateRoute with iframe detection
- [ ] Never redirect to /auth when `isEmbedded === true`
- [ ] Request auth from parent on mount: `window.parent.postMessage({ type: 'REQUEST_TOKEN' }, '*')`
- [ ] Test with both email/password and Microsoft OAuth login flows
- [ ] Verify refresh token is being sent and session refreshes work
- [ ] Test after signing out and back in to ensure cookie chunking works
