# Cross-Subdomain Authentication System
## For *.buntinggpt.com Applications

---

## 🚀 Subdomain Quick Start

**Goal:** Your subdomain app (e.g., `notes.buntinggpt.com`) receives authentication automatically when loaded in an iframe on `buntinggpt.com`.

### Step 1: Copy These 4 Files

Copy these files from the parent app to your subdomain app:

| Source (Parent App) | Destination (Your App) |
|---------------------|------------------------|
| `src/integrations/supabase/client.ts` | `src/integrations/supabase/client.ts` |
| `docs/subdomain-auth-templates/useParentAuth.ts` | `src/hooks/useParentAuth.ts` |
| `docs/subdomain-auth-templates/AuthContext.tsx` | `src/contexts/AuthContext.tsx` |
| `docs/subdomain-auth-templates/PrivateRoute.tsx` | `src/components/PrivateRoute.tsx` |

### Step 2: Wrap Your App

```tsx
// src/App.tsx or src/main.tsx
import { AuthProvider } from '@/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your app content */}
    </AuthProvider>
  );
}
```

### Step 3: Protect Routes

```tsx
import { PrivateRoute } from '@/components/PrivateRoute';

// In your router
<Route path="/dashboard" element={
  <PrivateRoute>
    <Dashboard />
  </PrivateRoute>
} />
```

### Step 4: Test

1. Load your app in the parent iframe at `buntinggpt.com`
2. Open browser console
3. Look for: `[useParentAuth] Auth received from parent ✓`
4. Verify no redirect to `/auth` page

---

## Message Protocol Reference

### Parent → Subdomain

The parent sends this message when the iframe loads:

```typescript
{
  type: 'AUTH_TOKEN',
  token: string,        // Supabase access_token (JWT)
  refreshToken: string, // Supabase refresh_token (OPAQUE string, NOT JWT)
  user: { 
    id: string, 
    email: string 
  }
}
```

### Subdomain → Parent

Your app can request auth if not received:

```typescript
window.parent.postMessage({ type: 'REQUEST_AUTH' }, '*');
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                 buntinggpt.com (PARENT)                     │
│                                                             │
│  User logs in → Supabase session created                   │
│                                                             │
│  When iframe loads:                                         │
│    → Parent sends AUTH_TOKEN via postMessage               │
│    → Also responds to REQUEST_AUTH messages                │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ <iframe src="https://notes.buntinggpt.com" />         │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
              postMessage (AUTH_TOKEN)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              notes.buntinggpt.com (SUBDOMAIN)               │
│                                                             │
│  useParentAuth hook:                                        │
│    → Detects iframe context                                 │
│    → Listens for AUTH_TOKEN message                        │
│    → Calls supabase.auth.setSession()                      │
│    → User is now authenticated with RLS credentials        │
│                                                             │
│  PrivateRoute:                                              │
│    → Shows "Waiting for auth..." (never redirects)         │
│    → Renders content once authenticated                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Template Files

### 1. Supabase Client (`src/integrations/supabase/client.ts`)

This file configures cookie-based storage for cross-subdomain session sharing:

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qzwxisdfwswsrbzvpzlo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "your-anon-key-here";

// Detect production domain
function isProductionHost(hostname: string): boolean {
  return hostname === 'buntinggpt.com' || 
         hostname.endsWith('.buntinggpt.com');
}

const isProductionDomain = 
  typeof window !== 'undefined' && 
  isProductionHost(window.location.hostname);

// Cookie chunk size (3KB is safe margin below 4KB browser limit)
const COOKIE_CHUNK_SIZE = 3000;

// Custom cookie storage that splits large JWTs across multiple cookies
const cookieStorage = {
  getItem: (key: string): string | null => {
    try {
      const cookies = document.cookie.split('; ');
      const chunks: { index: number; value: string }[] = [];
      
      for (const cookie of cookies) {
        const [cookieKey, ...valueParts] = cookie.split('=');
        const cookieValue = valueParts.join('=');
        
        if (cookieKey.startsWith(`${key}_chunk_`)) {
          const indexStr = cookieKey.substring(`${key}_chunk_`.length);
          const index = parseInt(indexStr, 10);
          if (!isNaN(index)) {
            chunks.push({ index, value: decodeURIComponent(cookieValue) });
          }
        }
      }
      
      if (chunks.length === 0) return null;
      chunks.sort((a, b) => a.index - b.index);
      return chunks.map(c => c.value).join('') || null;
    } catch (e) {
      console.error('Cookie read error:', e);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    try {
      cookieStorage.removeItem(key);
      
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += COOKIE_CHUNK_SIZE) {
        chunks.push(value.substring(i, i + COOKIE_CHUNK_SIZE));
      }
      
      const maxAge = 60 * 60 * 24 * 7; // 7 days
      
      chunks.forEach((chunk, index) => {
        const chunkKey = `${key}_chunk_${index}`;
        const encodedChunk = encodeURIComponent(chunk);
        // CRITICAL: domain=.buntinggpt.com for cross-subdomain sharing
        document.cookie = `${chunkKey}=${encodedChunk}; path=/; domain=.buntinggpt.com; max-age=${maxAge}; SameSite=Lax; Secure`;
      });
    } catch (e) {
      console.error('Cookie write error:', e);
    }
  },
  
  removeItem: (key: string): void => {
    try {
      const cookies = document.cookie.split('; ');
      for (const cookie of cookies) {
        const [cookieKey] = cookie.split('=');
        if (cookieKey.startsWith(`${key}_chunk_`)) {
          document.cookie = `${cookieKey}=; path=/; domain=.buntinggpt.com; max-age=0`;
        }
      }
    } catch (e) {
      console.error('Cookie remove error:', e);
    }
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: isProductionDomain ? cookieStorage : window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  }
});
```

