# Cross-Subdomain Authentication System
## Strategic Reference Guide for *.buntinggpt.com Applications

---

## Executive Summary

**Purpose:** Enable seamless authentication across parent domain (buntinggpt.com) and subdomain applications (*.buntinggpt.com) loaded in iframes, maintaining Row Level Security (RLS) credentials throughout.

**Architecture:** Shared Supabase authentication context using postMessage API for iframe communication, cookie-based persistence with chunking for large JWTs, and automatic token refresh propagation.

**Critical Success Factors:**
- Explicit cookie domain (`.buntinggpt.com`) for cross-subdomain sharing
- Cookie chunking pattern: `{key}_chunk_0`, `{key}_chunk_1`, etc.
- Token refresh events propagated to all active iframes via iframe registry
- RLS credentials validated end-to-end in embedded contexts
- **Refresh tokens are OPAQUE strings, NOT JWTs** - never validate as 3 dot-separated parts!

**Failure Modes Without This System:**
- Third-party cookie blocking breaks iframe auth
- Token expiry after ~1 hour causes silent RLS failures
- Large JWTs (>4KB) exceed cookie limits and corrupt sessions
- Mismatched chunking patterns cause truncated tokens
- **Incorrect refresh token validation blocks valid auth silently**

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                buntinggpt.com (PARENT DOMAIN)                   │
│                                                                 │
│  [AuthContext] ──► Manages Supabase session + token refresh     │
│       │            ──► Maintains iframe registry for propagation│
│       │                                                          │
│       ├──► On iframe load: Send BUNTINGGPT_AUTH_TOKEN           │
│       ├──► On token refresh: Re-send tokens to all iframes     │
│       └──► On REQUEST_*: Respond with current credentials       │
│                                                                 │
│  [Dashboard/Iframe.tsx] ──► postMessage() to subdomain          │
│       │                     ──► Registers with iframe registry  │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ <iframe src="https://notes.buntinggpt.com" />            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    postMessage (validated origin)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              notes.buntinggpt.com (SUBDOMAIN APP)               │
│                                                                 │
│  [useParentAuth Hook] ──► Listens for postMessage from parent  │
│       │                                                          │
│       ├──► Receives tokens ──► supabase.auth.setSession()      │
│       ├──► Validates RLS context ──► auth.uid() populated      │
│       └──► Never redirects to /auth when isEmbedded=true       │
│                                                                 │
│  [PrivateRoute] ──► Shows "waiting for auth" in iframe         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Shared Supabase Client Configuration

**File:** `src/integrations/supabase/client.ts`  
**Used By:** ALL apps (parent + all subdomains must use **identical** config)

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qzwxisdfwswsrbzvpzlo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGci..."; // Your anon key

// Detect production domain
const isProductionDomain = 
  typeof window !== 'undefined' && 
  window.location.hostname.endsWith('.buntinggpt.com');

// Cookie chunk size (3KB is safe margin below 4KB browser limit)
const COOKIE_CHUNK_SIZE = 3000;

