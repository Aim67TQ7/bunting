
import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkle, Lightbulb, Calculator, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WelcomeScreenProps {
  onStarterClick: (question: string) => void;
}

export function WelcomeScreen({ onStarterClick }: WelcomeScreenProps) {
  const navigate = useNavigate();

  const handleAppLaunch = (question: string, appPath: string) => {
    onStarterClick(question);
    // Navigate to the application after a short delay to allow the message to be displayed
    setTimeout(() => {
      navigate(appPath);
    }, 500);
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Welcome to BuntingGPT</h2>
        <p className="text-muted-foreground mb-4">
          Assistant is now smarter and faster
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
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
          onClick={() => handleAppLaunch("How do I calculate minimum stock levels?", "/iframe?url=https://stock-calculator.bunting.com&title=Stock Levels Calculator")}
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
  );
}