### 2. useParentAuth Hook (`src/hooks/useParentAuth.ts`)

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// Only accept messages from buntinggpt.com domains
const isAllowedOrigin = (origin: string): boolean => {
  return origin === 'https://buntinggpt.com' || 
         origin === 'https://www.buntinggpt.com' ||
         origin.endsWith('.buntinggpt.com') ||
         origin.includes('localhost');
};

interface ParentAuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isEmbedded: boolean;
  authReceived: boolean;
  error: string | null;
  requestAuth: () => void;
}

export const useParentAuth = (): ParentAuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authReceived, setAuthReceived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;

  const requestAuth = useCallback(() => {
    if (isEmbedded && window.parent) {
      console.log('[useParentAuth] Requesting auth from parent...');
      window.parent.postMessage({ type: 'REQUEST_AUTH' }, '*');
    }
  }, [isEmbedded]);

  const handleMessage = useCallback(async (event: MessageEvent) => {
    if (!isAllowedOrigin(event.origin)) {
      return;
    }

    const data = event.data;
    if (!data || typeof data !== 'object') return;

    // Handle AUTH_TOKEN (primary), BUNTINGGPT_AUTH_TOKEN, and PROVIDE_TOKEN (legacy)
    if (data.type === 'AUTH_TOKEN' || 
        data.type === 'BUNTINGGPT_AUTH_TOKEN' || 
        data.type === 'PROVIDE_TOKEN') {
      
      // Support multiple token field names
      const accessToken = data.token || data.accessToken || data.access_token;
      const refreshToken = data.refreshToken || data.refresh_token;

      if (!accessToken || !refreshToken) {
        console.error('[useParentAuth] Missing tokens in message');
        return;
      }

      // Validate access token is a JWT (3 parts)
      if (accessToken.split('.').length !== 3) {
        console.error('[useParentAuth] Invalid access token format');
        return;
      }

      // Validate refresh token exists and has length (it's OPAQUE, not JWT!)
      if (refreshToken.length < 20) {
        console.error('[useParentAuth] Refresh token appears truncated');
        return;
      }

      console.log('[useParentAuth] Auth received from parent ✓');
      
      try {
        const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (setSessionError) {
          console.error('[useParentAuth] setSession error:', setSessionError);
          setError(setSessionError.message);
          setIsLoading(false);
          return;
        }

        if (sessionData.session) {
          setSession(sessionData.session);
          setUser(sessionData.session.user);
          setAuthReceived(true);
          setError(null);
          setIsLoading(false);
          
          console.log('[useParentAuth] Session established for:', sessionData.session.user.email);
        }
      } catch (err) {
        console.error('[useParentAuth] Error setting session:', err);
        setError('Failed to establish session');
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);

    if (isEmbedded) {
      console.log('[useParentAuth] Running in iframe, waiting for parent auth...');
      
      // Request auth immediately
      requestAuth();
      
      // Retry every 2 seconds
      const retryInterval = setInterval(() => {
        if (!authReceived) {
          requestAuth();
        }
      }, 2000);

      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        if (!authReceived) {
          console.error('[useParentAuth] Auth timeout after 10s');
          setError('Authentication timeout - no response from parent app');
          setIsLoading(false);
        }
      }, 10000);

      return () => {
        clearInterval(retryInterval);
        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
      };
    } else {
      // Not embedded - use normal Supabase auth
      console.log('[useParentAuth] Standalone mode, using Supabase auth');
      
      supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
          setAuthReceived(true);
        }
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setAuthReceived(!!newSession);
      });

      return () => {
        subscription.unsubscribe();
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [handleMessage, isEmbedded, authReceived, requestAuth]);

  return { user, session, isLoading, isEmbedded, authReceived, error, requestAuth };
};
```

### 3. AuthContext (`src/contexts/AuthContext.tsx`)

```typescript
import { createContext, useContext, ReactNode } from 'react';
import { useParentAuth } from '@/hooks/useParentAuth';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isEmbedded: boolean;
  authReceived: boolean;
  error: string | null;
  requestAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useParentAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 4. PrivateRoute (`src/components/PrivateRoute.tsx`)

