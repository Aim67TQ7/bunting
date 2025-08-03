
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkle, Lightbulb, Calculator, Users, Zap, FileText, Mail, Search, Workflow, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Conversation starter patterns
const CONVERSATION_PATTERNS = {
  'rewrite-email': {
    icon: Mail,
    title: 'Rewrite an Email',
    description: 'Optimize communication clarity and effectiveness',
    prompt: 'Please provide the original email. I will help you rewrite it to be more:',
    options: [
      'Professional',
      'Concise', 
      'Persuasive',
      'Direct',
      'Diplomatic'
    ],
    template: (style: string) => `Rewrite the following email to make it more ${style}:\n\n[Original Email Text]\n\nRewritten Email:`
  },
  'create-sop': {
    icon: Workflow,
    title: 'Create Standard Operating Procedure (SOP)',
    description: 'Systematize and document critical business processes',
    prompt: 'What process would you like to document?',
    options: [
      'Sales Workflow',
      'Customer Support',
      'Product Onboarding',
      'Quality Assurance',
      'Internal Communication'
    ],
    template: (processType: string) => `Create a detailed Standard Operating Procedure (SOP) for ${processType}:\n\nSOP Title:\nPurpose:\nScope:\nDefinitions:\nResponsibilities:\nProcedure Steps:\n1.\n2.\n3.\n\nPotential Exceptions:\nPerformance Metrics:\nApproval and Revision History:`
  },
  'research-analysis': {
    icon: Search,
    title: 'Research & Analysis',
    description: 'Structured deep-dive into business intelligence',
    prompt: 'What topic needs comprehensive research?',
    options: [
      'Competitor Analysis',
      'Market Trends',
      'Customer Segment Insights',
      'Technology Landscape',
      'Pricing Strategy'
    ],
    template: (analysisType: string) => `Comprehensive ${analysisType} Research Report:\n\nExecutive Summary:\nKey Findings:\nMethodology:\nDetailed Analysis:\n\nMarket Overview\nCompetitive Landscape\nKey Insights\nActionable Recommendations\n\nData Sources:\nLimitations and Considerations:`
  },
  'process-optimization': {
    icon: Zap,
    title: 'Process Optimization',
    description: 'Identify and streamline inefficient workflows',
    prompt: 'Which business process needs optimization?',
    options: [
      'Sales Funnel',
      'Customer Acquisition',
      'Operational Efficiency',
      'Cost Reduction',
      'Resource Allocation'
    ],
    template: (processType: string) => `${processType} Optimization Analysis:\n\nCurrent State Assessment:\n\nExisting Process Workflow\nKey Performance Indicators (KPIs)\nBottlenecks and Inefficiencies\n\nProposed Optimization Strategies:\n1.\n2.\n3.\n\nExpected Outcomes:\n\nCost Savings\nEfficiency Gains\nPerformance Improvements\n\nImplementation Roadmap:\nMetrics for Tracking Success:`
  },
  'document-generation': {
    icon: FileText,
    title: 'Document Generation',
    description: 'Rapid, structured document creation',
    prompt: 'What type of document do you need?',
    options: [
      'Business Proposal',
      'Investment Pitch Deck',
      'White Paper',
      'Technical Specification',
      'Research Report'
    ],
    template: (documentType: string) => `${documentType} Template:\n\nTitle:\nExecutive Summary:\nKey Sections:\n1.\n2.\n3.\n\nAppendices:\nReferences:\nConfidentiality Statement:`
  }
};

interface WelcomeScreenProps {
  onStarterClick: (question: string) => void;
}

export function WelcomeScreen({ onStarterClick }: WelcomeScreenProps) {
  const navigate = useNavigate();
  const [selectedStarter, setSelectedStarter] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleAppLaunch = (question: string, appPath: string) => {
    onStarterClick(question);
    setTimeout(() => {
      navigate(appPath);
    }, 500);
  };

  const handleStarterSelect = (starter: string) => {
    setSelectedStarter(CONVERSATION_PATTERNS[starter as keyof typeof CONVERSATION_PATTERNS]);
    setSelectedOption(null);
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    const template = selectedStarter.template(option);
    onStarterClick(template);
    // Reset after sending
    setTimeout(() => {
      setSelectedStarter(null);
      setSelectedOption(null);
    }, 1000);
  };

  const resetSelection = () => {
    setSelectedStarter(null);
    setSelectedOption(null);
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-6xl mx-auto p-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Welcome to BuntingGPT</h2>
        <p className="text-muted-foreground mb-4">
          Choose a conversation starter or use guided patterns
        </p>
      </div>

      {!selectedStarter ? (
        <div className="w-full">
          {/* Quick Starters */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Quick Starters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
              <Button 
                variant="outline" 
                className="flex items-center justify-start h-auto p-4 text-left"
                onClick={() => onStarterClick("What magnetic separator is best for removing fine iron from a dry process?")}
              >
                <Sparkle className="mr-2 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Magnetic separators</p>
                  <p className="text-sm text-muted-foreground">For removing fine iron from dry processes</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-start h-auto p-4 text-left"
                onClick={() => onStarterClick("Can you explain the difference between electromagnets and permanent magnets?")}
              >
                <Lightbulb className="mr-2 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Electromagnetic basics</p>
                  <p className="text-sm text-muted-foreground">Electromagnets vs. permanent magnets</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-start h-auto p-4 text-left"
                onClick={() => handleAppLaunch("How do I calculate minimum stock levels?", "/iframe?url=https://stock.buntinggpt.com&title=Stock Levels Calculator")}
              >
                <Calculator className="mr-2 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Inventory management</p>
                  <p className="text-sm text-muted-foreground">Calculate minimum stock levels</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-start h-auto p-4 text-left"
                onClick={() => handleAppLaunch("Do we have customers in Denver, Colorado?", "/sales")}
              >
                <Users className="mr-2 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Customer prospecting</p>
                  <p className="text-sm text-muted-foreground">Find customers by location</p>
                </div>
              </Button>
            </div>
          </div>

          {/* Guided Patterns */}
          <div>
            <h3 className="text-lg font-medium mb-4">Guided Conversation Patterns</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(CONVERSATION_PATTERNS).map(([key, starter]) => (
                <Card
                  key={key}
                  className="p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors border-2 hover:border-primary/20"
                  onClick={() => handleStarterSelect(key)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <starter.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">{starter.title}</h4>
                    <p className="text-sm text-muted-foreground">{starter.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Card className="w-full max-w-2xl p-6">
          <Button 
            variant="ghost" 
            onClick={resetSelection} 
            className="mb-4 p-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Starters
          </Button>

          <div className="text-center mb-6">
            <div className="rounded-full bg-muted p-4 mx-auto mb-4 w-fit">
              <selectedStarter.icon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{selectedStarter.title}</h3>
            <p className="text-muted-foreground mb-4">{selectedStarter.prompt}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {selectedStarter.options.map((option: string) => (
              <Button
                key={option}
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:bg-primary hover:text-primary-foreground"
                onClick={() => handleOptionSelect(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
