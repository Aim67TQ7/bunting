import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";

const Dashboard = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar />
      
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <iframe
          src="https://dashboard.buntinggpt.com"
          className="w-full h-full border-0"
          title="Dashboard"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; display-capture; encrypted-media; fullscreen; geolocation; gyroscope; magnetometer; microphone; midi; payment; picture-in-picture; publickey-credentials-get; screen-wake-lock; web-share"
        />
      </SidebarInset>
    </div>
  );
};

export default Dashboard;