import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid3X3, Wrench, Calendar, QrCode, Mic, FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserGuide } from '@/components/user-guide/UserGuideProvider';

interface GuideSectionProps {
  onComplete: () => void;
  isCompleted: boolean;
}

export function GuideAppsSection({ onComplete, isCompleted }: GuideSectionProps) {
  const navigate = useNavigate();
  const { closeGuide } = useUserGuide();
  const specializedApps = [
    {
      icon: Wrench,
      title: 'Technical Equipment Expert',
      description: 'Equipment specification and recommendation system',
      features: ['Equipment specifications', 'Technical recommendations', 'Compatibility analysis']
    },
    {
      icon: Calendar,
      title: 'Calibration Tool Tracker',
      description: 'Track and manage equipment calibration schedules',
      features: ['Calibration scheduling', 'Maintenance tracking', 'Compliance monitoring']
    },
    {
      icon: QrCode,
      title: 'QR Creator Agent',
      description: 'Generate QR codes for equipment, documentation, or processes',
      features: ['Custom QR generation', 'Asset tracking', 'Quick access links']
    },
    {
      icon: Mic,
      title: 'Meeting Recorder',
      description: 'Document and organize meeting notes and action items',
      features: ['Audio recording', 'Automated transcription', 'Action item extraction']
    },
    {
      icon: FileText,
      title: 'SDS Lookup',
      description: 'Safety Data Sheet search and reference tool',
      features: ['Chemical safety information', 'Compliance documentation', 'Hazard identification']
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Apps: Specialized Business Tools</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Purpose-built applications for specific operational and compliance needs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Specialized Applications
          </CardTitle>
          <CardDescription>
            Dedicated tools for equipment management, compliance, and operational efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {specializedApps.map((app) => {
              const Icon = app.icon;
              return (
                <div key={app.title} className="flex items-start gap-4 p-4 rounded-lg border">
                  <Icon className="h-6 w-6 mt-1 text-purple-500" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{app.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{app.description}</p>
                    <div className="mb-3">
                      <h4 className="text-xs font-medium mb-1">Key Features:</h4>
                      <ul className="text-xs text-muted-foreground">
                        {app.features.map((feature, index) => (
                          <li key={index}>• {feature}</li>
                        ))}
                      </ul>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => { closeGuide(); navigate('/apps'); }}>
                      <ExternalLink className="h-3 w-3" />
                      Open App
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application Integration & Workflows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Equipment Management Workflow</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Use Technical Equipment Expert for specifications</li>
                <li>Generate QR codes for asset tracking</li>
                <li>Schedule maintenance with Calibration Tool Tracker</li>
                <li>Document safety requirements with SDS Lookup</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Meeting & Documentation Workflow</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Record meetings with Meeting Recorder</li>
                <li>Extract action items automatically</li>
                <li>Generate QR codes for quick document access</li>
                <li>Link to relevant safety documentation</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Compliance & Safety</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Maintain equipment calibration schedules</li>
                <li>Track safety data sheet access and updates</li>
                <li>Document compliance activities</li>
                <li>Generate reports for regulatory requirements</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Cross-Platform Integration</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Combine apps with Chat for enhanced problem-solving</li>
                <li>Use Dashboard metrics to track app usage</li>
                <li>Export data for external analysis</li>
                <li>Share QR codes for team collaboration</li>
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