import { useRef } from "react";
import { PageLayout } from "@/components/page-layout";

const IFRAME_URL = "https://notes.buntinggpt.com";

const Dashboard = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auth is now handled centrally by AuthContext.broadcastAuth()
  // which sends AUTH_TOKEN to ALL iframes on load and auth state changes

  return (
    <PageLayout title="Dashboard">
      <iframe
        ref={iframeRef}
        src={IFRAME_URL}
        className="w-full h-full border-0"
        title="Dashboard"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; display-capture; encrypted-media; fullscreen; geolocation; gyroscope; magnetometer; microphone; midi; payment; picture-in-picture; publickey-credentials-get; screen-wake-lock; web-share"
      />
    </PageLayout>
  );
};

export default Dashboard;
