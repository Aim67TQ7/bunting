import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, FileText, Search, Zap, Target, BarChart, Lightbulb, History } from 'lucide-react';

interface GuideSectionProps {
  onComplete: () => void;
  isCompleted: boolean;
}

export function GuideChatSection({ onComplete, isCompleted }: GuideSectionProps) {
  const conversationPatterns = [
    {
      icon: FileText,
      title: 'Rewrite an Email',
      description: 'Optimizes communication clarity and effectiveness',
      usage: 'Perfect for client communications and internal memos',
      color: 'text-blue-500'
    },
    {
      icon: Target,
      title: 'Create SOP Guidelines',
      description: 'Partner with AI to build comprehensive process documentation',
      usage: 'Ensures consistency across team operations',
      color: 'text-green-500'
    },
    {
      icon: Search,
      title: 'Research & Analysis',
      description: 'Structured deep-dive into business intelligence',
      usage: 'Ideal for market research and competitive analysis',
      color: 'text-purple-500'
    },
    {
      icon: Zap,
      title: 'Process Optimization',
      description: 'Identifies and streamlines inefficient workflows',
      usage: 'Generates actionable improvement recommendations',
      color: 'text-orange-500'
    },
    {
      icon: FileText,
      title: 'Document Generation',
      description: 'Rapid, structured document creation',
      usage: 'Maintains professional standards and formatting',
      color: 'text-red-500'
    },
    {
      icon: BarChart,
      title: 'Performance Metrics Analysis',
      description: 'Develops comprehensive KPI tracking and insights',
      usage: 'Creates data-driven decision frameworks',
      color: 'text-indigo-500'
    },
    {
      icon: Lightbulb,
      title: 'Brainstorming Partner',
      description: 'Exchange and grow ideas with AI-powered collaboration',
      usage: 'Accelerates innovation and problem-solving',
      color: 'text-yellow-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Chat: AI Communication Hub</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Transform your communication and problem-solving with AI-powered conversation patterns
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Getting Started with Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm"><strong>1.</strong> Click Chat in the left navigation</p>
            <p className="text-sm"><strong>2.</strong> Select New Chat to begin a conversation</p>
            <p className="text-sm"><strong>3.</strong> Choose from guided conversation patterns or start a custom chat</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guided Conversation Patterns</CardTitle>
          <CardDescription>
            Pre-built conversation templates for consistent, high-quality results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {conversationPatterns.map((pattern) => (
              <div key={pattern.title} className="flex items-start gap-4 p-4 rounded-lg border">
                <pattern.icon className={`h-6 w-6 mt-1 ${pattern.color}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{pattern.title}</h3>
                    <Badge variant="secondary" className="text-xs">Pattern</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{pattern.description}</p>
                  <p className="text-xs text-muted-foreground italic">{pattern.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Chat History & Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-1">Accessing Previous Conversations</h4>
              <p className="text-sm text-muted-foreground">
                Access previous conversations via the History tab and search conversations using the search bar
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Security</h4>
              <p className="text-sm text-muted-foreground">
                All chats are encrypted for security and privacy protection
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use guided patterns for standardized outputs</li>
                <li>• Save important conversations for reference</li>
                <li>• Review chat history for previous solutions</li>
                <li>• Build on previous conversations for continuity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={onComplete} 
          variant={isCompleted ? "secondary" : "default"}
          disabled={isCompleted}
        >
          {isCompleted ? "Section Completed" : "Mark as Complete"}
        </Button>
      </div>
    </div>
  );
}