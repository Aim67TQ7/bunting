import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Normalize URL - ensure it has a protocol
const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
};

// Check if URL is a buntinggpt subdomain (for auth token broadcasting)
const isBuntingGptSubdomain = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname;
    return hostname.endsWith('.buntinggpt.com');
  } catch {
    return false;
  }
};

// Get origin from URL safely
const getOriginFromUrl = (url: string): string | null => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

const Iframe = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [legacyToken, setLegacyToken] = useState<string | null>(null);
  const [licenseValue, setLicenseValue] = useState<string | null>(null);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Send AUTH_TOKEN to buntinggpt subdomain iframes
  const sendAuthToken = async () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !url) return;
    
    // Only send auth to buntinggpt subdomains
    if (!isBuntingGptSubdomain(url)) return;
    
    const iframeOrigin = getOriginFromUrl(url);
    if (!iframeOrigin) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        iframe.contentWindow.postMessage({
          type: 'AUTH_TOKEN',
          token: session.access_token
        }, iframeOrigin);
        console.log('[Iframe] Sent AUTH_TOKEN to:', iframeOrigin);
      } else {
        console.log('[Iframe] No session available for AUTH_TOKEN');
      }
    } catch (e) {
      console.warn('[Iframe] Failed to send AUTH_TOKEN:', e);
    }
  };

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

      // Fetch legacy tokens for non-buntinggpt apps
      if (id && sourceTable) {
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

  // Send legacy token/license AND AUTH_TOKEN when iframe loads
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !url) return;

    const handleLoad = async () => {
      console.log('[Iframe] Iframe loaded:', url);
      
      // Send AUTH_TOKEN for buntinggpt subdomain apps
      await sendAuthToken();
      
      // Send legacy token if available (for non-buntinggpt apps)
      if (legacyToken && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'PROVIDE_TOKEN',
          token: legacyToken
        }, '*');
        iframe.contentWindow.postMessage({
          type: 'PROVIDE_PASSWORD',
          password: legacyToken
        }, '*');
        console.log('[Iframe] Sent legacy token');
      }
      
      // Send license if available
      if (licenseValue && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'PROVIDE_LICENSE',
          license: licenseValue
        }, '*');
        console.log('[Iframe] Sent license');
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [url, legacyToken, licenseValue]);

  // Listen for legacy token/license requests AND REQUEST_AUTH from iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const data = event.data;
      if (!data?.type) return;

      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;

      // Handle REQUEST_AUTH from buntinggpt subdomain apps
      if (data.type === 'REQUEST_AUTH') {
        const iframeOrigin = getOriginFromUrl(url);
        if (iframeOrigin && event.origin.endsWith('.buntinggpt.com')) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              iframe.contentWindow.postMessage({
                type: 'AUTH_TOKEN',
                token: session.access_token
              }, event.origin);
              console.log('[Iframe] Responded to REQUEST_AUTH with AUTH_TOKEN');
            }
          } catch (e) {
            console.warn('[Iframe] Failed to respond to REQUEST_AUTH:', e);
          }
        }
        return;
      }

      // Handle legacy token requests
      if (data.type === 'REQUEST_TOKEN' && legacyToken) {
        iframe.contentWindow.postMessage({
          type: 'PROVIDE_TOKEN',
          token: legacyToken
        }, event.origin || '*');
      } else if (data.type === 'REQUEST_PASSWORD' && legacyToken) {
        iframe.contentWindow.postMessage({
          type: 'PROVIDE_PASSWORD',
          password: legacyToken
        }, event.origin || '*');
      } else if (data.type === 'REQUEST_LICENSE' && licenseValue) {
        iframe.contentWindow.postMessage({
          type: 'PROVIDE_LICENSE',
          license: licenseValue
        }, event.origin || '*');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [legacyToken, licenseValue, url]);

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