// Custom cookie storage that splits large values across multiple cookies
// Uses pattern: {key}_chunk_0, {key}_chunk_1, etc.
const cookieStorage = {
  getItem: (key: string): string | null => {
    try {
      const cookies = document.cookie.split('; ');
      const chunks: { index: number; value: string }[] = [];
      
      // Find all chunks for this key (pattern: key_chunk_N)
      for (const cookie of cookies) {
        const [cookieKey, ...valueParts] = cookie.split('=');
        const cookieValue = valueParts.join('='); // Handle values with = in them
        
        // Match pattern: key_chunk_0, key_chunk_1, etc.
        if (cookieKey.startsWith(`${key}_chunk_`)) {
          const indexStr = cookieKey.substring(`${key}_chunk_`.length);
          const index = parseInt(indexStr, 10);
          if (!isNaN(index)) {
            chunks.push({ index, value: decodeURIComponent(cookieValue) });
          }
        }
      }
      
      if (chunks.length === 0) return null;
      
      // CRITICAL: Sort by index before joining
      chunks.sort((a, b) => a.index - b.index);
      return chunks.map(c => c.value).join('') || null;
    } catch (e) {
      console.error('Cookie read error:', e);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    try {
      // Clear existing chunks first
      cookieStorage.removeItem(key);
      
      // Split into 3KB chunks
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += COOKIE_CHUNK_SIZE) {
        chunks.push(value.substring(i, i + COOKIE_CHUNK_SIZE));
      }
      
      const maxAge = 60 * 60 * 24 * 7; // 7 days
      
      chunks.forEach((chunk, index) => {
        const chunkKey = `${key}_chunk_${index}`;
        const encodedChunk = encodeURIComponent(chunk);
        
        // CRITICAL: domain=.buntinggpt.com (with leading dot) for cross-subdomain sharing
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

// Use localStorage for development (localhost, preview URLs)
const devStorage = typeof window !== 'undefined' ? window.localStorage : undefined;

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

**Critical Notes:**
- Cookie domain MUST be `.buntinggpt.com` (with leading dot) for subdomain sharing
- 3KB chunk size prevents 4KB browser cookie limit issues
- Chunk pattern: `{key}_chunk_0`, `{key}_chunk_1`, etc.
- Chunks MUST be sorted by index on reassembly
- Development uses localStorage (cookies don't work on localhost)

---

## Part 2: Parent Domain Implementation

### 2.1 Parent AuthContext with Iframe Registry

**File:** `src/contexts/AuthContext.tsx` (Parent App)

The parent AuthContext manages Supabase auth, logs token diagnostics, and maintains an iframe registry for token propagation:

```typescript
// Iframe registry for token propagation
const activeIframes = new Map<string, { iframe: HTMLIFrameElement; origin: string }>();

const registerIframe = (id: string, iframe: HTMLIFrameElement, origin: string) => {
  activeIframes.set(id, { iframe, origin });
};

const unregisterIframe = (id: string) => {
  activeIframes.delete(id);
};

// Propagate tokens to all registered iframes
const propagateTokensToIframes = (session: Session) => {
  activeIframes.forEach(({ iframe, origin }, id) => {
    if (iframe.contentWindow) {
      const message = {
        type: 'BUNTINGGPT_AUTH_TOKEN',
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: { id: session.user.id, email: session.user.email || '' },
        origin: window.location.origin,
        timestamp: Date.now()
      };
      iframe.contentWindow.postMessage(message, origin);
      console.log(`[AuthContext] Propagated tokens to iframe: ${id}`);
    }
  });
};

// In onAuthStateChange callback:
if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
  if (currentSession) {
    propagateTokensToIframes(currentSession);
    
    // Log token diagnostics
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
}
```

### 2.2 Dashboard/Iframe Component (Parent App)

**File:** `src/pages/Dashboard.tsx` or `src/pages/Iframe.tsx`

Key responsibilities:
- Registers with iframe registry on mount, unregisters on unmount
- Detects buntinggpt.com subdomains via `isBuntingGptSubdomain()`
- Sends both new format (`BUNTINGGPT_AUTH_TOKEN`) and legacy formats
- **Validates access_token is a JWT (3 parts) but NOT refresh_token (it's OPAQUE!)**
- Responds to `REQUEST_TOKEN` and `REQUEST_USER` messages from iframe

**⚠️ CRITICAL: Token Validation Pattern**

```typescript
// ✅ CORRECT - Only validate access_token as JWT
const accessTokenParts = session.access_token.split('.');
if (accessTokenParts.length !== 3) {
  console.error('Invalid access_token JWT format');
  return;
}

// ✅ CORRECT - Refresh token is OPAQUE, just check length
if (session.refresh_token.length < 20) {
  console.error('Refresh token appears truncated');
  return;
}

// ❌ WRONG - This blocks valid auth!
// const refreshTokenParts = session.refresh_token.split('.');
// if (refreshTokenParts.length !== 3) { ... } // NEVER DO THIS!
```

**Message Types Sent:**

```typescript
// Primary consolidated format
{
  type: 'BUNTINGGPT_AUTH_TOKEN',
  accessToken: session.access_token,
  refreshToken: session.refresh_token,
  access_token: session.access_token,  // snake_case for compatibility
  refresh_token: session.refresh_token,
  user: { id: user.id, email: user.email },
  origin: window.location.origin,
  timestamp: Date.now()
}

// Legacy formats for backward compatibility
{ type: 'PROVIDE_USER', user: { id, email }, origin, timestamp }
{ type: 'PROVIDE_TOKEN', access_token, refresh_token, token, origin, timestamp }
```

**Iframe Registration Pattern:**

```typescript
const IFRAME_URL = "https://notes.buntinggpt.com";

const Dashboard = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user, session, registerIframe, unregisterIframe } = useAuth();

  // Register iframe for token refresh propagation
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && registerIframe && unregisterIframe) {
      registerIframe('dashboard-notes', iframe, IFRAME_URL);
      return () => unregisterIframe('dashboard-notes');
    }
  }, [registerIframe, unregisterIframe]);

  // ... rest of component
};
```

---

## Part 3: Subdomain App Implementation

### 3.1 useParentAuth Hook

**File:** `src/hooks/useParentAuth.ts` (Subdomain App)

This hook handles all authentication for embedded subdomain apps:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'https://buntinggpt.com',
  'https://www.buntinggpt.com',
];

const isAllowedOrigin = (origin: string): boolean => {
  return ALLOWED_ORIGINS.includes(origin) || 
         origin.endsWith('.buntinggpt.com') ||
         origin.includes('localhost');
};

export const useParentAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;

  const handleMessage = useCallback(async (event: MessageEvent) => {
    // Security: Only accept from allowed origins
    if (!isAllowedOrigin(event.origin)) {
      console.log('[useParentAuth] Rejected message from:', event.origin);
      return;
    }

    const { type, accessToken, refreshToken, access_token, refresh_token } = event.data || {};
    
    // Support both camelCase and snake_case
    const finalAccessToken = accessToken || access_token;
    const finalRefreshToken = refreshToken || refresh_token;

    if ((type === 'BUNTINGGPT_AUTH_TOKEN' || type === 'PROVIDE_TOKEN') && 
        finalAccessToken && finalRefreshToken) {
      
      console.log('[useParentAuth] Received auth from parent');
      
      try {
        const { data, error: setSessionError } = await supabase.auth.setSession({
          access_token: finalAccessToken,
          refresh_token: finalRefreshToken
        });

        if (setSessionError) {
          console.error('[useParentAuth] setSession error:', setSessionError);
          setError(setSessionError.message);
          return;
        }

        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setIsLoading(false);
          
          // Validate RLS context
          const { data: { user: rlsUser } } = await supabase.auth.getUser();
          if (rlsUser?.id === data.session.user.id) {
            console.log('[useParentAuth] RLS context validated ✓');
          }
        }
      } catch (err) {
        console.error('[useParentAuth] Error setting session:', err);
        setError('Failed to establish session');
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);

    // If embedded, request auth from parent
    if (isEmbedded) {
      console.log('[useParentAuth] Embedded mode - requesting auth from parent');
      window.parent.postMessage({ type: 'BUNTINGGPT_AUTH_REQUEST' }, '*');
      window.parent.postMessage({ type: 'REQUEST_TOKEN' }, '*');
      
      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        if (!session) {
          setError('Auth timeout - no response from parent');
          setIsLoading(false);
        }
      }, 10000);

      return () => {
        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
      };
    } else {
      // Not embedded - use normal Supabase auth flow
      supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
        }
        setIsLoading(false);
      });
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage, isEmbedded, session]);

  return { user, session, isLoading, isEmbedded, error };
};
```

### 3.2 Embedded App AuthContext

**File:** `src/contexts/AuthContext.tsx` (Subdomain App)

Wrap useParentAuth in a context for app-wide access:

```typescript
import { createContext, useContext, ReactNode } from 'react';
import { useParentAuth } from '@/hooks/useParentAuth';

const AuthContext = createContext<ReturnType<typeof useParentAuth> | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useParentAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 3.3 Embedded App PrivateRoute

**File:** `src/components/PrivateRoute.tsx` (Subdomain App)

**Critical:** Never redirect to `/auth` when embedded:

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isEmbedded, error } = useAuth();

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

  if (error && isEmbedded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-destructive">
          <p>Authentication error: {error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please ensure you're accessing this app from the parent domain.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    // CRITICAL: Never redirect when embedded - show message instead
    if (isEmbedded) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Authentication required from parent app</p>
        </div>
      );
    }
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
```

---

## Part 4: Token Requirements

### Expected Token Formats

| Token | Expected Length | Format | Validation |
|-------|-----------------|--------|------------|
| access_token | 800-1500 chars | JWT (3 dot-separated parts) | `token.split('.').length === 3` |
| refresh_token | 80-150 chars | **OPAQUE string** | `token.length > 20` |

### ⚠️ CRITICAL WARNING

The **refresh_token is NOT a JWT**. It is an opaque string that Supabase uses internally.

**NEVER validate refresh_token as having 3 dot-separated parts!**

```typescript
// ❌ WRONG - This breaks authentication silently!
const refreshTokenParts = session.refresh_token.split('.');
if (refreshTokenParts.length !== 3) {
  console.error('Invalid refresh token'); // Blocks valid auth!
  return;
}

