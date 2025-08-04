import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useUserGuide } from './UserGuideProvider';

interface UserGuideButtonProps {
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg";
  showText?: boolean;
}

export function UserGuideButton({ 
  variant = "ghost", 
  size = "sm", 
  showText = false 
}: UserGuideButtonProps) {
  const { openGuide } = useUserGuide();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={openGuide}
      className="gap-2"
    >
      <HelpCircle className="h-4 w-4" />
      {showText && "User Guide"}
    </Button>
  );
}