import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  showMobileHeader?: boolean;
}

export function PageLayout({ 
  children, 
  className, 
  title = "BuntingGPT",
  showMobileHeader = true 
}: PageLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen w-full overflow-hidden safe-area-top safe-area-bottom">
      <AppSidebar />
      
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        {isMobile && showMobileHeader && (
          <div className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur safe-area-top">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent/50" />
              <h1 className="text-lg font-semibold">{title}</h1>
            </div>
          </div>
        )}
        
        <main className={cn("flex-1 overflow-auto", className)}>
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}