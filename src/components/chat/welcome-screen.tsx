
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, Brain, Zap, FileText, Mail, Search, Workflow, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Conversation starter patterns
const CONVERSATION_PATTERNS = {
  'rewrite-email': {
    icon: Mail,
    title: 'Rewrite an Email',
    description: 'Optimize communication clarity and effectiveness',
    prompt: 'Looks like we\'re polishing up some communication! What style are we going for?',
    options: [
      'Professional',
      'Concise', 
      'Persuasive',
      'Direct',
      'Diplomatic'
    ],
    template: (style: string) => `I'm happy to help! Let's construct a ${style.toLowerCase()} email together.

You can:
- Copy and paste a response you're working on
- Share the email you'd like to respond to  
- Just start typing your thoughts

We can collaborate to enhance its effectiveness. What would you like to work with?`
  },
  'create-sop': {
    icon: Workflow,
    title: 'Create SOP, Guidelines, or Work Instructions',
    description: 'Partner with us to build comprehensive process documentation together',
    prompt: 'Let\'s create solid process documentation together! What type of document should we build?',
    options: [
      'Standard Operating Procedure (SOP)',
      'Work Guidelines', 
      'Work Instructions',
      'Process Documentation'
    ],
    template: (docType: string) => `I'm happy to help! Let's create a solid ${docType} together.

You can:
- Share an existing process that needs documentation
- Describe a workflow that's currently informal
- Start with the main purpose or problem we're solving

We can collaborate to build comprehensive documentation that's actually useful. What's the main purpose of this ${docType.toLowerCase()}, and what would you like to work with?`
  },
  'research-analysis': {
    icon: Search,
    title: 'Research & Analysis',
    description: 'Structured deep-dive into business intelligence',
    prompt: 'Time to dig deep! What area should we research together?',
    options: [
      'Competitor Analysis',
      'Market Trends',
      'Customer Segment Insights',
      'Technology Landscape',
      'Pricing Strategy'
    ],
    template: (analysisType: string) => `I'm happy to help! Let's dive into ${analysisType} together.

You can:
- Share specific competitors or markets you're curious about
- Describe the business decision this research will support
- Start with particular questions you need answered

We can collaborate to uncover valuable insights. What's driving this ${analysisType.toLowerCase()} need, and what would you like to explore first?`
  },
  'process-optimization': {
    icon: Zap,
    title: 'Process Optimization',
    description: 'Identify and streamline inefficient workflows',
    prompt: 'Love it! We\'re going to make things run smoother. Which process is giving us the most headaches?',
    options: [
      'Sales Funnel',
      'Customer Acquisition',
      'Operational Efficiency',
      'Cost Reduction',
      'Resource Allocation'
    ],
    template: (processType: string) => `I'm happy to help! Let's optimize your ${processType} together.

You can:
- Walk me through your current process step by step
- Share where you're seeing bottlenecks or delays
- Describe your ideal outcome or efficiency goals

We can collaborate to identify improvements and streamline operations. What does your current ${processType.toLowerCase()} look like, and where are the biggest pain points?`
  },
  'document-generation': {
    icon: FileText,
    title: 'Document Generation',
    description: 'Rapid, structured document creation',
    prompt: 'We\'re crafting something important! What kind of document are we building?',
    options: [
      'Business Proposal',
      'Investment Pitch Deck',
      'White Paper',
      'Technical Specification',
      'Research Report'
    ],
    template: (documentType: string) => `I'm happy to help! Let's create a compelling ${documentType} together.

You can:
- Share your main goals and target audience
- Provide existing content or research to build from
- Start with your key message or value proposition

We can collaborate to structure and craft something impactful. What's the main purpose of this ${documentType.toLowerCase()}, and who are we trying to reach?`
  },
  'performance-metrics': {
    icon: BarChart3,
    title: 'Performance Metrics Analysis',
    description: 'Develop comprehensive KPI tracking and insights',
    prompt: 'Time to measure what matters! Which performance area should we analyze?',
    options: [
      'Sales Performance',
      'Operational Efficiency',
      'Customer Satisfaction',
      'Financial Metrics',
      'Employee Productivity'
    ],
    template: (metricType: string) => `I'm happy to help! Let's analyze your ${metricType} together.

You can:
- Share what metrics you're currently tracking
- Describe specific performance questions you need answered
- Provide data or goals you're working toward

We can collaborate to develop meaningful insights and actionable recommendations. What's driving this ${metricType.toLowerCase()} analysis, and what data do you have to work with?`
  },
  'brainstorming-partner': {
    icon: Brain,
    title: 'Brainstorming Partner',
    description: 'Exchange and grow ideas with AI-powered collaboration',
    prompt: 'Ready to get creative! What challenge or opportunity should we brainstorm together?',
    options: [
      'Product Innovation',
      'Marketing Strategy',
      'Problem Solving',
      'Business Development',
      'Creative Solutions'
    ],
    template: (sessionType: string) => `I'm happy to help! Let's brainstorm some ${sessionType} ideas together.

You can:
- Share the challenge or opportunity you're facing
- Describe your current approach or constraints
- Start with any initial thoughts or directions

We can collaborate to generate creative solutions and explore new possibilities. What's the main challenge for this ${sessionType.toLowerCase()} session, and what context should I know?`
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
