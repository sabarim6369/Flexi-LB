import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Metrics from "./pages/Metrics";
import Alerts from "./pages/Alerts";
import LoadBalancerDetail from "./pages/LoadBalancerDetail";
import LoadBalancerMetrics from "./pages/LoadBalancerMetrics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./Utils/Protectedroute";
import AuthRoute from "./Utils/AuthRoute";
import MainLayout from "./MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/metrics" element={<ProtectedRoute><Metrics /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/lb/:id" element={<ProtectedRoute><LoadBalancerDetail /></ProtectedRoute>} />
            <Route path="/lb/:id/edit" element={<ProtectedRoute><LoadBalancerDetail /></ProtectedRoute>} />
            <Route path="/lb/:id/metrics" element={<ProtectedRoute><LoadBalancerMetrics /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
