import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Activity, TrendingUp, Server, Globe, Clock, AlertTriangle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";

const mockMetricsData = {
  1: {
    name: "Production API Gateway",
    endpoint: "https://api.example.com",
    status: "active",
    metrics: {
      totalRequests: 12543,
      requestsToday: 2847,
      avgLatency: 89,
      errorRate: 1.2,
      uptime: 99.9,
      bandwidth: 2.4, // GB
      peakRPM: 245,
      successRate: 98.8,
      instances: { active: 3, total: 3 }
    },
    hourlyRequests: [120, 145, 178, 203, 189, 234, 267, 298, 276, 245, 218, 198, 167, 145, 123, 134, 156, 189, 223, 234, 245, 267, 234, 198],
    serverMetrics: [
      { id: 1, url: "server1.example.com", requests: 4200, latency: 85, status: "active" },
      { id: 2, url: "server2.example.com", requests: 4180, latency: 92, status: "active" },
      { id: 3, url: "server3.example.com", requests: 4163, latency: 91, status: "active" }
    ]
  },
  2: {
    name: "Development Environment",
    endpoint: "https://dev-api.example.com", 
    status: "active",
    metrics: {
      totalRequests: 2341,
      requestsToday: 456,
      avgLatency: 156,
      errorRate: 3.8,
      uptime: 98.5,
      bandwidth: 0.8,
      peakRPM: 89,
      successRate: 96.2,
      instances: { active: 1, total: 2 }
    },
    hourlyRequests: [45, 52, 61, 58, 67, 73, 68, 72, 69, 64, 58, 51, 46, 43, 38, 42, 48, 55, 61, 68, 72, 69, 63, 57],
    serverMetrics: [
      { id: 1, url: "dev-server1.example.com", requests: 2341, latency: 156, status: "active" },
      { id: 2, url: "dev-server2.example.com", requests: 0, latency: 0, status: "inactive" }
    ]
  }
};

export default function LoadBalancerMetrics() {
  const { id } = useParams();
  const lbData = mockMetricsData[id];

  if (!lbData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground">Load Balancer Not Found</h1>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case "active": return "bg-success text-success-foreground";
      case "warning": return "bg-warning text-warning-foreground";
      case "error": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getLatencyColor = (latency) => {
    if (latency < 100) return "text-success";
    if (latency < 200) return "text-warning";
    return "text-destructive";
  };

  const getErrorRateColor = (rate) => {
    if (rate < 2) return "text-success";
    if (rate < 5) return "text-warning";
    return "text-destructive";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{lbData.name} - Metrics</h1>
              <p className="text-text-secondary mt-1">Real-time performance monitoring and analytics</p>
            </div>
          </div>
          <Badge className={`${getStatusColor(lbData.status)} capitalize text-sm px-3 py-1`}>
            {lbData.status}
          </Badge>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Requests</p>
                  <p className="text-2xl font-bold text-foreground">{lbData.metrics.totalRequests.toLocaleString()}</p>
                  <p className="text-xs text-text-secondary mt-1">Today: {lbData.metrics.requestsToday}</p>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Avg Latency</p>
                  <p className={`text-2xl font-bold ${getLatencyColor(lbData.metrics.avgLatency)}`}>
                    {lbData.metrics.avgLatency}ms
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Peak RPM: {lbData.metrics.peakRPM}</p>
                </div>
                <div className="bg-secondary/10 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Success Rate</p>
                  <p className="text-2xl font-bold text-success">{lbData.metrics.successRate}%</p>
                  <p className="text-xs text-text-secondary mt-1">Error: {lbData.metrics.errorRate}%</p>
                </div>
                <div className="bg-success/10 p-2 rounded-full">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Uptime</p>
                  <p className="text-2xl font-bold text-success">{lbData.metrics.uptime}%</p>
                  <p className="text-xs text-text-secondary mt-1">Bandwidth: {lbData.metrics.bandwidth}GB</p>
                </div>
                <div className="bg-success/10 p-2 rounded-full">
                  <Activity className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request Graph Simulation */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Request Volume (Last 24 Hours)
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Hourly request distribution and traffic patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end space-x-1 h-32">
                {lbData.hourlyRequests.map((requests, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="bg-primary w-full rounded-t-sm transition-all duration-300 hover:bg-secondary"
                      style={{ height: `${(requests / Math.max(...lbData.hourlyRequests)) * 100}%` }}
                      title={`${requests} requests at ${index}:00`}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-text-secondary">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server Instance Metrics */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Server Instance Performance</CardTitle>
            <CardDescription className="text-text-secondary">
              Individual server metrics and health status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lbData.serverMetrics.map((server) => (
                <div key={server.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Server className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{server.url}</h4>
                        <p className="text-sm text-text-secondary">Server Instance #{server.id}</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(server.status)} capitalize`}>
                      {server.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">Requests Handled</span>
                        <span className="text-sm font-medium text-foreground">{server.requests.toLocaleString()}</span>
                      </div>
                      <Progress value={server.status === 'active' ? (server.requests / Math.max(...lbData.serverMetrics.map(s => s.requests))) * 100 : 0} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">Response Time</span>
                        <span className={`text-sm font-medium ${getLatencyColor(server.latency)}`}>
                          {server.latency}ms
                        </span>
                      </div>
                      <Progress value={server.status === 'active' ? Math.min((server.latency / 300) * 100, 100) : 0} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">Load Distribution</span>
                        <span className="text-sm font-medium text-foreground">
                          {server.status === 'active' ? 
                            `${((server.requests / lbData.metrics.totalRequests) * 100).toFixed(1)}%` : 
                            '0%'
                          }
                        </span>
                      </div>
                      <Progress value={server.status === 'active' ? (server.requests / lbData.metrics.totalRequests) * 100 : 0} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}