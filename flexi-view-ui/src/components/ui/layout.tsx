import { Link, useLocation } from "react-router-dom";
import { Activity, BarChart3, Home, Settings, User } from "lucide-react";
import { Button } from "./button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Metrics", href: "/metrics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">FlexiLB</span>
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center space-x-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                Account
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">Logout</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}