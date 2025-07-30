
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TokenMessage {
  type: 'PROVIDE_TOKEN' | 'REQUEST_TOKEN' | 'TOKEN_RECEIVED';
  token?: string;
  origin: string;
  timestamp: number;
}

const Iframe = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
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
        let finalUrl = urlParam;
        
        // If we have source table and ID, try to get token from database
        if (id && sourceTable) {
          try {
            let fetchedToken = null;
            
            // Handle different table schemas
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
            }
            
            if (fetchedToken) {
              setToken(fetchedToken);
            }
          } catch (error) {
            console.warn('Error fetching token:', error);
          }
        }
        
        // Set URL without token parameter
        setUrl(urlParam);
      }
      
      setLoading(false);
    };
    
    loadUrlWithToken();
  }, [location]);

  // Handle iframe load and send token via postMessage
  useEffect(() => {
    const iframe = iframeRef.current;
    
    const handleIframeLoad = () => {
      if (token && iframe?.contentWindow) {
        try {
          const message: TokenMessage = {
            type: 'PROVIDE_TOKEN',
            token: token,
            origin: window.location.origin,
            timestamp: Date.now()
          };
          
          iframe.contentWindow.postMessage(message, '*');
          console.log('Token sent to iframe via postMessage');
        } catch (error) {
          console.warn('Failed to send token via postMessage:', error);
        }
      }
    };

    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      return () => iframe.removeEventListener('load', handleIframeLoad);
    }
  }, [token]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent<TokenMessage>) => {
      // Basic origin validation (could be more strict)
      if (event.data?.type === 'REQUEST_TOKEN' && token) {
        const message: TokenMessage = {
          type: 'PROVIDE_TOKEN',
          token: token,
          origin: window.location.origin,
          timestamp: Date.now()
        };
        
        (event.source as Window)?.postMessage(message, event.origin);
        console.log('Token provided in response to request');
      } else if (event.data?.type === 'TOKEN_RECEIVED') {
        console.log('Token received confirmation from iframe');
        toast({
          title: "Authentication successful",
          description: "Token has been provided to the application",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [token]);
  
  const handleBack = () => {
    navigate(-1);
  };

  const handleDirectDownload = () => {
    if (url) {
      window.open(url, '_blank');
      toast({
        title: "Download initiated",
        description: "File download should start in a new tab",
      });
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar className="w-64 flex-shrink-0" />
      
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center">
            <SidebarTrigger className="md:hidden mr-2" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </Button>
            {title && <span className="ml-2 text-sm font-medium">{title}</span>}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDirectDownload}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-1" />
            <span>Direct Download</span>
          </Button>
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