```typescript
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, isLoading, isEmbedded, error } = useAuth();

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isEmbedded ? 'Waiting for authentication from parent app...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error if embedded and auth failed
  if (error && isEmbedded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-destructive">
          <p className="font-medium">Authentication Error</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <p className="text-xs text-muted-foreground mt-4">
            Please ensure you're accessing this app from buntinggpt.com
          </p>
        </div>
      </div>
    );
  }

  // No user - handle based on context
  if (!user) {
    // CRITICAL: Never redirect to /auth when embedded!
    if (isEmbedded) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">
            Authentication required. Please access from parent app.
          </p>
        </div>
      );
    }
    // Standalone mode - redirect to auth
    return <Navigate to="/auth" replace />;
  }

  // Authenticated - render children
  return <>{children}</>;
};
```

---

## Critical Rules

### 1. Refresh Token is NOT a JWT

```typescript
// ❌ WRONG - This breaks authentication!
if (refreshToken.split('.').length !== 3) {
  return; // Blocks valid auth!
}

// ✅ CORRECT - Just check it exists and has length
if (refreshToken.length < 20) {
  console.error('Refresh token truncated');
}
```

### 2. Never Redirect When Embedded

```typescript
// ❌ WRONG
if (!user) {
  return <Navigate to="/auth" />;
}

// ✅ CORRECT
if (!user) {
  if (isEmbedded) {
    return <div>Waiting for auth from parent...</div>;
  }
  return <Navigate to="/auth" />;
}
```

### 3. Cookie Domain Must Include Leading Dot

```typescript
// ❌ WRONG
document.cookie = `${key}=${value}; domain=buntinggpt.com`;

// ✅ CORRECT
document.cookie = `${key}=${value}; domain=.buntinggpt.com`;
```

---

## Troubleshooting

### "Authentication timeout - no response from parent app"

**Cause:** Parent is not sending `AUTH_TOKEN` messages.

**Check:**
1. Open parent app console, look for auth message logs
2. Verify iframe src is a `*.buntinggpt.com` domain
3. Check parent's `Iframe.tsx` has the `sendAuthToken` logic

### "Auth received but session not persisted"

**Cause:** Cookie storage not working.

**Check:**
1. Verify `isProductionDomain` returns `true` on your subdomain
2. Check browser dev tools → Application → Cookies for `_chunk_` entries
3. Verify cookie domain is `.buntinggpt.com`

### Console shows `[useParentAuth] Missing tokens in message`

**Cause:** Parent sent message without tokens.

**Check:**
1. Parent must include `token` (access_token) and `refreshToken` fields
2. Verify parent has an active Supabase session

### Works on localhost but not production

**Cause:** Different storage backends.

**Fix:**
1. localhost uses `localStorage` (no cookies needed)
2. Production uses `cookieStorage` with `.buntinggpt.com` domain
3. Ensure `isProductionHost()` returns correct value

---

## Debugging Script

Run this in your subdomain app's browser console:

```javascript
console.log('=== SUBDOMAIN AUTH DEBUG ===');
console.log('Hostname:', window.location.hostname);
console.log('Is embedded:', window.self !== window.top);
console.log('');

// Check cookies
const cookies = document.cookie;
console.log('Has auth cookies:', cookies.includes('_chunk_'));
console.log('');

// Check Supabase session
if (typeof supabase !== 'undefined') {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      console.log('✓ Session exists');
      console.log('  User:', session.user.email);
      console.log('  Access token length:', session.access_token.length);
      console.log('  Refresh token length:', session.refresh_token.length);
    } else {
      console.log('✗ No session');
    }
  });
}
```

---

**Version:** 4.0  
**Last Updated:** January 2026  
**Changes:** Simplified quick start guide, updated message protocol to AUTH_TOKEN, added complete template files
