
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ExternalLink, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';

interface FlipCardProps {
  title: string;
  description: string;
  url: string;
  videoUrl?: string | null;
  iconPath?: string | null;
  icon?: React.ReactNode;
  id?: string;
  sourceTable?: string;
  license?: string | null;
}

export const FlipCard = ({
  title,
  description,
  url,
  videoUrl,
  iconPath,
  icon,
  id,
  sourceTable,
  license
}: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const navigate = useNavigate();

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleOpenItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (url.startsWith('/iframe')) {
      navigate(url);
    } else if (!url.startsWith('#')) {
      // If it's not an iframe URL and not a placeholder (#), navigate to iframe with source info
      const params = new URLSearchParams({
        url: url,
        title: title,
        ...(id && { id }),
        ...(sourceTable && { sourceTable }),
        ...(license && { license })
      });
      navigate(`/iframe?${params.toString()}`);
    }
  };

  const handleWatchVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  };

  return (
    <div 
      className="flip-card-container w-full h-80 perspective-1000 group" 
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div className={cn(
        "flip-card relative w-full h-full transition-transform duration-500 transform-style-preserve-3d",
        isFlipped ? "rotate-y-180" : ""
      )}>
        {/* Front of card */}
        <Card className="flip-card-front absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6 border-2 hover:border-primary/20 transition-colors">
          <div className="rounded-full bg-muted p-6 mb-6">
            {iconPath ? (
              <img src={iconPath} alt={title} className="h-16 w-16" />
            ) : icon ? (
              <div className="h-16 w-16 flex items-center justify-center">
                {icon}
              </div>
            ) : (
              <svg className="h-16 w-16 text-muted-foreground" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                <rect height="14" rx="2" ry="2" width="14" x="5" y="5"/>
                <path d="M17 3v2"/>
                <path d="M7 3v2"/>
                <path d="M7 11h10"/>
                <path d="M11 15h2"/>
              </svg>
            )}
          </div>
          <h3 className="text-xl font-bold mb-4 text-center">{title}</h3>
          <Button 
            className="mt-auto" 
            onClick={handleOpenItem}
          >
            Open App <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Card>

        {/* Back of card */}
        <Card className="flip-card-back absolute w-full h-full backface-hidden rotate-y-180 flex flex-col p-6 border-2 border-primary/20">
          <div className="flex-1 flex flex-col text-center">
            <h3 className="text-lg font-bold mb-4">{title}</h3>
            <p className="text-sm text-muted-foreground overflow-y-auto flex-1 mb-6">
              {description}
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleOpenItem}
              className="w-full"
            >
              Open App <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            {videoUrl && (
              <Button 
                variant="outline" 
                onClick={handleWatchVideo}
                className="w-full"
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
