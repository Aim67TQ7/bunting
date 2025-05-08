
import { ChatInterface } from "@/components/chat-interface";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar className="w-64 flex-shrink-0" />
        
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex gap-2 items-center">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-lg font-semibold">Executive Assistant</h1>
            </div>
          </div>
          <ChatInterface />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
