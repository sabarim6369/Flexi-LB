import { useEffect, useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  Eye,
  Filter,
  Search,
  Clock,
  Server,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sidebar } from "@/components/Sidebar";
import axiosInstance from "./../Utils/axiosInstance";
import { apiurl } from "./../api";
import Lottie from "lottie-react";
import loadingAnimation from "@/Lottie/Loader.json";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  source: string;
  timestamp: string;
  status: "active" | "acknowledged" | "resolved";
  loadBalancerId?: string;
  loadBalancerName?: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-success" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "warning":
        return "bg-warning text-warning-foreground";
      case "info":
        return "bg-blue-500 text-white";
      case "success":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-destructive text-destructive-foreground";
      case "acknowledged":
        return "bg-warning text-warning-foreground";
      case "resolved":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await axiosInstance.patch(`${apiurl}/alerts/${alertId}/acknowledge`);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: "acknowledged" } : alert
      ));
    } catch (err) {
      console.error("Error acknowledging alert:", err);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await axiosInstance.patch(`${apiurl}/alerts/${alertId}/resolve`);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: "resolved" } : alert
      ));
    } catch (err) {
      console.error("Error resolving alert:", err);
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      await axiosInstance.delete(`${apiurl}/alerts/${alertId}`);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error("Error dismissing alert:", err);
    }
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // For now, using mock data since the API endpoint might not exist yet
        const mockAlerts: Alert[] = [
          {
            id: "1",
            type: "critical",
            title: "Load Balancer Down",
            message: "Load balancer 'Production-LB-01' is not responding. All traffic is being redirected to backup instances.",
            source: "Health Check Service",
            timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
            status: "active",
            loadBalancerId: "lb-1",
            loadBalancerName: "Production-LB-01"
          },
          {
            id: "2",
            type: "warning",
            title: "High Latency Detected",
            message: "Average response time for 'API-Gateway-LB' has exceeded 500ms threshold.",
            source: "Performance Monitor",
            timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
            status: "acknowledged",
            loadBalancerId: "lb-2",
            loadBalancerName: "API-Gateway-LB"
          },
          {
            id: "3",
            type: "warning",
            title: "Memory Usage High",
            message: "Memory usage on load balancer instances has reached 85%. Consider scaling up.",
            source: "Resource Monitor",
            timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
            status: "active",
            loadBalancerId: "lb-3",
            loadBalancerName: "Web-Frontend-LB"
          },
          {
            id: "4",
            type: "info",
            title: "Scheduled Maintenance",
            message: "Planned maintenance window for 'Dev-Environment-LB' starting in 2 hours.",
            source: "Maintenance Scheduler",
            timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
            status: "active",
            loadBalancerId: "lb-4",
            loadBalancerName: "Dev-Environment-LB"
          },
          {
            id: "5",
            type: "success",
            title: "Recovery Completed",
            message: "Load balancer 'Backup-LB-02' has been successfully restored and is now healthy.",
            source: "Auto Recovery",
            timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
            status: "resolved",
            loadBalancerId: "lb-5",
            loadBalancerName: "Backup-LB-02"
          }
        ];
        
        // Simulate API call delay
        setTimeout(() => {
          setAlerts(mockAlerts);
          setLoading(false);
        }, 1000);

        // Uncomment this when the actual API is available
        // const res = await axiosInstance.get(`${apiurl}/alerts`);
        // setAlerts(res.data);
      } catch (err) {
        console.error("Error fetching alerts:", err);
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || alert.type === filterType;
    const matchesStatus = filterStatus === "all" || alert.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const alertCounts = {
    total: alerts.length,
    critical: alerts.filter(a => a.type === "critical").length,
    warning: alerts.filter(a => a.type === "warning").length,
    active: alerts.filter(a => a.status === "active").length,
  };

  if (loading) {
    return (
      <div className="flex">
        <div className="w-64 h-screen sticky top-0">
          <Sidebar />
        </div>
        <div className="flex-1 flex justify-center items-center min-h-screen">
          <Lottie 
            animationData={loadingAnimation} 
            loop={true}
            style={{ width: 300, height: 300 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <div className="w-64 h-screen sticky top-0">
        <Sidebar />
      </div>
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Alerts & Notifications
          </h1>
          <p className="text-text-secondary mt-1">
            Monitor and manage system alerts and notifications
          </p>
        </div>

        {/* Alert Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Alerts</p>
                  <p className="text-2xl font-bold text-foreground">
                    {alertCounts.total}
                  </p>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Critical</p>
                  <p className="text-2xl font-bold text-destructive">
                    {alertCounts.critical}
                  </p>
                </div>
                <div className="bg-destructive/10 p-2 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Warnings</p>
                  <p className="text-2xl font-bold text-warning">
                    {alertCounts.warning}
                  </p>
                </div>
                <div className="bg-warning/10 p-2 rounded-full">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Active</p>
                  <p className="text-2xl font-bold text-destructive">
                    {alertCounts.active}
                  </p>
                </div>
                <div className="bg-destructive/10 p-2 rounded-full">
                  <Eye className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              Recent Alerts ({filteredAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No alerts found</p>
                <p className="text-sm">All systems are running smoothly</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.type === "critical"
                        ? "border-l-destructive bg-destructive/5"
                        : alert.type === "warning"
                        ? "border-l-warning bg-warning/5"
                        : alert.type === "info"
                        ? "border-l-blue-500 bg-blue-50"
                        : "border-l-success bg-success/5"
                    } bg-muted/30`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-foreground">
                              {alert.title}
                            </h3>
                            <Badge className={getAlertBadgeColor(alert.type)}>
                              {alert.type}
                            </Badge>
                            <Badge className={getStatusBadgeColor(alert.status)}>
                              {alert.status}
                            </Badge>
                          </div>
                          <p className="text-text-secondary mb-3">
                            {alert.message}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTimestamp(alert.timestamp)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Server className="h-4 w-4" />
                              <span>{alert.source}</span>
                            </div>
                            {alert.loadBalancerName && (
                              <div className="flex items-center space-x-1">
                                <Server className="h-4 w-4" />
                                <span>{alert.loadBalancerName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {alert.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledge(alert.id)}
                            className="text-xs"
                          >
                            Acknowledge
                          </Button>
                        )}
                        {alert.status !== "resolved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolve(alert.id)}
                            className="text-xs"
                          >
                            Resolve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(alert.id)}
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}