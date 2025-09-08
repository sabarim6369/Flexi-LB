import { Activity, TrendingUp, Server, Globe, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/ui/layout";

const metricsData = {
  overview: {
    totalRequests: 45328,
    totalLBs: 4,
    activeLBs: 2,
    avgLatency: 127,
    errorRate: 2.3,
    uptime: 99.8
  },
  loadBalancers: [
    {
      id: 1,
      name: "Production API Gateway",
      requests: 12543,
      latency: 89,
      errorRate: 1.2,
      uptime: 99.9,
      status: "active",
      instances: { active: 3, total: 3 }
    },
    {
      id: 2,
      name: "Development Environment", 
      requests: 2341,
      latency: 156,
      errorRate: 3.8,
      uptime: 98.5,
      status: "active",
      instances: { active: 1, total: 2 }
    },
    {
      id: 3,
      name: "Staging Load Balancer",
      requests: 8932,
      latency: 203,
      errorRate: 5.2,
      uptime: 97.8,
      status: "warning",
      instances: { active: 2, total: 2 }
    }
  ]
};

export default function Metrics() {
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Metrics & Analytics</h1>
          <p className="text-text-secondary mt-1">Monitor performance and health of your load balancers</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Requests</p>
                  <p className="text-2xl font-bold text-foreground">{metricsData.overview.totalRequests.toLocaleString()}</p>
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
                  <p className="text-sm text-text-secondary">Active LBs</p>
                  <p className="text-2xl font-bold text-foreground">{metricsData.overview.activeLBs}/{metricsData.overview.totalLBs}</p>
                </div>
                <div className="bg-success/10 p-2 rounded-full">
                  <Activity className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Avg Latency</p>
                  <p className={`text-2xl font-bold ${getLatencyColor(metricsData.overview.avgLatency)}`}>
                    {metricsData.overview.avgLatency}ms
                  </p>
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
                  <p className="text-sm text-text-secondary">Error Rate</p>
                  <p className={`text-2xl font-bold ${getErrorRateColor(metricsData.overview.errorRate)}`}>
                    {metricsData.overview.errorRate}%
                  </p>
                </div>
                <div className="bg-warning/10 p-2 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Uptime</p>
                  <p className="text-2xl font-bold text-success">{metricsData.overview.uptime}%</p>
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
                  <p className="text-sm text-text-secondary">Instances</p>
                  <p className="text-2xl font-bold text-foreground">6/7</p>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <Server className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Load Balancer Performance</CardTitle>
            <CardDescription className="text-text-secondary">
              Detailed metrics for each load balancer instance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {metricsData.loadBalancers.map((lb) => (
                <div key={lb.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-foreground">{lb.name}</h3>
                      <Badge className={`${getStatusColor(lb.status)} capitalize`}>
                        {lb.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-text-secondary">
                      Instances: {lb.instances.active}/{lb.instances.total}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">Requests</span>
                        <span className="text-sm font-medium text-foreground">{lb.requests.toLocaleString()}</span>
                      </div>
                      <Progress value={(lb.requests / 15000) * 100} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">Latency</span>
                        <span className={`text-sm font-medium ${getLatencyColor(lb.latency)}`}>{lb.latency}ms</span>
                      </div>
                      <Progress value={(lb.latency / 300) * 100} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">Error Rate</span>
                        <span className={`text-sm font-medium ${getErrorRateColor(lb.errorRate)}`}>{lb.errorRate}%</span>
                      </div>
                      <Progress value={lb.errorRate * 10} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">Uptime</span>
                        <span className="text-sm font-medium text-success">{lb.uptime}%</span>
                      </div>
                      <Progress value={lb.uptime} className="h-2" />
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