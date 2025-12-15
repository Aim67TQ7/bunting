import { useEffect, useRef } from "react";
import { PageLayout } from "@/components/page-layout";
import { useAuth } from "@/contexts/AuthContext";

interface AuthMessage {
  type: 'PROVIDE_USER' | 'PROVIDE_TOKEN';
  user?: {
    id: string;
    email: string;
  };
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
      if (iframe?.contentWindow && user && session) {
        try {
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

          // Send access token and refresh token
          const tokenMessage: AuthMessage = {
            type: 'PROVIDE_TOKEN',
            token: session.access_token,
            refreshToken: session.refresh_token,
            origin: window.location.origin,
            timestamp: Date.now()
          };
          iframe.contentWindow.postMessage(tokenMessage, 'https://notes.buntinggpt.com');
          console.log('Access token and refresh token sent to iframe via postMessage');
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
      } else if (event.data?.type === 'REQUEST_TOKEN') {
        const message: AuthMessage = {
          type: 'PROVIDE_TOKEN',
          token: session.access_token,
          refreshToken: session.refresh_token,
          origin: window.location.origin,
          timestamp: Date.now()
        };
        iframe.contentWindow.postMessage(message, 'https://notes.buntinggpt.com');
        console.log('Token and refresh token provided in response to request');
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
