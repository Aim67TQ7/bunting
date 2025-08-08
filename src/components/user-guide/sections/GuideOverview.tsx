import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Calculator, TrendingUp, Grid3X3, BarChart3, PanelLeft } from 'lucide-react';

interface GuideSectionProps {
  onComplete: () => void;
  isCompleted: boolean;
}

export function GuideOverview({ onComplete, isCompleted }: GuideSectionProps) {
  const platformSections = [
    {
      icon: PanelLeft,
      title: 'The Sidebar',
      description: 'Global navigation: collapse/expand, mini mode, and quick access to all sections.',
      color: 'text-slate-500'
    },
    {
      icon: BarChart3,
      title: 'Dashboard',
      description: 'Real-time operations overview with key metrics and performance indicators',
      color: 'text-blue-500'
    },
    {
      icon: MessageSquare,
      title: 'Chat',
      description: 'AI-powered communication hub with guided conversation patterns',
      color: 'text-green-500'
    },
    {
      icon: Calculator,
      title: 'Calculators',
      description: 'Engineering and technical tools for calculations and analysis',
      color: 'text-purple-500'
    },
    {
      icon: TrendingUp,
      title: 'Sales',
      description: 'Customer and prospect management tools for sales optimization',
      color: 'text-orange-500'
    },
    {
      icon: Grid3X3,
      title: 'Apps',
      description: 'Specialized business applications for various operational needs',
      color: 'text-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Welcome to BuntingGPT</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Your integrated AI-powered business platform designed to streamline communication, 
          calculations, sales, and operations across your organization.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
          <CardDescription>
            The sidebar and core sections are accessible from the left navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            {platformSections.map((section) => (
              <div key={section.title} className="flex items-start gap-4 p-4 rounded-lg border">
                <section.icon className={`h-6 w-6 mt-1 ${section.color}`} />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Best practices for using BuntingGPT effectively</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Daily Workflow</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Start with the Dashboard for operational awareness</li>
              <li>Use Chat for AI-powered problem solving and documentation</li>
              <li>Access Calculators for technical analysis</li>
              <li>Utilize Sales tools for customer management</li>
              <li>Explore Apps for specialized tasks</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Key Features</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>All conversations are encrypted for security</li>
              <li>Guided conversation patterns for consistent results</li>
              <li>Real-time data integration</li>
              <li>Cross-platform accessibility</li>
            </ul>
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