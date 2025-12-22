import { useEffect, useRef } from "react";
import { PageLayout } from "@/components/page-layout";
import { useAuth } from "@/contexts/AuthContext";

interface AuthMessage {
  type: 'PROVIDE_USER' | 'PROVIDE_TOKEN' | 'BUNTINGGPT_AUTH_TOKEN' | 'BUNTINGGPT_AUTH_REQUEST';
  user?: {
    id: string;
    email: string;
  };
  // New format (camelCase)
  accessToken?: string;
  refreshToken?: string;
  // Standard naming (snake_case)
  access_token?: string;
  refresh_token?: string;
  // Legacy naming
  token?: string;
  origin: string;
  timestamp: number;
}

const Dashboard = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user, session } = useAuth();

  // Send auth data to iframe via postMessage
  useEffect(() => {
    const iframe = iframeRef.current;
    
    const handleIframeLoad = () => {
      if (iframe?.contentWindow && user && session?.access_token && session?.refresh_token) {
        // Validate JWT format before sending
        const accessTokenParts = session.access_token.split('.');
        const refreshTokenParts = session.refresh_token.split('.');
        
        if (accessTokenParts.length !== 3 || refreshTokenParts.length !== 3) {
          console.error('Invalid JWT format - tokens may not be established yet');
          return;
        }

        try {
          console.log('[Dashboard] Sending auth to notes.buntinggpt.com');

          // Send NEW format (BUNTINGGPT_AUTH_TOKEN) with user embedded
          const newFormatMessage: AuthMessage = {
            type: 'BUNTINGGPT_AUTH_TOKEN',
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: { id: user.id, email: user.email || '' },
            origin: window.location.origin,
            timestamp: Date.now()
          };
          iframe.contentWindow.postMessage(newFormatMessage, 'https://notes.buntinggpt.com');
          console.log('[Dashboard] Sent BUNTINGGPT_AUTH_TOKEN');

          // Send legacy PROVIDE_USER for backward compatibility
          const userMessage: AuthMessage = {
            type: 'PROVIDE_USER',
            user: { id: user.id, email: user.email || '' },
            origin: window.location.origin,
            timestamp: Date.now()
          };
          iframe.contentWindow.postMessage(userMessage, 'https://notes.buntinggpt.com');

          // Send legacy PROVIDE_TOKEN for backward compatibility
          const tokenMessage: AuthMessage = {
            type: 'PROVIDE_TOKEN',
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            token: session.access_token,
            origin: window.location.origin,
            timestamp: Date.now()
          };
          iframe.contentWindow.postMessage(tokenMessage, 'https://notes.buntinggpt.com');
          console.log('[Dashboard] Auth sent (new + legacy formats)');
        } catch (error) {
          console.warn('[Dashboard] Failed to send auth data to iframe:', error);
        }
      }
    };

    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      return () => iframe.removeEventListener('load', handleIframeLoad);
    }
  }, [user, session]);

  // Listen for auth requests from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from notes.buntinggpt.com
      if (event.origin !== 'https://notes.buntinggpt.com') return;
      
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || !user || !session) return;

      const { type } = event.data || {};

      if (type === 'REQUEST_USER') {
        const message: AuthMessage = {
          type: 'PROVIDE_USER',
          user: { id: user.id, email: user.email || '' },
          origin: window.location.origin,
          timestamp: Date.now()
        };
        iframe.contentWindow.postMessage(message, 'https://notes.buntinggpt.com');
        console.log('[Dashboard] User data provided in response to request');
      } else if ((type === 'REQUEST_TOKEN' || type === 'BUNTINGGPT_AUTH_REQUEST') && session?.access_token && session?.refresh_token) {
        // Validate JWT format before sending
        const accessTokenParts = session.access_token.split('.');
        const refreshTokenParts = session.refresh_token.split('.');
        
        if (accessTokenParts.length !== 3 || refreshTokenParts.length !== 3) {
          console.error('[Dashboard] Invalid JWT format in response to auth request');
          return;
        }

        console.log('[Dashboard] Auth request received:', type);

        // Send new format
        const newMessage: AuthMessage = {
          type: 'BUNTINGGPT_AUTH_TOKEN',
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: { id: user.id, email: user.email || '' },
          origin: window.location.origin,
          timestamp: Date.now()
        };
        iframe.contentWindow.postMessage(newMessage, 'https://notes.buntinggpt.com');

        // Send legacy format
        const legacyMessage: AuthMessage = {
          type: 'PROVIDE_TOKEN',
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          token: session.access_token,
          origin: window.location.origin,
          timestamp: Date.now()
        };
        iframe.contentWindow.postMessage(legacyMessage, 'https://notes.buntinggpt.com');
        console.log('[Dashboard] Auth provided (new + legacy formats)');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, session]);

  return (
    <PageLayout title="Dashboard">
      <iframe
        ref={iframeRef}
        src="https://notes.buntinggpt.com"
        className="w-full h-full border-0"
        title="Dashboard"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; display-capture; encrypted-media; fullscreen; geolocation; gyroscope; magnetometer; microphone; midi; payment; picture-in-picture; publickey-credentials-get; screen-wake-lock; web-share"
      />
    </PageLayout>
  );
};

export default Dashboard;
