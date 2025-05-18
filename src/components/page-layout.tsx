
import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className={cn("flex-1", className)}>
        {children}
      </main>
    </div>
  );
}
