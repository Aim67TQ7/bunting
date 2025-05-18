
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import History from "./pages/History";
import Calculators from "./pages/Calculators";
import Iframe from "./pages/Iframe";
import Sales from "./pages/Sales";
import Apps from "./pages/Apps";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import BaqMto from "./pages/BaqMto";
import NotFound from "./pages/NotFound";
import AdminKnowledge from "./pages/AdminKnowledge";

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <SidebarProvider>
            <Routes>
              {/* All routes are now directly accessible */}
              <Route path="/" element={<Index />} />
              <Route path="/history" element={<History />} />
              <Route path="/calculators" element={<Calculators />} />
              <Route path="/iframe" element={<Iframe />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/apps" element={<Apps />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/baq-mto" element={<BaqMto />} />
              <Route path="/admin/knowledge" element={<AdminKnowledge />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SidebarProvider>
        </Router>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
