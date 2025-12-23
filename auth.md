# Cross-Subdomain Authentication System
## Strategic Reference Guide for *.buntinggpt.com Applications

---

## Executive Summary

**Purpose:** Enable seamless authentication across parent domain (buntinggpt.com) and subdomain applications (*.buntinggpt.com) loaded in iframes, maintaining Row Level Security (RLS) credentials throughout.

**Architecture:** Shared Supabase authentication context using postMessage API for iframe communication, cookie-based persistence with chunking for large JWTs, and automatic token refresh propagation.

**Critical Success Factors:**
- Explicit cookie domain (`.buntinggpt.com`) for cross-subdomain sharing
- Cookie chunking pattern: `{key}_chunk_0`, `{key}_chunk_1`, etc.
- Token refresh events propagated to all active iframes
- RLS credentials validated end-to-end in embedded contexts

**Failure Modes Without This System:**
- Third-party cookie blocking breaks iframe auth
- Token expiry after ~1 hour causes silent RLS failures
- Large JWTs (>4KB) exceed cookie limits and corrupt sessions
- Mismatched chunking patterns cause truncated tokens

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                buntinggpt.com (PARENT DOMAIN)                   │
│                                                                 │
│  [AuthContext] ──► Manages Supabase session + token refresh    │
│       │                                                          │
│       ├──► On iframe load: Send PROVIDE_USER + PROVIDE_TOKEN    │
│       ├──► On token refresh: Re-send tokens to all iframes      │
│       └──► On REQUEST_*: Respond with current credentials       │
│                                                                 │
│  [Dashboard/Iframe] ──► postMessage() to subdomain              │
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
│  [AuthContext] ──► Listens for postMessage from parent         │
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

### 2.1 Parent AuthContext

**File:** `src/contexts/AuthContext.tsx` (Parent App)

The parent AuthContext manages Supabase auth and logs token diagnostics:

```typescript
// In onAuthStateChange callback, log token diagnostics:
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
```

### 2.2 Iframe Component (Parent App)

**File:** `src/pages/Iframe.tsx`

Key responsibilities:
- Detects buntinggpt.com subdomains via `isBuntingGptSubdomain()`
- Sends both new format (`BUNTINGGPT_AUTH_TOKEN`) and legacy formats (`PROVIDE_USER`, `PROVIDE_TOKEN`)
- Validates access_token is a JWT (3 parts) but NOT refresh_token (it's opaque)
- Responds to `REQUEST_TOKEN` and `REQUEST_USER` messages from iframe

**Message Types Sent:**

```typescript
// New consolidated format
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

---

## Part 3: Subdomain App Implementation

### 3.1 Embedded App AuthContext

For subdomain apps, implement postMessage listener:

```typescript
// Detect if running inside an iframe
const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;

// Listen for auth from parent
const handleMessage = async (event: MessageEvent) => {
  // Only accept from buntinggpt.com domains
  if (!event.origin.endsWith('.buntinggpt.com') && 
      event.origin !== 'https://buntinggpt.com') {
    return;
  }

  if (event.data?.type === 'BUNTINGGPT_AUTH_TOKEN' && 
      event.data.accessToken && 
      event.data.refreshToken) {
    
    const { data, error } = await supabase.auth.setSession({
      access_token: event.data.accessToken,
      refresh_token: event.data.refreshToken
    });

    if (!error && data.session) {
      // Validate RLS context
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === data.session.user.id) {
        console.log('[Embedded Auth] RLS context validated ✓');
      }
    }
  }
};

window.addEventListener('message', handleMessage);

// Request auth from parent
if (isEmbedded) {
  window.parent.postMessage({ type: 'REQUEST_TOKEN' }, '*');
  window.parent.postMessage({ type: 'REQUEST_USER' }, '*');
}
```

### 3.2 Embedded App PrivateRoute

**Critical:** Never redirect to `/auth` when embedded:

```typescript
const { user, isLoading, isEmbedded } = useAuth();

if (!user) {
  if (isEmbedded) {
    // Show message instead of redirect
    return <div>Authentication required from parent app</div>;
  }
  return <Navigate to="/auth" />;
}
```

---

## Part 4: Token Requirements

### Expected Token Lengths

| Token | Expected Length | Format |
|-------|-----------------|--------|
| access_token | 800-1500 chars | JWT (3 dot-separated parts) |
| refresh_token | 100+ chars | **Opaque string** (NOT a JWT!) |

**Critical:** The refresh_token is NOT a JWT. Do not validate it as having 3 parts. It's an opaque string that Supabase uses internally.

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
- [ ] Target origin: Never use '*' when sending tokens
- [ ] HTTPS only: All domains use HTTPS
- [ ] Cookie domain: Explicitly set to `.buntinggpt.com`
- [ ] No redirect in iframe: PrivateRoute checks isEmbedded
- [ ] Token validation: Access token is JWT (3 parts), refresh token is opaque

---

## Quick Start for New Subdomain Apps

1. **Copy exact Supabase config** from parent app (`client.ts`) - including cookieStorage
2. **Implement AuthContext** with postMessage listener
3. **Implement PrivateRoute** with iframe detection
4. **Sign out and back in** on parent to recreate cookies with new chunking pattern
5. **Test** with validation script in both parent and iframe
6. **Verify** RLS queries work with authenticated user

---

## Common Issues & Fixes

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

---

**Version:** 2.1 (December 2024)  
**Last Updated:** Fixed cookie chunking pattern to use `_chunk_N` suffix consistently