// ✅ CORRECT - Just verify it exists and has length
if (!session.refresh_token || session.refresh_token.length < 20) {
  console.error('Refresh token missing or truncated');
  return;
}
```

If refresh_token is < 20 characters, cookies are corrupted!

---

## Part 5: Validation & Debugging

### 5.1 Console Validation Script

Run in browser console on both parent and embedded apps:

```javascript
console.log('\n=== AUTH VALIDATION ===\n');

// 1. Cookie presence
console.log('1. COOKIES:');
const allCookies = document.cookie;
console.log('  Has auth chunks:', allCookies.includes('_chunk_'));
console.log('  Chunk pattern matches:', allCookies.includes('sb-') && allCookies.includes('_chunk_'));

// 2. Supabase session
console.log('\n2. SUPABASE SESSION:');
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (session) {
    console.log('  User:', session.user.email);
    console.log('  Access token length:', session.access_token.length);
    console.log('  Access token is JWT:', session.access_token.split('.').length === 3);
    console.log('  Refresh token length:', session.refresh_token.length);
    console.log('  Refresh token valid:', session.refresh_token.length > 20);
    console.log('  Expires:', new Date(session.expires_at * 1000));
  } else {
    console.log('  No session', error);
  }
});

// 3. Environment
console.log('\n3. ENVIRONMENT:');
console.log('  Hostname:', window.location.hostname);
console.log('  Is production:', window.location.hostname.endsWith('.buntinggpt.com'));
console.log('  Is embedded:', window.self !== window.top);
```

### 5.2 Troubleshooting Decision Tree

```
Auth failing in iframe?
│
├─ Auth messages not being sent?
│  ├─ Check: Console for "[Dashboard] Invalid access_token" errors
│  ├─ Check: Was refresh_token incorrectly validated as JWT?
│  ├─ Fix: Only validate access_token.split('.').length === 3
│  └─ Fix: Validate refresh_token.length > 20 (NOT as JWT!)
│
├─ Refresh token only 12 chars?
│  ├─ Check: Cookie chunking pattern matches (key_chunk_0, key_chunk_1...)
│  ├─ Fix: Use documented cookieStorage implementation
│  └─ Fix: Sign out and back in to recreate cookies with new pattern
│
├─ Session set but not persisted?
│  ├─ Check: supabase.auth.getSession() after setSession()
│  ├─ Fix: Verify cookie domain is ".buntinggpt.com" (with leading dot)
│  └─ Fix: Check no duplicate/conflicting cookie storage implementations
│
├─ RLS queries fail after auth?
│  ├─ Check: supabase.auth.getUser() returns user
│  ├─ Fix: Verify refresh_token is valid (not truncated)
│  └─ Fix: Check JWT has "role: authenticated" claim
│
└─ Works on localhost but not production?
   ├─ Fix: Ensure HTTPS (cookies require Secure flag)
   └─ Fix: Check isProductionDomain detection
