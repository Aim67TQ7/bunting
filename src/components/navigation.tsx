
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
  const { state } = useSidebar();
  const isActive = pathname === href;
  
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive ? 
          "bg-sidebar-accent text-sidebar-accent-foreground" : 
          "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className={cn(
        "transition-opacity", 
        state === "collapsed" ? "opacity-0" : "opacity-100"
      )}>{title}</span>
    </Link>
  );
}

export function NavSection({ children, title }: { children: React.ReactNode; title: string }) {
  const { state } = useSidebar();
  
  return (
    <div className="space-y-1 mb-4">
      <h3 className={cn(
        "mx-3 text-xs font-medium text-sidebar-foreground/60 transition-opacity", 
        state === "collapsed" ? "opacity-0" : "opacity-100"
      )}>
        {title}
      </h3>
      {children}
    </div>
  );
}
