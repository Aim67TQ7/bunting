
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
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
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <Router>
            <SidebarProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route 
                  path="/" 
                  element={
                    <PrivateRoute>
                      <Index />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/history" 
                  element={
                    <PrivateRoute>
                      <History />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/calculators" 
                  element={
                    <PrivateRoute>
                      <Calculators />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/iframe" 
                  element={
                    <PrivateRoute>
                      <Iframe />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/sales" 
                  element={
                    <PrivateRoute>
                      <Sales />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/apps" 
                  element={
                    <PrivateRoute>
                      <Apps />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <PrivateRoute>
                      <Reports />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <PrivateRoute>
                      <Settings />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/baq-mto" 
                  element={
                    <PrivateRoute>
                      <BaqMto />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/admin/knowledge" 
                  element={
                    <PrivateRoute>
                      <AdminKnowledge />
                    </PrivateRoute>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SidebarProvider>
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
