
import { ChatInterface } from "@/components/chat-interface";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');
  const isMobile = useIsMobile();
  
  return (
    <div className={`flex h-screen w-full overflow-hidden safe-area-top safe-area-bottom ${isMobile ? 'safe-area-left safe-area-right' : ''}`}>
      <AppSidebar className={`${isMobile ? 'w-full fixed z-50' : 'w-64'} flex-shrink-0`} />
      
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <ChatInterface conversationId={conversationId} />
      </SidebarInset>
    </div>
  );
};

export default Index;
