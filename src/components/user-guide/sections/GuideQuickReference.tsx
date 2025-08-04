import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Navigation, Target, Shield, Lightbulb } from 'lucide-react';

interface GuideSectionProps {
  onComplete: () => void;
  isCompleted: boolean;
}

export function GuideQuickReference({ onComplete, isCompleted }: GuideSectionProps) {
  const navigationShortcuts = [
    { shortcut: 'Dashboard', description: 'Real-time operations overview' },
    { shortcut: 'Chat → New Chat', description: 'Start AI conversation' },
    { shortcut: 'Chat → History', description: 'Access previous conversations' },
    { shortcut: 'Calculators', description: 'Engineering calculation tools' },
    { shortcut: 'Sales', description: 'Customer and prospect management' },
    { shortcut: 'Apps', description: 'Specialized business applications' }
  ];

  const commonTasks = [
    { task: 'Daily Operations Check', path: 'Dashboard → Operations Dashboard' },
    { task: 'Generate Quote', path: 'Sales → Performer Quote Tool' },
    { task: 'Find New Prospects', path: 'Sales → Prospect Finder' },
    { task: 'Optimize Process', path: 'Chat → Process Optimization pattern' },
    { task: 'Create Documentation', path: 'Chat → Document Generation pattern' }
  ];

  const efficiencyTips = [
    'Bookmark frequently used apps',
    'Use guided patterns for consistent quality',
    'Export dashboard data for external analysis',
    'Leverage chat history to build on previous work',
    'Combine tools (e.g., use Prospect Finder with Quote Tool for complete sales workflow)'
  ];

  const bestPractices = [
    {
      category: 'Daily Operations',
      practices: ['Regular dashboard monitoring', 'Check OTD and orders on hold', 'Review chat history for solutions']
    },
    {
      category: 'Consistent Usage',
      practices: ['Use guided chat patterns', 'Save important conversations', 'Document calculation parameters']
    },
    {
      category: 'Data Validation',
      practices: ['Cross-reference critical calculations', 'Verify against known standards', 'Use multiple sources for validation']
    },
    {
      category: 'Collaboration',
      practices: ['Share relevant insights across teams', 'Export data for external analysis', 'Document team processes']
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Quick Reference</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Essential shortcuts, common tasks, and best practices for maximum efficiency
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Navigation Shortcuts
          </CardTitle>
          <CardDescription>Quick access to key platform features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {navigationShortcuts.map((item) => (
              <div key={item.shortcut} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{item.shortcut}</code>
                </div>
                <div className="text-sm text-muted-foreground text-right">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Most Common Tasks
          </CardTitle>
          <CardDescription>Frequently used workflows and their navigation paths</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {commonTasks.map((item) => (
              <div key={item.task} className="flex items-start gap-3 p-3 rounded-lg border">
                <Badge variant="outline" className="mt-0.5">{item.task}</Badge>
                <div className="flex-1">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{item.path}</code>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Tips for Maximum Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {efficiencyTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span className="text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bestPractices.map((section) => (
            <div key={section.category}>
              <h4 className="font-medium mb-2">{section.category}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {section.practices.map((practice, index) => (
                  <li key={index}>• {practice}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Support & Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-1">Self-Service Options</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Review chat history for previous solutions</li>
                <li>• Use guided conversation patterns for consistent results</li>
                <li>• Reference this guide for feature explanations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Getting Help</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Contact system administrator for technical issues</li>
                <li>• Use Chat for AI-powered problem solving</li>
                <li>• Export data for external analysis when needed</li>
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