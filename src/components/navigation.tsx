
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavItemProps {
  icon: LucideIcon;
  title: string;
  href: string;
}

export function NavItem({ icon: Icon, title, href }: NavItemProps) {
  const { pathname } = useLocation();
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
      <span>{title}</span>
    </Link>
  );
}

export function NavSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="space-y-1">
      <h3 className="mx-3 text-xs font-medium text-sidebar-foreground/60">{title}</h3>
      {children}
    </div>
  );
}
