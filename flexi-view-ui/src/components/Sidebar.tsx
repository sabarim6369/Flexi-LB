import { useState, useEffect } from "react";
import { Plus, Server, Activity, AlertCircle, Globe, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", icon: Activity, path: "/dashboard" },
    { name: "Load Balancers", icon: Server, path: "/lbs" },
    { name: "Metrics", icon: Globe, path: "/metrics" },
    { name: "Alerts", icon: AlertCircle, path: "/alerts" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];


  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sidebar content
  const sidebarContent = (
    <aside
      className={`bg-background border-r border-border h-screen p-4 flex flex-col justify-between transition-all duration-300
        ${isCollapsed && !isMobile ? "w-20" : "w-64"}
        ${isMobile ? "fixed top-0 left-0 z-50 h-full shadow-xl" : ""}
      `}
    >
      <div>
        {/* Logo / Title */}
        <div className="flex items-center justify-between mb-10 mt-4">
          {!isCollapsed && <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-wide">FlexiLB</h2>}
          {!isMobile && (
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded hover:bg-secondary/20 transition">
              {isCollapsed ? "→" : "←"}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col space-y-3 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                className={`flex items-center gap-3 p-2 rounded transition
                  ${isActive ? "bg-blue-500 text-white font-semibold" : "text-foreground hover:bg-primary/10 font-normal"}`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-foreground"}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile + Sign Out */}
      {!isCollapsed && !isMobile && (
        <div className="mt-auto flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-lg font-bold">
            P
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/80 transition w-full justify-center">
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Hamburger for Mobile */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded bg-primary text-white shadow-md"
        >
          ☰
        </button>
      )}

      {/* Sidebar Overlay on Mobile */}
      {isMobile ? (
        <div
          className={`fixed inset-0 z-40 transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
          {/* Overlay background */}
          {mobileOpen && (
            <div
              className="fixed inset-0 bg-black/30"
              onClick={() => setMobileOpen(false)}
            />
          )}
        </div>
      ) : (
        sidebarContent
      )}
    </>
  );
}
