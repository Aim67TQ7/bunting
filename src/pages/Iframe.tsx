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

const Iframe = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [legacyToken, setLegacyToken] = useState<string | null>(null);
  const [licenseValue, setLicenseValue] = useState<string | null>(null);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // Send legacy token/license when iframe loads (for non-buntinggpt apps)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !url) return;

    const handleLoad = () => {
      console.log('[Iframe] Iframe loaded:', url);
      
      // Send legacy token if available
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

  // Listen for legacy token/license requests from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data?.type) return;

      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;

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
  }, [legacyToken, licenseValue]);

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
