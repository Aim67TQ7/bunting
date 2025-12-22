import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TokenMessage {
  type: 'PROVIDE_TOKEN' | 'REQUEST_TOKEN' | 'TOKEN_RECEIVED' | 'REQUEST_PASSWORD' | 'PROVIDE_PASSWORD' | 'PROVIDE_LICENSE' | 'REQUEST_LICENSE';
  token?: string;
  password?: string;
  license?: string;
  origin: string;
  timestamp: number;
}

interface AuthMessage {
  type: 'PROVIDE_USER' | 'REQUEST_USER' | 'PROVIDE_TOKEN' | 'REQUEST_TOKEN';
  user?: {
    id: string;
    email: string;
  };
  // Standard naming (preferred)
  access_token?: string;
  refresh_token?: string;
  // Legacy naming (backward compatibility)
  token?: string;
  refreshToken?: string;
  origin: string;
  timestamp: number;
}

// Check if URL is a buntinggpt.com subdomain (needs Supabase session auth via postMessage)
const isBuntingGptSubdomain = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.endsWith('.buntinggpt.com');
  } catch {
    return false;
  }
};

// Get the origin from a URL for postMessage targeting
const getOriginFromUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.origin;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [licenseValue, setLicenseValue] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check if this is a buntinggpt subdomain - these need Supabase session auth via postMessage
  // (third-party cookies in iframes are blocked by modern browsers)
  const needsSupabaseAuth = url ? isBuntingGptSubdomain(url) : false;
  const targetOrigin = url ? getOriginFromUrl(url) : '*';

  useEffect(() => {
    const loadUrlWithToken = async () => {
      const params = new URLSearchParams(location.search);
      const urlParam = params.get("url");
      const titleParam = params.get("title");
      const id = params.get("id");
      const sourceTable = params.get("sourceTable");

      if (titleParam) {
        setTitle(titleParam);
      }

      if (urlParam) {
        // If we have source table and ID, try to get token and license from database
        if (id && sourceTable) {
          try {
            let fetchedToken = null;
            let fetchedLicense = null;

            if (sourceTable === 'reports') {
              const { data, error } = await supabase
                .from('reports')
                .select('access_token')
                .eq('id', id)
                .single();
              if (!error && data && 'access_token' in data) {
                fetchedToken = (data as any).access_token;
              }
            } else if (sourceTable === 'sales_tools') {
              const { data, error } = await supabase
                .from('sales_tools')
                .select('token')
                .eq('id', id)
                .single();
              if (!error && data && 'token' in data) {
                fetchedToken = (data as any).token;
              }
            } else if (sourceTable === 'app_items') {
              const { data, error } = await supabase
                .from('app_items')
                .select('access_token, license, auth_passcode, token')
                .eq('id', id)
                .single();
              if (!error && data) {
                // Priority: access_token > token > auth_passcode > default
                if ('access_token' in data && (data as any).access_token) {
                  fetchedToken = (data as any).access_token;
                } else if ('token' in data && (data as any).token) {
                  fetchedToken = (data as any).token;
                } else if ('auth_passcode' in data && (data as any).auth_passcode) {
                  fetchedToken = (data as any).auth_passcode;
                } else {
                  fetchedToken = "203"; // Default passcode
                }
                if ('license' in data) {
                  fetchedLicense = (data as any).license;
                }
              }
            }

            if (fetchedToken) {
              setToken(fetchedToken);
            }
            if (fetchedLicense) {
              setLicenseValue(fetchedLicense);
            }
          } catch (error) {
            console.warn('Error fetching authentication data:', error);
          }
        }

        setUrl(urlParam);
      }
      setLoading(false);
    };

    loadUrlWithToken();
  }, [location]);

  // Handle iframe load - send authentication data via postMessage
  useEffect(() => {
    const iframe = iframeRef.current;

    const handleIframeLoad = () => {
      if (!iframe?.contentWindow) return;

      try {
        // For buntinggpt.com subdomains, ALWAYS send Supabase session authentication
        // (third-party cookies in iframes are blocked by modern browsers)
        if (needsSupabaseAuth && user && session?.access_token && session?.refresh_token) {
          // Validate JWT format before sending
          const accessTokenParts = session.access_token.split('.');
          const refreshTokenParts = session.refresh_token.split('.');
          
          if (accessTokenParts.length !== 3 || refreshTokenParts.length !== 3) {
            console.error('Invalid JWT format - tokens may not be established yet');
            return;
          }

          console.log('Sending Supabase auth to buntinggpt subdomain:', targetOrigin, {
            access_token_preview: session.access_token.substring(0, 30) + '...',
            refresh_token_preview: session.refresh_token.substring(0, 30) + '...'
          });

          // Send user data
          const userMessage: AuthMessage = {
            type: 'PROVIDE_USER',
            user: {
              id: user.id,
              email: user.email || ''
            },
            origin: window.location.origin,
            timestamp: Date.now()
          };
          iframe.contentWindow.postMessage(userMessage, targetOrigin);
          console.log('User data sent to iframe');

          // Send access token and refresh token (Supabase session tokens)
          // Include BOTH standard and legacy property names for compatibility
          const tokenMessage: AuthMessage = {
            type: 'PROVIDE_TOKEN',
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            token: session.access_token,        // Legacy compatibility
            refreshToken: session.refresh_token, // Legacy compatibility
            origin: window.location.origin,
            timestamp: Date.now()
          };
          iframe.contentWindow.postMessage(tokenMessage, targetOrigin);
          console.log('Supabase tokens sent to iframe (both standard and legacy formats)');
        }

        // Send legacy tokens ONLY for non-buntinggpt apps
        // (buntinggpt subdomains use Supabase session auth above, not legacy tokens)
        if (token && !needsSupabaseAuth) {
          const legacyTokenMessage: TokenMessage = {
            type: 'PROVIDE_TOKEN',
            token: token,
            origin: window.location.origin,
            timestamp: Date.now()
          };
          iframe.contentWindow.postMessage(legacyTokenMessage, '*');
          console.log('Legacy token sent to iframe via postMessage');

          // Also send as password for auto-fill
          const passwordMessage: TokenMessage = {
            type: 'PROVIDE_PASSWORD',
            password: token,
            origin: window.location.origin,
            timestamp: Date.now()
          };
          iframe.contentWindow.postMessage(passwordMessage, '*');
        }

        // Send license if available
        if (licenseValue) {
          const licenseMessage: TokenMessage = {
            type: 'PROVIDE_LICENSE',
            license: licenseValue,
            origin: window.location.origin,
            timestamp: Date.now()
          };
          iframe.contentWindow.postMessage(licenseMessage, needsSupabaseAuth ? targetOrigin : '*');
          console.log('License sent to iframe via postMessage');
        }
      } catch (error) {
        console.warn('Failed to send data via postMessage:', error);
      }
    };

    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      return () => iframe.removeEventListener('load', handleIframeLoad);
    }
  }, [token, licenseValue, needsSupabaseAuth, user, session, targetOrigin]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // For buntinggpt subdomains, validate origin
      if (needsSupabaseAuth && !event.origin.endsWith('.buntinggpt.com')) {
        return;
      }

      const data = event.data;

      // Handle Supabase auth requests (for buntinggpt subdomains)
      if (data?.type === 'REQUEST_USER' && user) {
        const message: AuthMessage = {
          type: 'PROVIDE_USER',
          user: {
            id: user.id,
            email: user.email || ''
          },
          origin: window.location.origin,
          timestamp: Date.now()
        };
        (event.source as Window)?.postMessage(message, event.origin);
        console.log('User data provided in response to request');
      } else if (data?.type === 'REQUEST_TOKEN' && session?.access_token && session?.refresh_token) {
        // Validate JWT format before sending
        const accessTokenParts = session.access_token.split('.');
        const refreshTokenParts = session.refresh_token.split('.');
        
        if (accessTokenParts.length !== 3 || refreshTokenParts.length !== 3) {
          console.error('Invalid JWT format in response to REQUEST_TOKEN');
          return;
        }

        const message: AuthMessage = {
          type: 'PROVIDE_TOKEN',
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          token: session.access_token,        // Legacy compatibility
          refreshToken: session.refresh_token, // Legacy compatibility
          origin: window.location.origin,
          timestamp: Date.now()
        };
        (event.source as Window)?.postMessage(message, event.origin);
        console.log('Supabase tokens provided in response to request (both formats)');
      } else if (data?.type === 'REQUEST_TOKEN' && token && !needsSupabaseAuth) {
        // Legacy token request for non-buntinggpt apps
        const message: TokenMessage = {
          type: 'PROVIDE_TOKEN',
          token: token,
          origin: window.location.origin,
          timestamp: Date.now()
        };
        (event.source as Window)?.postMessage(message, event.origin);
        console.log('Legacy token provided in response to request');
      } else if (data?.type === 'REQUEST_PASSWORD' && token) {
        const message: TokenMessage = {
          type: 'PROVIDE_PASSWORD',
          password: token,
          origin: window.location.origin,
          timestamp: Date.now()
        };
        (event.source as Window)?.postMessage(message, event.origin);
        console.log('Password auto-populated with access token');
        toast({
          title: "Password auto-filled",
          description: "Access token has been provided as password"
        });
      } else if (data?.type === 'REQUEST_LICENSE' && licenseValue) {
        const message: TokenMessage = {
          type: 'PROVIDE_LICENSE',
          license: licenseValue,
          origin: window.location.origin,
          timestamp: Date.now()
        };
        (event.source as Window)?.postMessage(message, event.origin);
        console.log('License provided in response to request');
      } else if (data?.type === 'TOKEN_RECEIVED') {
        console.log('Token received confirmation from iframe');
        toast({
          title: "Authentication successful",
          description: "Token has been provided to the application"
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [token, licenseValue, user, session, needsSupabaseAuth]);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar className="w-64 flex-shrink-0" />
      
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center">
            <SidebarTrigger className="md:hidden mr-2" />
            <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </Button>
            {title && <span className="ml-2 text-sm font-medium">{title}</span>}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading...</p>
            </div>
          ) : url ? (
            <iframe
              ref={iframeRef}
              src={url}
              className="w-full h-full border-none"
              title={title || "Embedded content"}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-presentation allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
              allow="camera; microphone; geolocation; payment; usb; accelerometer; gyroscope; magnetometer; clipboard-read; clipboard-write; web-share; downloads"
              loading="lazy"
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
