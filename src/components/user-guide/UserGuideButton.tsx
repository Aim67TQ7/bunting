import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useUserGuide } from './UserGuideProvider';
import { cn } from '@/lib/utils';

interface UserGuideButtonProps {
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg" | "icon";
  showText?: boolean;
  className?: string;
}

export function UserGuideButton({ 
  variant = "ghost", 
  size = "sm", 
  showText = false,
  className
}: UserGuideButtonProps) {
  const { openGuide } = useUserGuide();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={openGuide}
      className={cn(showText ? "gap-2" : "", className)}
    >
      <HelpCircle className="h-4 w-4" />
      {showText && "User Guide"}
    </Button>
  );
}