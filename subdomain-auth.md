# Subdomain Authentication Guide

> **For:** Subdomain apps like `self.buntinggpt.com` embedded in parent `buntinggpt.com`

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  Parent App (buntinggpt.com)                                    │
│                                                                 │
│  1. User logs in → Supabase session established                 │
│  2. User opens app → navigates to /iframe?url=self.buntinggpt.com │
│  3. Iframe loads → parent sends AUTH_TOKEN message              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Subdomain App (self.buntinggpt.com) - IFRAME             │  │
│  │                                                           │  │
│  │  4. useParentAuth listens for AUTH_TOKEN                  │  │
│  │  5. Validates origin is *.buntinggpt.com                  │  │
│  │  6. Calls supabase.auth.setSession(tokens)                │  │
│  │  7. App renders authenticated content                     │  │
│  │                                                           │  │
│  │  If no token received after 2s:                           │  │
│  │  → Sends REQUEST_AUTH to parent                           │  │
│  │  → Parent responds with AUTH_TOKEN                        │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Message Protocol

### Parent → Subdomain (sent on iframe load)

```javascript
{
  type: 'AUTH_TOKEN',
  token: string,        // Supabase access_token (JWT - 3 parts, dot-separated)
  refreshToken: string, // Supabase refresh_token (OPAQUE STRING - NOT a JWT!)
  user: {
    id: string,
    email: string
  }
}
```

### Subdomain → Parent (if token not received)

```javascript
// Primary format:
{ type: 'REQUEST_AUTH' }

// Legacy format (also supported):
{ type: 'BUNTINGGPT_AUTH_REQUEST' }
```

---

## What the Subdomain App Must Implement

### File 1: `src/hooks/useParentAuth.ts`

**Purpose:** Detect iframe context, receive auth from parent, establish Supabase session.

**Key responsibilities:**
- Detect if running in iframe: `window.self !== window.top`
- Listen for `message` events on `window`
- Accept message types: `AUTH_TOKEN`, `BUNTINGGPT_AUTH_TOKEN`, `PROVIDE_TOKEN`
- Validate origin is from allowed list (see below)
- Call `supabase.auth.setSession({ access_token, refresh_token })`
- If no token received within 2 seconds, send `REQUEST_AUTH` to parent
- Timeout after 10 seconds with error state

**Returns:**
```typescript
{
  isEmbedded: boolean,    // true if running in iframe
  authReceived: boolean,  // true after successful setSession
  isLoading: boolean,     // true while waiting for auth
  error: string | null,   // error message if auth failed
  user: User | null,      // Supabase user object
  requestAuth: () => void // manually request auth from parent
}
```

### File 2: `src/integrations/supabase/client.ts`

**Purpose:** Configure Supabase client with cross-subdomain cookie storage.

**Critical configuration:**
```javascript
createClient(url, key, {
  auth: {
    storage: cookieStorage,  // NOT localStorage!
    persistSession: true,
    autoRefreshToken: true,
  }
})
```

**Cookie storage requirements:**
- Domain: `.buntinggpt.com` (leading dot required!)
- Path: `/`
- Secure: `true` (production)
- SameSite: `Lax`
- Implements 3KB chunking for large tokens

### File 3: `src/contexts/AuthContext.tsx`

**Purpose:** Wrap `useParentAuth` in React context for app-wide access.

**Provides:**
```typescript
{
  user: User | null,
  session: Session | null,
  isLoading: boolean,
  sessionChecked: boolean,
  signIn: (email, password) => Promise,
  signOut: () => Promise,
  // ... other auth methods
}
```

### File 4: `src/components/PrivateRoute.tsx`

**Purpose:** Protect routes, handle embedded vs standalone auth flow.

**Critical behavior when embedded:**
```tsx
if (isEmbedded) {
  // Still waiting for parent auth
  if (parentAuthLoading && !authReceived) {
    return <LoadingSpinner message="Authenticating with parent app..." />;
  }
  
  // Auth failed/timed out
  if (parentAuthError && !user) {
    return <ErrorMessage error={parentAuthError} />;
  }
  
  // Auth received - render children
  if (authReceived || user) {
    return <>{children}</>;
  }
}

// NEVER redirect to /auth when embedded!
```

---

## Allowed Origins

Subdomain apps must validate message origins. Accept messages from:

```javascript
const ALLOWED_ORIGINS = [
  'https://buntinggpt.com',
  'https://www.buntinggpt.com',
];

function isAllowedOrigin(origin: string): boolean {
  // Exact match
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  
  // Any *.buntinggpt.com subdomain
  if (origin.endsWith('.buntinggpt.com')) return true;
  
  // Localhost for development
  if (origin.startsWith('http://localhost:')) return true;
  
  return false;
}
```

---

## Critical Rules

### 1. Refresh Token is NOT a JWT

```javascript
// ❌ WRONG - refresh tokens are opaque strings
const parts = refreshToken.split('.');
if (parts.length !== 3) throw new Error('Invalid token');

// ✅ CORRECT - just check it exists and has length
if (!refreshToken || refreshToken.length < 20) {
  console.warn('Missing or invalid refresh token');
}
```

### 2. Never Redirect When Embedded

```javascript
// ❌ WRONG - shows login page inside iframe
if (!user) {
  return <Navigate to="/auth" />;
}

// ✅ CORRECT - show loading/error, let parent handle auth
if (isEmbedded && !user) {
  return <LoadingOrError />;
}
```

### 3. Cookie Domain Must Have Leading Dot

```javascript
// ❌ WRONG - won't share across subdomains
document.cookie = `token=xxx; domain=buntinggpt.com`;

// ✅ CORRECT - shares across all *.buntinggpt.com
document.cookie = `token=xxx; domain=.buntinggpt.com`;
```

---

## Debugging Checklist

### In Subdomain Console:

```javascript
// 1. Check if embedded
console.log('Is embedded:', window.self !== window.top);

// 2. Look for useParentAuth logs
// Should see: "[useParentAuth] Embedded mode detected"
// Should see: "[useParentAuth] Received AUTH_TOKEN from https://buntinggpt.com"

// 3. Check Supabase session
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
```

### In Parent Console:

```javascript
// Look for Iframe.tsx logs
// Should see: "[Iframe] Sent AUTH_TOKEN to https://self.buntinggpt.com"

// Check if auth token exists
const { data } = await supabase.auth.getSession();
console.log('Parent session:', data.session?.access_token ? 'EXISTS' : 'MISSING');
```

### Common Issues:

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Authenticating..." forever | Parent not sending token | Check Iframe.tsx sends AUTH_TOKEN on load |
| Origin validation fails | www vs non-www mismatch | Add both to ALLOWED_ORIGINS |
| Session doesn't persist | localStorage instead of cookies | Use cookieStorage with .buntinggpt.com domain |
| "Invalid refresh token" error | Treating refresh token as JWT | Remove JWT validation for refresh tokens |
| Redirect loop to /auth | PrivateRoute redirecting when embedded | Add isEmbedded check before redirect |

---

## Template Files Location

Copy these files from the parent app to your subdomain app:

| Source (Parent App) | Destination (Subdomain App) |
|---------------------|----------------------------|
| `docs/subdomain-auth-templates/useParentAuth.ts` | `src/hooks/useParentAuth.ts` |
| `docs/subdomain-auth-templates/AuthContext.tsx` | `src/contexts/AuthContext.tsx` |
| `docs/subdomain-auth-templates/PrivateRoute.tsx` | `src/components/PrivateRoute.tsx` |
| `src/integrations/supabase/client.ts` | `src/integrations/supabase/client.ts` |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2026 | Initial documentation |
