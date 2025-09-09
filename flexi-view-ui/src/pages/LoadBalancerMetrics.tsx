import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Activity, TrendingUp, Server, Globe, Clock, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import axiosInstance from './../Utils/axiosInstance';
import { apiurl } from './../api';

export default function LoadBalancerMetrics() {
  const { id } = useParams();
  const [lbData, setLbData] = useState(null);
  const [hourlyData, setHourlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch main LB metrics ---
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axiosInstance.get(`${apiurl}/lbs/${id}/metrics`);
        setLbData(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || err.message || "Error loading metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [id]);

  // --- Fetch hourly requests per instance ---
  useEffect(() => {
    const fetchHourly = async () => {
      try {
        const res = await axiosInstance.get(`${apiurl}/lbs/${id}/hourlyreq`);
        setHourlyData(res.data.instances);
      } catch (err) {
        console.error("Hourly requests fetch error:", err);
      }
    };

    fetchHourly();
    const interval = setInterval(fetchHourly, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-success text-success-foreground";
      case "inactive": return "bg-muted text-muted-foreground";
      case "warning": return "bg-warning text-warning-foreground";
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-lg text-text-secondary">Loading metrics...</p>
        </div>
      </Layout>
    );
  }

  if (error || !lbData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive">Failed to Load Metrics</h1>
          <p className="text-text-secondary mt-2">{error}</p>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </Layout>
    );
  }

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
          {/* Total Requests */}
          <Card className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Requests</p>
                  <p className="text-2xl font-bold text-foreground">{lbData.metrics.totalRequests?.toLocaleString()}</p>
                  <p className="text-xs text-text-secondary mt-1">Today: {lbData.metrics.requestsToday}</p>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avg Latency */}
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

          {/* Success Rate */}
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

          {/* Uptime */}
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

        {/* Hourly Request Graph */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" /> Hourly Request Volume
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Requests per server instance in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hourlyData ? (
              <div className="flex space-x-2 h-32">
                {hourlyData.map((inst, idx) => {
                  const maxReq = Math.max(...inst.hourlyRequests, 1);
                  return (
                    <div key={inst.id} className="flex-1 flex flex-col items-center">
                      {inst.hourlyRequests.map((r, i) => (
                        <div
                          key={i}
                          title={`${r} requests at ${i}:00 - ${inst.url}`}
                          className="w-full mb-1 rounded-t-sm transition-all duration-300"
                          style={{
                            height: `${(r / maxReq) * 100}%`,
                            backgroundColor: `hsl(${(idx / hourlyData.length) * 360}, 70%, 50%)`,
                          }}
                        ></div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">Loading hourly requests...</p>
            )}

            {/* Legend */}
            {hourlyData && (
              <div className="flex flex-wrap mt-2 gap-4">
                {hourlyData.map((inst, idx) => (
                  <div key={inst.id} className="flex items-center space-x-1 text-xs">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(${(idx / hourlyData.length) * 360}, 70%, 50%)` }}
                    ></span>
                    <span>{inst.url}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-xs text-text-secondary mt-2">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </div>
          </CardContent>
        </Card>

        {/* Server Instances */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Server Instances</CardTitle>
            <CardDescription className="text-text-secondary">
              Individual server metrics and health status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lbData.instances.map((instance) => {
                const errorRate = instance.metrics.failures > 0
                  ? (instance.metrics.failures / instance.metrics.requests) * 100
                  : 0;

                return (
                  <div key={instance.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Server className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{instance.url}</h4>
                          <p className="text-sm text-text-secondary">Instance ID: {instance.id}</p>
                        </div>
                      </div>
                      <Badge className={`capitalize ${getStatusColor(instance.healthStatus)}`}>
                        {instance.healthStatus}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Requests */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-text-secondary">Requests Handled</span>
                          <span className="text-sm font-medium text-foreground">
                            {instance.metrics.requests.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={(instance.metrics.requests / Math.max(...lbData.instances.map(i => i.metrics.requests))) * 100}
                          className="h-2"
                        />
                      </div>

                      {/* Latency */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-text-secondary">Last Response Time</span>
                          <span className={`text-sm font-medium ${getLatencyColor(instance.metrics.lastLatency)}`}>
                            {instance.metrics.lastLatency}ms
                          </span>
                        </div>
                        <Progress
                          value={Math.min((instance.metrics.lastLatency / 300) * 100, 100)}
                          className="h-2"
                        />
                      </div>

                      {/* Error Rate */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-text-secondary">Error Rate</span>
                          <span className={`text-sm font-medium ${getErrorRateColor(errorRate)}`}>
                            {errorRate.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(errorRate, 100)}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
