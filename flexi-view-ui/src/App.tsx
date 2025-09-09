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
import LoadBalancerDetail from "./pages/LoadBalancerDetail";
import LoadBalancerMetrics from "./pages/LoadBalancerMetrics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./Utils/Protectedroute";
import AuthRoute from "./Utils/AuthRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Index />} />

          {/* Login/Signup */}
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/metrics" element={<ProtectedRoute><Metrics /></ProtectedRoute>} />
          <Route path="/lb/:id" element={<ProtectedRoute><LoadBalancerDetail /></ProtectedRoute>} />
          <Route path="/lb/:id/edit" element={<ProtectedRoute><LoadBalancerDetail /></ProtectedRoute>} />
          <Route path="/lb/:id/metrics" element={<ProtectedRoute><LoadBalancerMetrics /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
