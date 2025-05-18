
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { NavItem, NavSection } from "@/components/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { MessageSquare, History, Calculator, LineChart, Grid3X3, FileChartLine, Menu, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  // Use collapsible="icon" on desktop and collapsible="offcanvas" on mobile
  const collapsibleMode = isMobile ? "offcanvas" : "icon";

  return (
    <Sidebar 
      className={className} 
      variant="sidebar" 
      collapsible={collapsibleMode}
    >
      <SidebarHeader className="px-2 py-3">
        <div className="flex items-center gap-2">
          <BrandLogo size="md" />
          <div>
            <h1 className="font-semibold text-lg">BuntingGPT</h1>
            <p className="text-xs text-sidebar-foreground/60">Magnetic Solutions</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <NavSection title="Assistant">
          <NavItem icon={MessageSquare} title="Chat" href="/" />
          <NavItem icon={History} title="History" href="/history" />
        </NavSection>
        
        <NavSection title="Tools">
          <NavItem icon={Calculator} title="Calculators" href="/calculators" />
          <NavItem icon={LineChart} title="Sales" href="/sales" />
          <NavItem icon={Grid3X3} title="Apps" href="/apps" />
          <NavItem icon={FileChartLine} title="Reports" href="/reports" />
        </NavSection>
      </SidebarContent>
      
      <SidebarFooter className="mt-auto">
        <div className="mt-3 px-2">
          <div className="rounded-md bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/10">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm truncate max-w-[140px]">
                  Guest User
                </div>
                <div className="text-xs text-sidebar-foreground/70 truncate max-w-[140px]">
                  Bunting User
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Separator className="my-2" />
        
        <div className="flex justify-between items-center px-2 py-1">
          <ThemeToggle />
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9" 
            aria-label="Settings"
            onClick={handleSettingsClick}
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
