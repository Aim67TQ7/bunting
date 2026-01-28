import { PageLayout } from "@/components/page-layout";
import { Link } from "react-router-dom";
import { Shield, Lock, MessageSquare, Calculator, AppWindow, BarChart3 } from "lucide-react";

const Dashboard = () => {
  return (
    <PageLayout title="Dashboard">
      <div className="flex flex-col items-center justify-center min-h-full bg-background p-6">
        {/* Main branding section */}
        <div className="text-center space-y-6 max-w-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/bunting-logo-new.png" 
              alt="BuntingGPT" 
              className="h-16 md:h-20"
            />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            BuntingGPT
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground">
            Now Integrated Inside Teams
          </p>

          {/* Status indicators with Privacy/Terms links */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
            <Link 
              to="/privacy" 
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Shield className="h-4 w-4 text-green-500" />
              <span>Privacy</span>
            </Link>
            <span className="text-border">|</span>
            <Link 
              to="/terms" 
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Lock className="h-4 w-4 text-green-500" />
              <span>Terms of Use</span>
            </Link>
          </div>

          {/* Quick access cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
            <Link 
              to="/chat" 
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
            >
              <MessageSquare className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-foreground">Chat</span>
            </Link>
            <Link 
              to="/calculators" 
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
            >
              <Calculator className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-foreground">Calculators</span>
            </Link>
            <Link 
              to="/apps" 
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
            >
              <AppWindow className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-foreground">Apps</span>
            </Link>
            <Link 
              to="/reports" 
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
            >
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-foreground">Reports</span>
            </Link>
          </div>

          {/* Version footer */}
          <div className="pt-8 text-xs text-muted-foreground">
            <span>core v. 4.2.0 — MS365 Teams Integration</span>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
