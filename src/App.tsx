import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserGuideProvider } from "@/components/user-guide/UserGuideProvider";
import { UserGuideDialog } from "@/components/user-guide/UserGuideDialog";
import { CookieConsent } from "@/components/CookieConsent";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Calculators from "./pages/Calculators";
import Iframe from "./pages/Iframe";
import Sales from "./pages/Sales";
import Apps from "./pages/Apps";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import BaqMto from "./pages/BaqMto";
import NotFound from "./pages/NotFound";
import AdminAppItems from "./pages/AdminAppItems";
import AdminKnowledge from "./pages/AdminKnowledge";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import PrivateRoute from "./components/PrivateRoute";
import DemoModeBadge from "./components/DemoModeBadge";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <UserGuideProvider>
            <Router>
            <SidebarProvider defaultOpen={true}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/chat" element={<Index />} />
                <Route path="/history" element={<History />} />
                <Route path="/calculators" element={<Calculators />} />
                <Route path="/iframe" element={<Iframe />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/apps" element={<Apps />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/baq-mto" element={<BaqMto />} />
                <Route path="/admin/knowledge" element={<AdminKnowledge />} />
                <Route path="/admin/app-items" element={<AdminAppItems />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <DemoModeBadge />
              <CookieConsent />
            </SidebarProvider>
            <UserGuideDialog />
          </Router>
          </UserGuideProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
