import { useState,useEffect} from "react";
import { Plus, Server, Activity, AlertCircle, Eye, Edit, Trash2, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateLBModal } from "@/components/modals/CreateLBModal";
import { Sidebar } from "@/components/Sidebar";
import { toast } from "sonner"
import { apiurl } from './../api';
import axiosInstance from './../Utils/axiosInstance';
import useLBStore from './../Zustand-Store/useLBStore';

const mockLoadBalancers = [
  // {
  //   id: 1,
  //   name: "Production API Gateway",
  //   endpoint: "https://api.example.com",
  //   status: "active",
  //   instances: 3,
  //   activeInstances: 3,
  //   totalRequests: 12543,
  //   avgLatency: 89,
  //   lastUpdated: "2 minutes ago"
  // },
  // {
  //   id: 2,
  //   name: "Development Environment",
  //   endpoint: "https://dev-api.example.com",
  //   status: "active",
  //   instances: 2,
  //   activeInstances: 1,
  //   totalRequests: 2341,
  //   avgLatency: 156,
  //   lastUpdated: "5 minutes ago"
  // },
  // {
  //   id: 3,
  //   name: "Staging Load Balancer",
  //   endpoint: "https://staging.example.com",
  //   status: "warning",
  //   instances: 2,
  //   activeInstances: 2,
  //   totalRequests: 8932,
  //   avgLatency: 203,
  //   lastUpdated: "1 hour ago"
  // },
  // {
  //   id: 4,
  //   name: "Analytics Service",
  //   endpoint: "https://analytics.example.com",
  //   status: "inactive",
  //   instances: 1,
  //   activeInstances: 0,
  //   totalRequests: 0,
  //   avgLatency: 0,
  //   lastUpdated: "3 hours ago"
  // }
];

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // const [loadBalancers, setLoadBalancers] = useState(mockLoadBalancers);
    const { loadBalancers, setLoadBalancers, addLoadBalancer } = useLBStore();

  // const handleCreateLB =async (newLB) => {
  //   const lb = {
  //     id: Date.now(),
  //     ...newLB,
  //     status: "active",
  //     instances: newLB.servers.length,
  //     activeInstances: newLB.servers.length,
  //     totalRequests: 0,
  //     avgLatency: 0,
  //     lastUpdated: "Just now"
  //   };
  //   const res=await axios.post(`${apiurl}/lbs`);
  //   setLoadBalancers(prev => [...prev, lb]);
  // };
 useEffect(() => {
  const getlbs = async () => {
    try {
      const res = await axiosInstance.get(`${apiurl}/lbs`);
      console.log(res);
      if (res.data && Array.isArray(res.data)) {
        const apiLBs = res.data.map((lb) => ({
          id: lb._id, 
          name: lb.name,
          endpoint: lb.endpoint,
          status: "active", 
          instances: lb.instances,
          activeInstances: lb.instances.filter(i => i.isHealthy).length,
          totalRequests: lb.instances.reduce((sum, i) => sum + (i.metrics?.requests || 0), 0),
          avgLatency: lb.instances.length > 0 
            ? Math.round(
                lb.instances.reduce((sum, i) => sum + (i.metrics?.totalLatencyMs || 0), 0) / lb.instances.length
              )
            : 0,
          lastUpdated: new Date(lb.updatedAt).toLocaleString(),
        }));


        setLoadBalancers([...mockLoadBalancers, ...apiLBs]);
      }
    } catch (error) {
      console.error("Error fetching LBs:", error);
      toast.error("Failed to load Load Balancers ❌");
      // Keep only mock if API fails
      setLoadBalancers(mockLoadBalancers);
    }
  };

  getlbs();
}, []);

  const handleCreateLB = async (newLB) => {
  const lb = {
    id: Date.now(),
    ...newLB,
    status: "active",
    instances: newLB.instances.length,
    activeInstances: newLB.instances.length,
    totalRequests: 0,
    avgLatency: 0,
    lastUpdated: "Just now"
  };

  try {
    const res = await axiosInstance.post(`${apiurl}/lbs`, {
      name: newLB.name,
      instances: newLB.instances,
      algorithm: newLB.algorithm,
    });

    if (res.data) {
      toast.success("Load Balancer created successfully 🎉");
setLoadBalancers([...loadBalancers, lb]);
    }
  } catch (error) {
    console.error("Error creating LB:", error);
    toast.error("Failed to create Load Balancer ❌");
  }
};


  const getStatusBadge = (status) => {
    const variants = {
      active: "bg-success text-success-foreground",
      warning: "bg-warning text-warning-foreground", 
      inactive: "bg-destructive text-destructive-foreground"
    };
    return variants[status] || variants.inactive;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "active": return <Activity className="h-4 w-4" />;
      case "warning": return <AlertCircle className="h-4 w-4" />;
      case "inactive": return <Server className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-background">

      {/* Sidebar */}
      {/* <div className="flex-shrink-0 w-64 bg-gray-50 border-r border-gray-200"> */}
        <Sidebar />
      {/* </div> */}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Load Balancers</h1>
            <p className="text-text-secondary mt-1">Manage and monitor your load balancer instances</p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-secondary text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New LB
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-sm border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-success/10 p-2 rounded-full">
                  <Activity className="h-6 w-6 text-success" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Active LBs</p>
                  <p className="text-2xl font-bold text-foreground">2</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Total Instances</p>
                  <p className="text-2xl font-bold text-foreground">8</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-warning/10 p-2 rounded-full">
                  <Globe className="h-6 w-6 text-warning" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Total Requests</p>
                  <p className="text-2xl font-bold text-foreground">23.8K</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-secondary/10 p-2 rounded-full">
                  <Activity className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Avg Latency</p>
                  <p className="text-2xl font-bold text-foreground">127ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Load Balancers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loadBalancers.map((lb) => (
            <Card key={lb.id} className="shadow-sm border-border hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      {getStatusIcon(lb.status)}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">{lb.name}</CardTitle>
                      <CardDescription className="text-text-secondary">{lb.endpoint}</CardDescription>
                    </div>
                  </div>
                  <Badge className={`${getStatusBadge(lb.status)} capitalize font-medium`}>
                    {lb.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-secondary">Instances</p>
                    <p className="font-semibold text-foreground">{lb.activeInstances}/{lb.instances.length}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Requests</p>
                    <p className="font-semibold text-foreground">{lb.totalRequests.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Avg Latency</p>
                    <p className="font-semibold text-foreground">{lb.avgLatency}ms</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Last Updated</p>
                    <p className="font-semibold text-foreground">{lb.lastUpdated}</p>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/lb/${lb.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/lb/${lb.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/lb/${lb.id}/metrics`}>
                      <Activity className="h-4 w-4 mr-1" />
                      Metrics
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <CreateLBModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateLB}
        />
      </main>
    </div>
  );
}
