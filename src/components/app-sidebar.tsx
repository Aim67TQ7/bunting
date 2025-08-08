
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { NavItem, NavSection } from "@/components/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserGuideButton } from "@/components/user-guide/UserGuideButton";
import { MessageSquare, History, Calculator, LineChart, Grid3X3, FileChartLine, Menu, User, LogOut, BarChart3 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/use-favorites";

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const { state, open } = useSidebar();
  const [profile, setProfile] = useState<any>(null);
  const { favorites } = useFavorites();
  const [favItems, setFavItems] = useState<any[]>([]);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
    };

    fetchProfile();
  }, [user?.id]);

// Fetch favorited items details for sidebar display
useEffect(() => {
  const loadFavs = async () => {
    if (!favorites || favorites.length === 0) {
      setFavItems([]);
      return;
    }
    const { data, error } = await (supabase as any)
      .from('app_items')
      .select('id,name,url,category')
      .in('id', favorites)
      .eq('is_active', true);
    if (error) {
      console.error('Error fetching favorite items', error);
      setFavItems([]);
      return;
    }
    setFavItems(data || []);
  };
  loadFavs();
}, [favorites]);

// Realtime subscribe to profile avatar updates for the current user
useEffect(() => {
  if (!user?.id) return;
  const channel = supabase
    .channel('profiles-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${user.id}`,
    }, (payload: any) => {
      // Prefer NEW row when available
      const next = (payload.new ?? payload.old);
      if (next) setProfile((prev: any) => ({ ...prev, ...next }));
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id]);

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const handleSignOutClick = async () => {
    await signOut();
    navigate("/auth");
  };

  // Extract email username for display, but prefer profile first_name or call_name
  const userDisplayName = profile?.first_name || profile?.call_name || 
    (user?.email 
      ? user.email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
      : "Guest User");

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
          <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent/50" />
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

        {/* Tools first */}
        <NavSection title="Tools">
          <NavItem icon={Calculator} title="Calculators" href="/calculators" />
          <NavItem icon={LineChart} title="Sales" href="/sales" />
          <NavItem icon={Grid3X3} title="Apps" href="/apps" />
          <NavItem icon={FileChartLine} title="Reports" href="/reports" />
        </NavSection>

        {/* Favorites under Tools */}
        {favItems.length > 0 && (
          <NavSection title="Favorites">
            {favItems.map((it) => {
              const href = it.url?.startsWith('/iframe')
                ? it.url
                : `/iframe?${new URLSearchParams({ url: it.url, title: it.name, id: it.id, sourceTable: 'app_items' }).toString()}`;
              const Icon = it.category === 'calculator' ? Calculator : Grid3X3;
              return (
                <NavItem key={it.id} icon={Icon} title={it.name} href={href} />
              );
            })}
          </NavSection>
        )}
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
                  <AvatarImage src={profile?.avatar_url || ""} alt={userDisplayName} />
                  <AvatarFallback className="text-xs">{userInitials || "U"}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-primary/10">
                    <AvatarImage src={profile?.avatar_url || ""} alt={userDisplayName} />
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
  isCollapsed ? "grid grid-cols-1 place-items-center gap-2" : "grid grid-cols-4 gap-2"
)}>
  <UserGuideButton 
    variant="ghost" 
    size="icon"
    className="h-9 w-9 rounded-lg bg-card border shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
  />
  <ThemeToggle 
    className="rounded-lg bg-card border shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
    
  />
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
      </SidebarFooter>
    </Sidebar>
  );
}

