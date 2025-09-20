import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Activity, ArrowRight, Shield, BarChart3, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  // Auto-redirect to login after a few seconds for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-primary/10 p-4 rounded-full">
                <Activity className="h-12 w-12 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                FlexiLB
              </span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg text-text-secondary mb-10">
              Professional load balancer management platform. Monitor, configure, and optimize your server infrastructure with ease.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" asChild className="bg-primary hover:bg-secondary text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl">
                <Link to="/login">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/signup">
                  Create Account
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-text-secondary mt-4">
              Redirecting to login in a few seconds...
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything you need to manage load balancers
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              FlexiLB provides a comprehensive dashboard to monitor and manage your load balancing infrastructure.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="shadow-sm border-border text-center">
              <CardHeader>
                <div className="bg-primary/10 p-3 rounded-lg w-fit mx-auto mb-4">
                  <Server className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">Load Balancer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-text-secondary">
                  Create, configure, and manage multiple load balancers with intuitive controls and real-time monitoring.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-border text-center">
              <CardHeader>
                <div className="bg-secondary/10 p-3 rounded-lg w-fit mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-text-secondary">
                  Track performance metrics, monitor latency, error rates, and get detailed insights into your infrastructure.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-border text-center">
              <CardHeader>
                <div className="bg-success/10 p-3 rounded-lg w-fit mx-auto mb-4">
                  <Shield className="h-8 w-8 text-success" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">Reliable & Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-text-secondary">
                  Enterprise-grade security with role-based access control and comprehensive audit logging.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
