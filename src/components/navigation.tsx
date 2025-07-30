
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";

interface NavItemProps {
  icon: LucideIcon;
  title: string;
  href: string;
}

export function NavItem({ icon: Icon, title, href }: NavItemProps) {
  const { pathname } = useLocation();
  const { state, isMobile, open } = useSidebar();
  const isActive = pathname === href;
  // For icon collapsible mode, the sidebar shows collapsed when closed
  const isCollapsed = !isMobile && (!open || state === "collapsed");
  
  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col items-center justify-center rounded-xl transition-all duration-200 hover:scale-[1.02]",
        "bg-card border shadow-sm hover:shadow-md",
        isCollapsed ? "h-12 w-12 p-2" : "h-16 w-full p-3",
        isActive 
          ? "bg-primary/10 border-primary/20 text-primary shadow-lg" 
          : "text-card-foreground hover:bg-accent/50 hover:border-accent"
      )}
    >
      <Icon className={cn(
        "transition-all duration-200",
        isCollapsed ? "h-5 w-5" : "h-6 w-6 mb-1"
      )} />
      {!isCollapsed && (
        <span className="text-xs font-medium text-center leading-tight">
          {title}
        </span>
      )}
    </Link>
  );
}

export function NavSection({ children, title }: { children: React.ReactNode; title: string }) {
  const { state, isMobile, open } = useSidebar();
  const isCollapsed = !isMobile && (!open || state === "collapsed");
  
  return (
    <div className={cn(
      "space-y-2 mb-6",
      isCollapsed ? "flex flex-col items-center" : ""
    )}>
      {!isCollapsed && (
        <h3 className="px-3 text-xs font-medium text-muted-foreground/80 mb-3">
          {title}
        </h3>
      )}
      <div className={cn(
        isCollapsed 
          ? "flex flex-col items-center gap-2" 
          : "grid grid-cols-2 gap-2"
      )}>
        {children}
      </div>
    </div>
  );
}
