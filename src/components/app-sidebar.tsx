
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { NavItem, NavSection } from "@/components/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { MessageSquare, History, Calculator, LineChart, Grid3X3, FileChartLine, Menu, User, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppSidebarProps {
  className?: string;
}

interface UserProfile {
  first_name?: string;
  call_name?: string;
  avatar_url?: string;
  jobTitle?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const isMobile = useIsMobile();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        // Fetch profile data
        const { data: profileData } = await supabase
          .from("profiles")
          .select("first_name, call_name, avatar_url")
          .eq("id", user.id)
          .single();

        // Fetch employee data
        const { data: employeeData } = await supabase
          .from("Employee_id")
          .select("jobTitle")
          .eq("user_id", user.id)
          .single();

        setUserProfile({
          first_name: profileData?.first_name,
          call_name: profileData?.call_name,
          avatar_url: profileData?.avatar_url,
          jobTitle: employeeData?.jobTitle
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

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
        
        <div className="mt-3">
          <div className="rounded-md bg-sidebar-accent/50 p-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userProfile.avatar_url || ""} alt={userProfile.first_name || user?.email || ""} />
                <AvatarFallback>
                  {userProfile.first_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm truncate max-w-[140px]">
                  {userProfile.first_name || user?.email?.split("@")[0] || "User"}
                </div>
                <div className="text-xs text-sidebar-foreground/70 truncate max-w-[140px]">
                  {userProfile.jobTitle || "Bunting User"}
                </div>
              </div>
            </div>
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
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9" 
            aria-label="Log out"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