```

---

## Part 6: Security Checklist

- [ ] Origin validation: All postMessage handlers check event.origin
- [ ] Target origin: Never use '*' when sending tokens (use explicit origin)
- [ ] HTTPS only: All domains use HTTPS
- [ ] Cookie domain: Explicitly set to `.buntinggpt.com`
- [ ] No redirect in iframe: PrivateRoute checks isEmbedded
- [ ] Token validation: Access token is JWT (3 parts), **refresh token is OPAQUE**

---

## Quick Start Checklist for New Subdomain Apps

### Required Files

1. **`src/integrations/supabase/client.ts`**
   - Copy exact config from parent app
   - Verify same Supabase project URL and anon key
   - Include identical cookieStorage implementation

2. **`src/hooks/useParentAuth.ts`**
   - Implement as shown in Part 3.1
   - Configure ALLOWED_ORIGINS for your domains

3. **`src/contexts/AuthContext.tsx`**
   - Wrap useParentAuth in context provider
   - Export useAuth hook

4. **`src/components/PrivateRoute.tsx`**
   - Detect isEmbedded state
   - Show waiting message instead of redirect when embedded
   - Handle error states gracefully

### Testing Steps

1. **Parent App Test:**
   - Open browser console on parent domain
   - Navigate to page with embedded iframe
   - Look for: `[Dashboard] Sending auth to...` logs
   - Verify no errors about "Invalid JWT format"

2. **Subdomain App Test:**
   - Open embedded app in iframe
   - Look for: `[useParentAuth] Received auth from parent` logs
   - Look for: `[useParentAuth] RLS context validated ✓`
   - Verify no redirect to /auth page

3. **End-to-End Test:**
   - Run validation script in both windows
   - Confirm session exists in both contexts
   - Test RLS-protected data queries in subdomain

---

## Common Issues & Fixes

### Issue: Auth silently fails to send (no errors, but iframe doesn't receive auth)

**Cause:** Refresh token incorrectly validated as JWT (expecting 3 dot-separated parts)

**Fix:** 
1. In Dashboard.tsx/Iframe.tsx, change validation:
```typescript
// Remove this line:
// if (refreshTokenParts.length !== 3) { return; }

