import { useEffect, useState } from "react";
import {
  Activity,
  TrendingUp,
  Server,
  Globe,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/ui/layout";
import axiosInstance from "./../Utils/axiosInstance";
import { Sidebar } from "@/components/Sidebar";
import { apiurl } from "./../api";
import Lottie from "lottie-react";
import loadingAnimation from "@/Lottie/Loader.json";

interface LoadBalancer {
  id: string;
  name: string;
  requests: number;
  latency: number;
  errorRate: number;
  uptime: number;
  status: string;
  instances: { active: number; total: number };
}

interface MetricsResponse {
  overview: {
    totalRequests: number;
    totalLBs: number;
    activeLBs: number;
    avgLatency: number;
    errorRate: number;
    uptime: number;
    instances: { active: number; total: number };
  };
  loadBalancers: LoadBalancer[];
}

export default function Metrics() {
  const [metricsData, setMetricsData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success text-success-foreground";
      case "warning":
        return "bg-warning text-warning-foreground";
      case "error":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return "text-success";
    if (latency < 200) return "text-warning";
    return "text-destructive";
  };

  const getErrorRateColor = (rate: number) => {
    if (rate < 2) return "text-success";
    if (rate < 5) return "text-warning";
    return "text-destructive";
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await axiosInstance.get(
          `${apiurl}/lbs/data/overallmetrics`
        );
        setMetricsData(res.data);
      } catch (err) {
        console.error("Error fetching metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

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

  if (!metricsData) {
    return (
      <div className="p-6 text-center text-destructive">
        Failed to load metrics
      </div>
    );
  }

  return (
    <div className="flex">
       <div className="w-64 h-screen sticky top-0">
    <Sidebar />
  </div>
      <div className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Metrics & Analytics
          </h1>
          <p className="text-text-secondary mt-1">
            Monitor performance and health of your load balancers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Requests</p>
                  <p className="text-2xl font-bold text-foreground">
                    {metricsData.overview.totalRequests.toLocaleString()}
                  </p>
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
                  <p className="text-2xl font-bold">
                    <span className="text-success">
                      {metricsData.overview.activeLBs}
                    </span>
                    /
                    <span className="text-muted-foreground">
                      {metricsData.overview.totalLBs}
                    </span>
                  </p>
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
                  <p
                    className={`text-2xl font-bold ${getLatencyColor(
                      metricsData.overview.avgLatency/1000
                    )}`}
                  >
  {(metricsData.overview.avgLatency / 1000).toFixed(1)} ms
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
                <p
  className={`text-2xl font-bold ${getErrorRateColor(
    metricsData.overview.errorRate * 100 // scale to %
  )}`}
>
{(metricsData.overview.avgLatency / 1000).toFixed(2)} ms
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
                  <p className="text-2xl font-bold text-success">
                    {metricsData.overview.uptime}%
                  </p>
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
                  <p className="text-2xl font-bold">
                    <span className="text-success">
                      {metricsData.overview.instances.active}
                    </span>
                    /
                    <span className="text-muted-foreground">
                      {metricsData.overview.instances.total}
                    </span>
                  </p>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <Server className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              Load Balancer Performance
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Detailed metrics for each load balancer instance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {metricsData.loadBalancers.map((lb) => (
                <div
                  key={lb.id}
                  className="p-4 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-foreground">
                        {lb.name}
                      </h3>
                      <Badge
                        className={`${getStatusColor(lb.status)} capitalize`}
                      >
                        {lb.status}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="text-success">
                        {lb.instances.active}
                      </span>
                      /
                      <span className="text-muted-foreground">
                        {lb.instances.total}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">
                          Requests
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {lb.requests.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={(lb.requests / 15000) * 100}
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">
                          Latency
                        </span>
                        <span
                          className={`text-sm font-medium ${getLatencyColor(
                            lb.latency
                          )}`}
                        >
                          {lb.latency}ms
                        </span>
                      </div>
                      <Progress
                        value={(lb.latency / 300) * 100}
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">
                          Error Rate
                        </span>
                        <span
                          className={`text-sm font-medium ${getErrorRateColor(
                            lb.errorRate
                          )}`}
                        >
                          {lb.errorRate}%
                        </span>
                      </div>
                      <Progress value={lb.errorRate * 10} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">
                          Uptime
                        </span>
                        <span className="text-sm font-medium text-success">
                          {lb.uptime}%
                        </span>
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
    </div>
  );
}
