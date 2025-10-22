import React from "react";
import { Card } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";

interface WelcomeScreenProps {
  onStarterClick: (question: string, isAiResponse?: boolean) => void;
}

// Metaprompt creation starter
const STARTER = {
  icon: BrainCircuit,
  title: "Create Metaprompt",
  description: "Build a research metaprompt",
  prompt:
    "I'll help you create a powerful metaprompt for any research topic. A metaprompt is a structured template that guides AI to give you consistently excellent results. Let's start: What topic or type of research do you want to create a metaprompt for? (Examples: market analysis, competitive research, technical specifications, customer insights, etc.)",
} as const;

export function WelcomeScreen({ onStarterClick }: WelcomeScreenProps) {
  const Icon = STARTER.icon;
  
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-6xl mx-auto p-4">
      <div className="w-full max-w-md mx-auto">
        <Card
          className="p-6 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors border-2 hover:border-primary/20"
          onClick={() => onStarterClick(STARTER.prompt, true)}
        >
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <h4 className="font-semibold mb-2 text-lg">{STARTER.title}</h4>
            <p className="text-sm text-muted-foreground">{STARTER.description}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}