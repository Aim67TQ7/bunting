import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MapPin, Calculator as CalcIcon, TrendingUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuideSectionProps {
  onComplete: () => void;
  isCompleted: boolean;
}

export function GuideSalesSection({ onComplete, isCompleted }: GuideSectionProps) {
  const navigate = useNavigate();
  const salesTools = [
    {
      icon: FileText,
      title: 'Pull Test Documentation',
      purpose: 'Technical documentation for pull test procedures',
      usage: 'Generate standardized test protocols',
      description: 'Create comprehensive documentation for magnetic pull testing procedures and compliance'
    },
    {
      icon: MapPin,
      title: 'Prospect Finder',
      purpose: 'Utilize word search to find prospects near existing customers',
      usage: 'Geographic market expansion and territory planning',
      description: 'Identify potential customers in geographic proximity to existing client base'
    },
    {
      icon: CalcIcon,
      title: 'Performer Quote Tool',
      purpose: 'Streamlined quote generation and pricing',
      usage: 'Accelerate sales cycle with automated calculations',
      description: 'Generate accurate quotes quickly with integrated pricing and specifications'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Sales Tools</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Comprehensive sales management and customer acquisition tools
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Tool Suite
          </CardTitle>
          <CardDescription>
            Integrated tools for prospect management, documentation, and quote generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesTools.map((tool) => (
              <div key={tool.title} className="flex items-start gap-4 p-4 rounded-lg border">
                <tool.icon className="h-6 w-6 mt-1 text-green-500" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
                  <div className="space-y-1 mb-3">
                    <p className="text-xs"><strong>Purpose:</strong> {tool.purpose}</p>
                    <p className="text-xs"><strong>Usage:</strong> {tool.usage}</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/sales')}>
                    <ExternalLink className="h-3 w-3" />
                    Open Tool
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales Workflow Integration</CardTitle>
          <CardDescription>
            Optimize your sales process with integrated tool usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Complete Sales Workflow</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Use Prospect Finder to identify geographic clusters</li>
                <li>Generate quotes using Performer Quote Tool</li>
                <li>Document technical requirements with Pull Test Documentation</li>
                <li>Track progress through Operations Dashboard</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Territory Management</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Leverage geographic clustering for efficient territory coverage</li>
                <li>Identify expansion opportunities near successful accounts</li>
                <li>Plan travel routes based on prospect density</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Documentation & Compliance</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Standardize technical documentation across all sales activities</li>
                <li>Ensure compliance with industry testing protocols</li>
                <li>Maintain consistent quality in customer communications</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Performance Optimization</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Track quote-to-close ratios through integrated analytics</li>
                <li>Monitor territory performance and adjust strategies</li>
                <li>Combine tools for complete customer lifecycle management</li>
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