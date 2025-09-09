import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Server, Clock, TrendingUp, Activity, BarChart3, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import axiosInstance from './../Utils/axiosInstance';
import { apiurl } from './../api';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function LoadBalancerMetrics() {
  const { id } = useParams();
  const [lbData, setLbData] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const [metricsRes, hourlyRes] = await Promise.all([
          axiosInstance.get(`${apiurl}/lbs/${id}/metrics`),
          axiosInstance.get(`${apiurl}/lbs/${id}/hourlyreq`)
        ]);

        setLbData(metricsRes.data);

        // Transform hourly data to array of objects: [{ hour: 0, instance1: 10, instance2: 5 }, ...]
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const hourlyObj = hours.map(h => {
          const obj = { hour: h };
          hourlyRes.data.instances.forEach(inst => {
            obj[inst.id] = inst.hourlyRequests[h] || 0;
          });
          return obj;
        });
        setHourlyData(hourlyObj);

      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.error || err.message || "Error loading metrics";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy": return "bg-success text-success-foreground";
      case "degraded": return "bg-warning text-warning-foreground";
      case "slow": return "bg-destructive text-destructive-foreground";
      case "down": return "bg-muted text-muted-foreground";
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

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-text-secondary">Loading metrics...</p>
      </div>
    </Layout>
  );

  if (error || !lbData) return (
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
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
                <div className="bg-primary/10 p-2 rounded-full"><Globe className="h-5 w-5 text-primary" /></div>
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
                <div className="bg-secondary/10 p-2 rounded-full"><Clock className="h-5 w-5 text-secondary" /></div>
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
                <div className="bg-success/10 p-2 rounded-full"><TrendingUp className="h-5 w-5 text-success" /></div>
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
                <div className="bg-success/10 p-2 rounded-full"><Activity className="h-5 w-5 text-success" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hourly Requests Line Chart */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />Hourly Request Volume
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Requests per server instance in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                {lbData.instances.map((inst, idx) => (
                  <Line
                    key={inst.id}
                    type="monotone"
                    dataKey={inst.id}
                    stroke={`hsl(${(idx * 70) % 360}, 70%, 50%)`}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
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
                        <div className="bg-primary/10 p-2 rounded-lg"><Server className="h-4 w-4 text-primary" /></div>
                        <div>
                          <h4 className="font-medium text-foreground">{instance.url}</h4>
                            <h4 className="font-medium text-foreground">{instance.servername}</h4>

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
                          <span className="text-sm font-medium text-foreground">{instance.metrics.requests.toLocaleString()}</span>
                        </div>
                        <Progress value={(instance.metrics.requests / Math.max(...lbData.instances.map(i => i.metrics.requests))) * 100} className="h-2" />
                      </div>

                      {/* Latency */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-text-secondary">Last Response Time</span>
                          <span className={`text-sm font-medium ${getLatencyColor(instance.metrics.lastLatency)}`}>{instance.metrics.lastLatency}ms</span>
                        </div>
                        <Progress value={Math.min((instance.metrics.lastLatency / 300) * 100, 100)} className="h-2" />
                      </div>

                      {/* Error Rate */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-text-secondary">Error Rate</span>
                          <span className={`text-sm font-medium ${getErrorRateColor(errorRate)}`}>{errorRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(errorRate, 100)} className="h-2" />
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
