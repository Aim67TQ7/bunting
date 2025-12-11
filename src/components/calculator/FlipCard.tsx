
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ExternalLink, Video, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/use-favorites";


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
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const onToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    try {
      const result = await toggleFavorite(id);
      toast({ title: result === 'added' ? 'Added to favorites' : 'Removed from favorites' });
    } catch (err: any) {
      const message = err?.message || 'Could not update favorite';
      toast({ title: 'Action failed', description: message, variant: 'destructive' });
    }
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
        ...(sourceTable && { sourceTable })
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
      className="flip-card-container w-full h-56 perspective-1000 group" 
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div className={cn(
        "flip-card relative w-full h-full transition-transform duration-500 transform-style-preserve-3d",
        isFlipped ? "rotate-y-180" : ""
      )}>
        {/* Front of card */}
        <Card className="flip-card-front absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-4 border-2 hover:border-primary/20 transition-colors">
          {id && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle favorite"
              className="absolute right-2 top-2 rounded-full text-primary hover:bg-accent/70"
              onClick={onToggleFavorite}
            >
              <Star className="h-4 w-4" fill={isFavorite(id) ? "currentColor" : "none"} />
            </Button>
          )}
          <div className="rounded-full bg-muted p-4 mb-4">
            {iconPath ? (
              <img src={iconPath} alt={title} className="h-12 w-12" />
            ) : icon ? (
              <div className="h-12 w-12 flex items-center justify-center">
                {icon}
              </div>
            ) : (
              <svg className="h-12 w-12 text-muted-foreground" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                <rect height="14" rx="2" ry="2" width="14" x="5" y="5"/>
                <path d="M17 3v2"/>
                <path d="M7 3v2"/>
                <path d="M7 11h10"/>
                <path d="M11 15h2"/>
              </svg>
            )}
          </div>
          <h3 className="text-lg font-bold mb-3 text-center">{title}</h3>
          <Button 
            size="sm"
            className="mt-auto" 
            onClick={handleOpenItem}
          >
            Open App <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </Card>

        {/* Back of card */}
        <Card className="flip-card-back absolute w-full h-full backface-hidden rotate-y-180 flex flex-col p-4 border-2 border-primary/20">
          {id && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle favorite"
              className="absolute right-2 top-2 rounded-full text-primary hover:bg-accent/70"
              onClick={onToggleFavorite}
            >
              <Star className="h-4 w-4" fill={isFavorite(id) ? "currentColor" : "none"} />
            </Button>
          )}
          <div className="flex-1 flex flex-col text-center">
            <h3 className="text-base font-bold mb-2">{title}</h3>
            <p className="text-xs text-muted-foreground overflow-y-auto flex-1 mb-3">
              {description}
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              size="sm"
              onClick={handleOpenItem}
              className="w-full"
            >
              Open App <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
            {videoUrl && (
              <Button 
                size="sm"
                variant="outline" 
                onClick={handleWatchVideo}
                className="w-full"
              >
                Watch Tutorial <Video className="ml-2 h-3 w-3" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
