
import React from "react";
import { Card } from "@/components/ui/card";
import { FileText, Mail, Workflow, Search, BarChart3, CalendarCheck } from "lucide-react";

interface WelcomeScreenProps {
  onStarterClick: (question: string, isAiResponse?: boolean) => void;
}

// Simple GPT-5 Mini–optimized starters
const STARTERS = [
  {
    icon: FileText,
    title: "Summarize + Action Items",
    description: "Key points and next steps fast",
    prompt:
      "Task: Summarize the text I'll paste next into: 1) 5 bullet key takeaways, 2) 3–7 action items with suggested owners and dates if inferable, 3) open questions. Be concise and scannable. Ask me to paste the text now.",
  },
  {
    icon: Mail,
    title: "Draft or Rewrite Email",
    description: "Subject + 3 tone variants",
    prompt:
      "Task: Draft a professional email. Context: I'll paste details next. Output: subject + 3 concise body variants (formal, friendly, direct). Keep clear, specific, actionable. Ask me for the context.",
  },
  {
    icon: Workflow,
    title: "SOP / Work Instruction",
    description: "Clean, step-by-step format",
    prompt:
      "Task: Create a step-by-step SOP/work instruction. Inputs: I’ll provide process notes next. Output sections: Purpose, Preconditions, Roles, Materials, Steps (numbered), Quality checks, Safety, Version. Ask me for the process notes.",
  },
  {
    icon: Search,
    title: "Research Snapshot",
    description: "1-page brief with next steps",
    prompt:
      "Task: Produce a 1-page research snapshot. Topic: I’ll specify next. Sections: Overview, 3 key insights, risks/unknowns, sources to check, next steps. Ask for my topic.",
  },
  {
    icon: BarChart3,
    title: "Proposal / One-Pager",
    description: "Problem → Solution → CTA",
    prompt:
      "Task: Draft a 1-page proposal. Inputs: product/service + audience + goal (I’ll share next). Sections: Problem, Solution, Benefits, Proof, Plan & timeline, CTA. Ask me for the inputs.",
  },
  {
    icon: CalendarCheck,
    title: "Project Planner",
    description: "Goals, milestones, owners",
    prompt:
      "Task: Build a lightweight project plan. Inputs: objective & constraints (I’ll share next). Output: Goals, milestones, tasks, owners, risks, assumptions, timeline. Ask me for the objective.",
  },
] as const;

export function WelcomeScreen({ onStarterClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-6xl mx-auto p-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Quick GPT-5 Mini Starters</h2>
        <p className="text-muted-foreground mb-4">Click a card to start a focused conversation.</p>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
