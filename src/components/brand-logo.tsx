
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ className, size = "md" }: BrandLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };
  
  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className="absolute inset-0 bg-magnetic-600 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-1/2 w-1/2 bg-magnetic-600 rounded-md transform rotate-45"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-1/3 w-1/3 bg-magnetic-800 rounded-sm transform -rotate-45"></div>
      </div>
    </div>
  );
}
