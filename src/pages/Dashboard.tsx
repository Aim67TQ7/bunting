import { useEffect, useRef } from "react";
import { PageLayout } from "@/components/page-layout";
import { useAuth } from "@/contexts/AuthContext";

interface AuthMessage {
  type: 'PROVIDE_USER' | 'PROVIDE_TOKEN';
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
          console.log('Sending auth to notes.buntinggpt.com:', {
            access_token_preview: session.access_token.substring(0, 30) + '...',
            refresh_token_preview: session.refresh_token.substring(0, 30) + '...'
          });

          // Send user info
          const userMessage: AuthMessage = {
            type: 'PROVIDE_USER',
            user: {
              id: user.id,
              email: user.email || ''
            },
            origin: window.location.origin,
            timestamp: Date.now()
          };
          iframe.contentWindow.postMessage(userMessage, 'https://notes.buntinggpt.com');
          console.log('User data sent to iframe via postMessage');

          // Send access token and refresh token (both standard and legacy formats)
          const tokenMessage: AuthMessage = {
            type: 'PROVIDE_TOKEN',
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            token: session.access_token,        // Legacy compatibility
            refreshToken: session.refresh_token, // Legacy compatibility
            origin: window.location.origin,
            timestamp: Date.now()
          };
          iframe.contentWindow.postMessage(tokenMessage, 'https://notes.buntinggpt.com');
          console.log('Tokens sent to iframe (both standard and legacy formats)');
        } catch (error) {
          console.warn('Failed to send auth data to iframe:', error);
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

      if (event.data?.type === 'REQUEST_USER') {
        const message: AuthMessage = {
          type: 'PROVIDE_USER',
          user: {
            id: user.id,
            email: user.email || ''
          },
          origin: window.location.origin,
          timestamp: Date.now()
        };
        iframe.contentWindow.postMessage(message, 'https://notes.buntinggpt.com');
        console.log('User data provided in response to request');
      } else if (event.data?.type === 'REQUEST_TOKEN' && session?.access_token && session?.refresh_token) {
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
        iframe.contentWindow.postMessage(message, 'https://notes.buntinggpt.com');
        console.log('Tokens provided in response to request (both formats)');
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
