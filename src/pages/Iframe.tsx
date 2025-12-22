import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Message types for legacy token/license apps
interface LegacyMessage {
  type: 'PROVIDE_TOKEN' | 'PROVIDE_PASSWORD' | 'PROVIDE_LICENSE' | 'REQUEST_TOKEN' | 'REQUEST_PASSWORD' | 'REQUEST_LICENSE' | 'TOKEN_RECEIVED';
  token?: string;
  password?: string;
  license?: string;
  origin: string;
  timestamp: number;
}

// Message types for Supabase session auth (buntinggpt subdomains)
interface SupabaseAuthMessage {
  type: 'PROVIDE_USER' | 'REQUEST_USER' | 'PROVIDE_TOKEN' | 'REQUEST_TOKEN' | 
        'BUNTINGGPT_AUTH_TOKEN' | 'BUNTINGGPT_AUTH_REQUEST';
  user?: { id: string; email: string };
  access_token?: string;
  refresh_token?: string;
  accessToken?: string;  // camelCase for new format
  refreshToken?: string; // camelCase for new format
  token?: string;        // Legacy compatibility
  origin: string;
  timestamp: number;
}

// Check if URL is a buntinggpt.com subdomain
const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  // If protocol is missing (common when stored in DB), default to https
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
};

const isBuntingGptSubdomain = (url: string): boolean => {
  try {
    return new URL(normalizeUrl(url)).hostname.endsWith('.buntinggpt.com');
  } catch {
    return false;
  }
};

const getOriginFromUrl = (url: string): string => {
  try {
    return new URL(normalizeUrl(url)).origin;
  } catch {
    return '*';
  }
};

