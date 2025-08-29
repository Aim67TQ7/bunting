import React from "react";
import { Card } from "@/components/ui/card";
import { Mail, BrainCircuit } from "lucide-react";

interface WelcomeScreenProps {
  onStarterClick: (question: string, isAiResponse?: boolean) => void;
}

// Focused starters for email and metaprompt creation
const STARTERS = [
  {
    icon: Mail,
    title: "Draft or Rewrite Email",
    description: "Subject + 3 tone variants",
    prompt:
      "Task: Draft a professional email. Context: I'll paste details next. Output: subject + 3 concise body variants (formal, friendly, direct). Keep clear, specific, actionable. Ask me for the context.",
  },
  {
    icon: BrainCircuit,
    title: "Create Metaprompt",
    description: "Build a research metaprompt",
    prompt:
      "I'll help you create a powerful metaprompt for any research topic. A metaprompt is a structured template that guides AI to give you consistently excellent results. Let's start: What topic or type of research do you want to create a metaprompt for? (Examples: market analysis, competitive research, technical specifications, customer insights, etc.)",
  },
] as const;

export function WelcomeScreen({ onStarterClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-6xl mx-auto p-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Quick Starters</h2>
        <p className="text-muted-foreground mb-4">Choose a focused workflow to begin.</p>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {STARTERS.map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.title}
                className="p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors border-2 hover:border-primary/20"
                onClick={() => onStarterClick(s.prompt)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-1">{s.title}</h4>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}