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
  
];

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // const [loadBalancers, setLoadBalancers] = useState(mockLoadBalancers);
    const { loadBalancers, setLoadBalancers, addLoadBalancer } = useLBStore();
      const [stats, setStats] = useState({
    activeLBs: 0,
    totalInstances: 0,
    totalRequests: 0,
    avgLatency: 0,
  });

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
      console.log("LB API Response:", res.data);

      if (res.data && Array.isArray(res.data.lbs)) {
        const apiLBs = res.data.lbs.map((lb) => ({
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
        setStats(res.data.stats || {});
      }
    } catch (error) {
      console.error("Error fetching LBs:", error);
      toast.error("Failed to load Load Balancers ❌");
      setLoadBalancers(mockLoadBalancers);
    }
  };

  getlbs();
}, []);


const handleCreateLB = async (newLB) => {
  try {
    const res = await axiosInstance.post(`${apiurl}/lbs`, {
      name: newLB.name,
      instances: newLB.instances,
      algorithm: newLB.algorithm,
    });

    if (res.data.lb) {
      const createdLB = res.data.lb;

      const lb = {
        id: createdLB._id,
        name: createdLB.name,
        endpoint: createdLB.endpoint,
        status: "active",
        instances: createdLB.instances,
        activeInstances: createdLB.instances.filter(i => i.isHealthy).length,
        totalRequests: 0,
        avgLatency: 0,
        lastUpdated: new Date(createdLB.updatedAt).toLocaleString(),
      };

      setLoadBalancers([...loadBalancers, lb]);
      toast.success("Load Balancer created successfully 🎉");

      return true; // indicate success
    }
  } catch (error: any) {
    console.error("Error creating LB:", error);
    toast.error(error.response?.data?.error || "Failed to create Load Balancer ❌");

    return false; // indicate failure
  }
};



const deleteitem = async (lbId: string) => {
  try {
    console.log(lbId)
    await axiosInstance.delete(`${apiurl}/lbs/${lbId}`);

    const updatedLBs = loadBalancers.filter(lb => lb.id !== lbId);
    setLoadBalancers(updatedLBs);

    toast.success("Load Balancer deleted successfully");
  } catch (err) {
    console.error("Error deleting LB:", err);
    toast.error("Failed to delete Load Balancer");
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
            <h1 className="text-3xl font-bold text-foreground">
              Load Balancers
            </h1>
            <p className="text-text-secondary mt-1">
              Manage and monitor your load balancer instances
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-secondary text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New LB
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-sm border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-success/10 p-2 rounded-full">
                  <Activity className="h-6 w-6 text-success" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">
                    Active LBs
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.activeLBs}
                  </p>
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
                  <p className="text-sm font-medium text-text-secondary">
                    Total Instances
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalInstances}
                  </p>
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
                  <p className="text-sm font-medium text-text-secondary">
                    Total Requests
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalRequests.toLocaleString()}
                  </p>
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
                  <p className="text-sm font-medium text-text-secondary">
                    Avg Latency
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.avgLatency}ms
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Load Balancers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.isArray(loadBalancers) && loadBalancers.length > 0 ? (
            loadBalancers.map((lb) => (
              <Card
                key={lb.id}
                className="shadow-sm border-border hover:shadow-md transition-all duration-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        {getStatusIcon(lb.status)}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {lb.name}
                        </CardTitle>
                        <CardDescription className="text-text-secondary">
                          {lb.endpoint}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={`${getStatusBadge(
                        lb.status
                      )} capitalize font-medium`}
                    >
                      {lb.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-text-secondary">Instances</p>
                      <p className="font-semibold text-foreground">
                        {lb.activeInstances}/{lb.instances.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary">Requests</p>
                      <p className="font-semibold text-foreground">
                        {lb.totalRequests.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary">Avg Latency</p>
                      <p className="font-semibold text-foreground">
                        {lb.avgLatency}ms
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary">Last Updated</p>
                      <p className="font-semibold text-foreground">
                        {lb.lastUpdated}
                      </p>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => deleteitem(lb.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="shadow-sm border-border">
                <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="bg-muted/30 p-4 rounded-full mb-6">
                    <Server className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No Load Balancers Available
                  </h3>
                  <p className="text-text-secondary mb-6 max-w-md">
                    You haven't created any load balancers yet. Get started by creating your first load balancer to manage your traffic distribution.
                  </p>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary hover:bg-secondary text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Load Balancer
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
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