const Iframe = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  
  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [legacyToken, setLegacyToken] = useState<string | null>(null);
  const [licenseValue, setLicenseValue] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [authSent, setAuthSent] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const needsSupabaseAuth = url ? isBuntingGptSubdomain(url) : false;
  const targetOrigin = url ? getOriginFromUrl(url) : '*';

  // Send Supabase auth to iframe
  const sendSupabaseAuth = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !user || !session?.access_token || !session?.refresh_token) {
      console.log('[Iframe] Cannot send auth - missing:', {
        iframe: !!iframe?.contentWindow,
        user: !!user,
        accessToken: !!session?.access_token,
        refreshToken: !!session?.refresh_token
      });
      return false;
    }

    // Only validate access_token as JWT (3 parts) - refresh_token is OPAQUE, not a JWT!
    if (session.access_token.split('.').length !== 3) {
      console.warn('[Iframe] Invalid access_token JWT format');
      return false;
    }

    // Log token lengths for debugging (never log actual values)
    console.log('[Iframe] Auth token diagnostics:', {
      accessTokenLength: session.access_token.length,
      accessTokenParts: session.access_token.split('.').length,
      refreshTokenLength: session.refresh_token.length,
      // Refresh tokens are opaque strings, not JWTs - don't validate as JWT
      refreshTokenIsString: typeof session.refresh_token === 'string',
      targetOrigin
    });

    // Verify refresh token looks valid (should be substantial, not truncated)
    if (session.refresh_token.length < 20) {
      console.error('[Iframe] CRITICAL: Refresh token appears truncated!', {
        length: session.refresh_token.length,
        expected: '100+ characters'
      });
      return false;
    }

    console.log('[Iframe] Sending Supabase auth to:', targetOrigin);

    // Send NEW format (BUNTINGGPT_AUTH_TOKEN) with user embedded
    const newFormatMessage: SupabaseAuthMessage = {
      type: 'BUNTINGGPT_AUTH_TOKEN',
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: { id: user.id, email: user.email || '' },
      origin: window.location.origin,
      timestamp: Date.now()
    };
    iframe.contentWindow.postMessage(newFormatMessage, targetOrigin);
    console.log('[Iframe] Sent BUNTINGGPT_AUTH_TOKEN');

    // Send legacy PROVIDE_USER for backward compatibility
    const userMessage: SupabaseAuthMessage = {
      type: 'PROVIDE_USER',
      user: { id: user.id, email: user.email || '' },
      origin: window.location.origin,
      timestamp: Date.now()
    };
    iframe.contentWindow.postMessage(userMessage, targetOrigin);

    // Send legacy PROVIDE_TOKEN for backward compatibility
    const tokenMessage: SupabaseAuthMessage = {
      type: 'PROVIDE_TOKEN',
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      token: session.access_token,
      origin: window.location.origin,
      timestamp: Date.now()
    };
    iframe.contentWindow.postMessage(tokenMessage, targetOrigin);
    
    console.log('[Iframe] Supabase auth sent successfully (new + legacy formats)');
    return true;
  }, [user, session, targetOrigin]);

  // Send legacy token/password to iframe
  const sendLegacyAuth = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !legacyToken) return false;

    console.log('[Iframe] Sending legacy token');

    const tokenMessage: LegacyMessage = {
      type: 'PROVIDE_TOKEN',
      token: legacyToken,
      origin: window.location.origin,
      timestamp: Date.now()
    };
    iframe.contentWindow.postMessage(tokenMessage, '*');

    const passwordMessage: LegacyMessage = {
      type: 'PROVIDE_PASSWORD',
      password: legacyToken,
      origin: window.location.origin,
      timestamp: Date.now()
    };
    iframe.contentWindow.postMessage(passwordMessage, '*');

    return true;
  }, [legacyToken]);

  // Send license to iframe
  const sendLicense = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !licenseValue) return false;

    console.log('[Iframe] Sending license');
    const licenseMessage: LegacyMessage = {
      type: 'PROVIDE_LICENSE',
      license: licenseValue,
      origin: window.location.origin,
      timestamp: Date.now()
    };
    iframe.contentWindow.postMessage(licenseMessage, needsSupabaseAuth ? targetOrigin : '*');
    return true;
  }, [licenseValue, needsSupabaseAuth, targetOrigin]);

  // Load URL and fetch legacy tokens from database
  useEffect(() => {
    const loadUrlData = async () => {
      const params = new URLSearchParams(location.search);
      const urlParam = params.get("url");
      const titleParam = params.get("title");
      const id = params.get("id");
      const sourceTable = params.get("sourceTable");

      if (titleParam) setTitle(titleParam);
      if (!urlParam) return;

      const normalizedUrl = normalizeUrl(urlParam);
      setUrl(normalizedUrl);

      // Only fetch legacy tokens for non-buntinggpt apps
      if (id && sourceTable && !isBuntingGptSubdomain(normalizedUrl)) {
        try {
          let fetchedToken = null;
          let fetchedLicense = null;

          if (sourceTable === 'reports') {
            const { data } = await supabase
              .from('reports')
              .select('access_token')
              .eq('id', id)
              .single();
            fetchedToken = data?.access_token;
          } else if (sourceTable === 'sales_tools') {
            const { data } = await supabase
              .from('sales_tools')
              .select('token')
              .eq('id', id)
              .single();
            fetchedToken = data?.token;
          } else if (sourceTable === 'app_items') {
            const { data } = await supabase
              .from('app_items')
              .select('access_token, license, auth_passcode, token')
              .eq('id', id)
              .single();
            if (data) {
              fetchedToken = data.access_token || data.token || data.auth_passcode || "203";
              fetchedLicense = data.license;
            }
          }

          if (fetchedToken) setLegacyToken(fetchedToken);
          if (fetchedLicense) setLicenseValue(fetchedLicense);
        } catch (error) {
          console.warn('[Iframe] Error fetching auth data:', error);
        }
      }
    };

    loadUrlData();
  }, [location]);

  // Handle iframe load event
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      console.log('[Iframe] Iframe loaded:', url);
      setIframeLoaded(true);
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [url]);

  // Send auth when iframe is loaded AND session/tokens are ready
  useEffect(() => {
    if (!iframeLoaded || authSent) return;

    let sent = false;

    if (needsSupabaseAuth) {
      // For buntinggpt subdomains, send Supabase session
      if (session?.access_token && session?.refresh_token) {
        sent = sendSupabaseAuth();
      } else {
        console.log('[Iframe] Waiting for Supabase session...');
      }
    } else {
      // For other apps, send legacy token if available
      if (legacyToken) {
        sent = sendLegacyAuth();
      }
    }

    // Always try to send license
    if (licenseValue) {
      sendLicense();
    }

    if (sent) {
      setAuthSent(true);
    }
  }, [iframeLoaded, authSent, needsSupabaseAuth, session, legacyToken, licenseValue, sendSupabaseAuth, sendLegacyAuth, sendLicense]);

  // Retry sending Supabase auth when session becomes available after iframe load
  useEffect(() => {
    if (!iframeLoaded || authSent || !needsSupabaseAuth) return;
    if (!session?.access_token || !session?.refresh_token) return;

    console.log('[Iframe] Session now available, sending auth');
    if (sendSupabaseAuth()) {
      setAuthSent(true);
    }
  }, [session, iframeLoaded, authSent, needsSupabaseAuth, sendSupabaseAuth]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin for buntinggpt subdomains
      if (needsSupabaseAuth && !event.origin.endsWith('.buntinggpt.com')) {
        return;
      }

      const data = event.data;
      if (!data?.type) return;

      console.log('[Iframe] Received message:', data.type);

      if (data.type === 'REQUEST_USER' && user) {
        const message: SupabaseAuthMessage = {
          type: 'PROVIDE_USER',
          user: { id: user.id, email: user.email || '' },
          origin: window.location.origin,
          timestamp: Date.now()
        };
        (event.source as Window)?.postMessage(message, event.origin);
      } else if (data.type === 'REQUEST_TOKEN' || data.type === 'BUNTINGGPT_AUTH_REQUEST') {
        console.log('[Iframe] Auth request received:', data.type);
        if (needsSupabaseAuth && session?.access_token && session?.refresh_token) {
          // Send new format
          const newMessage: SupabaseAuthMessage = {
            type: 'BUNTINGGPT_AUTH_TOKEN',
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: { id: user?.id || '', email: user?.email || '' },
            origin: window.location.origin,
            timestamp: Date.now()
          };
          (event.source as Window)?.postMessage(newMessage, event.origin);
          
          // Send legacy format
          const legacyMessage: SupabaseAuthMessage = {
            type: 'PROVIDE_TOKEN',
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            token: session.access_token,
            origin: window.location.origin,
            timestamp: Date.now()
          };
          (event.source as Window)?.postMessage(legacyMessage, event.origin);
        } else if (!needsSupabaseAuth && legacyToken) {
          const message: LegacyMessage = {
            type: 'PROVIDE_TOKEN',
            token: legacyToken,
            origin: window.location.origin,
            timestamp: Date.now()
          };
          (event.source as Window)?.postMessage(message, event.origin);
        }
      } else if (data.type === 'REQUEST_PASSWORD' && legacyToken) {
        const message: LegacyMessage = {
          type: 'PROVIDE_PASSWORD',
          password: legacyToken,
          origin: window.location.origin,
          timestamp: Date.now()
        };
        (event.source as Window)?.postMessage(message, event.origin);
      } else if (data.type === 'REQUEST_LICENSE' && licenseValue) {
        const message: LegacyMessage = {
          type: 'PROVIDE_LICENSE',
          license: licenseValue,
          origin: window.location.origin,
          timestamp: Date.now()
        };
        (event.source as Window)?.postMessage(message, event.origin);
      } else if (data.type === 'TOKEN_RECEIVED') {
        console.log('[Iframe] Token received by iframe');
        toast({
          title: "Authentication successful",
          description: "Token has been provided to the application"
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [needsSupabaseAuth, user, session, legacyToken, licenseValue]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar className="w-64 flex-shrink-0" />
      
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center">
            <SidebarTrigger className="md:hidden mr-2" />
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </Button>
            {title && <span className="ml-2 text-sm font-medium">{title}</span>}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {url ? (
            <iframe
              ref={iframeRef}
              src={url}
              className="w-full h-full border-none"
              title={title || "Embedded content"}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-presentation allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
              allow="camera; microphone; geolocation; payment; usb; accelerometer; gyroscope; magnetometer; clipboard-read; clipboard-write; web-share; downloads"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>No URL provided</p>
            </div>
          )}
        </div>
      </SidebarInset>
    </div>
  );
};

export default Iframe;
