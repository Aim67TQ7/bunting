
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { NavItem, NavSection } from "@/components/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { MessageSquare, History, Calculator, LineChart, Grid3X3, Settings, LogOut, Menu } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  // Mock user data - in a real application, this would come from authentication
  const user = {
    name: "John Smith",
    role: "Account Manager"
  };

  return (
    <Sidebar className={className} variant="sidebar" collapsible="icon">
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
            <div className="font-medium text-sm">{user.name}</div>
            <div className="text-xs text-sidebar-foreground/70">{user.role}</div>
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
        </NavSection>
      </SidebarContent>
      
      <SidebarFooter className="mt-auto">
        <Separator className="my-2" />
        
        <div className="flex justify-between items-center px-2 py-1">
          <ThemeToggle />
          
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
