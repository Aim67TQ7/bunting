
import { ChatInterface } from "@/components/chat-interface";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useSearchParams } from "react-router-dom";

const Index = () => {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');
  
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar className="w-64 flex-shrink-0" />
      
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <ChatInterface />
      </SidebarInset>
    </div>
  );
};

export default Index;
