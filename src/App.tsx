
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import Auth from "./pages/auth/Auth";
import AuthCallback from "./pages/auth/AuthCallback";
import ResetPassword from "./pages/auth/ResetPassword";
import PrivateRoute from "./components/PrivateRoute";
import AdminKnowledge from "./pages/AdminKnowledge";

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <AuthProvider>
            <SidebarProvider>
              <Routes>
                {/* Public routes that don't need auth */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                
                {/* Protected routes */}
                <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
                <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
                <Route path="/calculators" element={<PrivateRoute><Calculators /></PrivateRoute>} />
                <Route path="/iframe" element={<PrivateRoute><Iframe /></PrivateRoute>} />
                <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
                <Route path="/apps" element={<PrivateRoute><Apps /></PrivateRoute>} />
                <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="/baq-mto" element={<PrivateRoute><BaqMto /></PrivateRoute>} />
                <Route path="/admin/knowledge" element={
                  <PrivateRoute>
                    <AdminKnowledge />
                  </PrivateRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SidebarProvider>
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
