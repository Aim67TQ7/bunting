import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Package, Zap, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuideSectionProps {
  onComplete: () => void;
  isCompleted: boolean;
}

export function GuideCalculatorsSection({ onComplete, isCompleted }: GuideSectionProps) {
  const navigate = useNavigate();
  const calculators = [
    {
      title: 'Stock Levels Calculator',
      purpose: 'Formula-based stock level calculations',
      usage: 'Reference tool for inventory planning',
      status: 'validated',
      description: 'Calculate optimal stock levels based on demand patterns and lead times'
    },
    {
      icon: Zap,
      title: 'ElectroMagnetic Calculator',
      purpose: 'Electromagnetic field and force calculations',
      usage: 'Engineering design and specification work',
      status: 'not_validated',
      description: 'Compute electromagnetic parameters for design applications'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Calculators: Engineering Tools</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Specialized calculation tools for engineering analysis and inventory management
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Always verify critical calculations independently. 
          Some calculators are still in validation phase.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Available Calculators
          </CardTitle>
          <CardDescription>
            Engineering and technical calculation tools for various applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {calculators.map((calc) => (
              <div key={calc.title} className="flex items-start gap-4 p-4 rounded-lg border">
                <calc.icon className="h-6 w-6 mt-1 text-blue-500" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{calc.title}</h3>
                    {calc.status === 'validated' ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Validated
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Validated
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{calc.description}</p>
                  <div className="space-y-1">
                    <p className="text-xs"><strong>Purpose:</strong> {calc.purpose}</p>
                    <p className="text-xs"><strong>Usage:</strong> {calc.usage}</p>
                  </div>
                  <div className="mt-3">
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/calculators')}>
                      <ExternalLink className="h-3 w-3" />
                      Open Calculator
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-1">Validation & Accuracy</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Verify critical calculations independently</li>
                <li>• Use ElectroMagnetic Calculator results as estimates until validation complete</li>
                <li>• Cross-reference results with known standards</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Workflow Optimization</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Save frequently used calculations for reference</li>
                <li>• Document calculation parameters and assumptions</li>
                <li>• Use results as input for other business processes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Integration</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Export results for external analysis</li>
                <li>• Combine with Chat for problem-solving workflows</li>
                <li>• Reference calculations in documentation generation</li>
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