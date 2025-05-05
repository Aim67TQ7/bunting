
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ExternalLink, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlipCardProps {
  title: string;
  description: string;
  url: string;
  videoUrl?: string | null;
  iconPath?: string | null;
}

export const FlipCard = ({
  title,
  description,
  url,
  videoUrl,
  iconPath
}: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleOpenCalculator = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use the URL as is, since we'll navigate in the App.tsx router
    window.location.href = `/iframe?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  };

  const handleWatchVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  };

  return (
    <div 
      className="flip-card-container w-full h-64 perspective-1000 cursor-pointer" 
      onClick={handleFlip}
    >
      <div className={cn(
        "flip-card relative w-full h-full transition-transform duration-500 transform-style-preserve-3d",
        isFlipped ? "rotate-y-180" : ""
      )}>
        {/* Front of card */}
        <Card className="flip-card-front absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6">
          <div className="rounded-full bg-muted p-4 mb-4">
            {iconPath ? (
              <img src={iconPath} alt={title} className="h-12 w-12" />
            ) : (
              <svg className="h-8 w-8 text-muted-foreground" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                <rect height="14" rx="2" ry="2" width="14" x="5" y="5"/>
                <path d="M17 3v2"/>
                <path d="M7 3v2"/>
                <path d="M7 11h10"/>
                <path d="M11 15h2"/>
              </svg>
            )}
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <Button 
            className="mt-4" 
            onClick={handleOpenCalculator}
          >
            Open Calculator <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            Click to flip
          </div>
        </Card>

        {/* Back of card */}
        <Card className="flip-card-back absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-between p-6">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-bold mb-3">{title}</h3>
            <p className="text-sm text-muted-foreground overflow-y-auto max-h-[120px]">
              {description}
            </p>
          </div>
          
          <div className="flex w-full justify-between">
            <Button variant="outline" onClick={handleFlip}>
              Back
            </Button>
            {videoUrl && (
              <Button 
                variant="secondary" 
                onClick={handleWatchVideo}
              >
                Watch Tutorial <Video className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
