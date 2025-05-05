
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ className, size = "md" }: BrandLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-10 w-auto"
  };
  
  return (
    <div className={cn("relative", className)}>
      <img 
        src="/lovable-uploads/895df273-f223-4819-bb53-93cf01043469.png" 
        alt="Bunting Logo"
        className={cn(sizeClasses[size])}
      />
    </div>
  );
}
