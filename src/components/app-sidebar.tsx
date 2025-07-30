
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { NavItem, NavSection } from "@/components/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { MessageSquare, History, Calculator, LineChart, Grid3X3, FileChartLine, Menu, User, LogOut, BarChart3 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/components/ui/sidebar";

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const { state, open } = useSidebar();

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const handleSignOutClick = async () => {
    await signOut();
    navigate("/auth");
  };

  // Extract email username for display
  const userDisplayName = user?.email 
    ? user.email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
    : "Guest User";

  // Get initials for avatar
  const userInitials = userDisplayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  // Use collapsible="icon" on desktop and collapsible="offcanvas" on mobile  
  const collapsibleMode = isMobile ? "offcanvas" : "icon";
  const isCollapsed = !isMobile && (!open || state === "collapsed");

  return (
    <Sidebar 
      className={className} 
      variant="sidebar" 
      collapsible={collapsibleMode}
    >
      <SidebarHeader className={cn(
        "transition-all duration-200 border-b bg-background/95 backdrop-blur",
        isMobile ? "px-4 py-3" : "px-3 py-4"
      )}>
        <div className={cn(
          "flex items-center transition-all duration-200",
          isMobile ? "gap-3" : "gap-2"
        )}>
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <BrandLogo size="sm" />
          </div>
          <div className={cn(
            "flex-1 transition-opacity duration-200",
            isCollapsed ? "opacity-0" : "opacity-100"
          )}>
            <h1 className="font-semibold text-base">BuntingGPT</h1>
            <p className="text-xs text-muted-foreground">Magnetic Solutions</p>
          </div>
          {!isMobile && (
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent/50" />
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className={cn(
        "transition-all duration-200",
        isMobile ? "px-4 py-2" : "px-3 py-4"
      )}>
        <NavSection title="Assistant">
          <NavItem icon={BarChart3} title="Dashboard" href="/" />
          <NavItem icon={MessageSquare} title="Chat" href="/chat" />
          <NavItem icon={History} title="History" href="/history" />
        </NavSection>
        
        <NavSection title="Tools">
          <NavItem icon={Calculator} title="Calculators" href="/calculators" />
          <NavItem icon={LineChart} title="Sales" href="/sales" />
          <NavItem icon={Grid3X3} title="Apps" href="/apps" />
          <NavItem icon={FileChartLine} title="Reports" href="/reports" />
        </NavSection>
      </SidebarContent>
      
      <SidebarFooter className="mt-auto border-t bg-background/95 backdrop-blur">
        <div className={cn(
          "transition-all duration-200",
          isMobile ? "p-4" : "p-3"
        )}>
          {/* User Profile Card */}
          <div className="mb-3">
            <div className={cn(
              "rounded-xl bg-card border shadow-sm p-3 transition-all duration-200",
              isCollapsed ? "flex justify-center" : ""
            )}>
              {isCollapsed ? (
                <Avatar className="h-8 w-8 border-2 border-primary/10">
                  <AvatarFallback className="text-xs">{userInitials || "U"}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-primary/10">
                    <AvatarFallback>{userInitials || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {userDisplayName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user?.email || "Bunting User"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Cards */}
          <div className={cn(
            "flex gap-2",
            isCollapsed ? "flex-col items-center" : "justify-between"
          )}>
            <div className="p-2 rounded-lg bg-card border shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
              <ThemeToggle />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-lg bg-card border shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]" 
                aria-label="Settings"
                onClick={handleSettingsClick}
              >
                <User className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-lg bg-card border shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]" 
                aria-label="Sign out"
                onClick={handleSignOutClick}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