// Replace with:
if (session.refresh_token.length < 20) {
  console.error('Refresh token appears truncated');
  return;
}
```

### Issue: Refresh token is only 12 characters

**Cause:** Old cookie chunking pattern (`_chunks` + `_0`) vs new pattern (`_chunk_0`)

**Fix:** 
1. Update `client.ts` to use `_chunk_N` pattern (no separate chunks counter)
2. Sign out completely on parent domain
3. Clear all cookies for `.buntinggpt.com`
4. Sign back in to create cookies with new pattern

### Issue: "Session was set but not persisted to client"

**Cause:** Cookie storage corruption during read/write

**Fix:** Verify chunks are sorted by index before joining in `getItem()`

### Issue: Works on localhost, fails in production

**Cause:** Different storage (localStorage vs cookies)

**Fix:** Ensure `isProductionDomain` detection works correctly

### Issue: Token refresh not reaching embedded apps

**Cause:** Iframe not registered with AuthContext iframe registry

**Fix:**
1. Import `registerIframe`/`unregisterIframe` from useAuth
2. Call `registerIframe()` on mount with iframe ref and target origin
3. Call `unregisterIframe()` on cleanup

---

**Version:** 3.0 (January 2026)  
**Last Updated:** Fixed critical refresh token validation bug, added useParentAuth hook documentation, added iframe registry pattern, expanded troubleshooting
