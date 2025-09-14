import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { Settings, Clock, Shield, Server, Activity, AlertCircle } from "lucide-react";
import axiosInstance from "../Utils/axiosInstance";
import { apiurl } from "../api";
import { toast } from "sonner";

const Ratelimiter = () => {
  const [loadBalancers, setLoadBalancers] = useState([]);
  const [selectedLB, setSelectedLB] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [limit, setLimit] = useState("");
  const [window, setWindow] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLBs = async () => {
      try {
        const res = await axiosInstance.get(`${apiurl}/lbs/ratelimiter/status`);
        if (res.data && Array.isArray(res.data.lbs)) {
          setLoadBalancers(res.data.lbs);
        }
      } catch (err) {
        setError("Failed to fetch load balancers");
      }
    };
    fetchLBs();
  }, []);

  const openModal = (lb) => {
    setSelectedLB(lb);
    setShowModal(true);
    setLimit("");
    setWindow("");
    setError("");
  };

  const handleSetRateLimit = async () => {
    if (!limit || isNaN(Number(limit)) || !window || isNaN(Number(window))) {
      setError("Please enter valid values for both fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axiosInstance.post(`${apiurl}/lbs/${selectedLB._id}/ratelimit`, {
        limit: Number(limit),
        window: Number(window)
      });   
      setShowModal(false);
      toast.success(`Rate limit set successfully for ${selectedLB.name}`);
      setLimit("");
      setWindow("");
    } catch (e) {
      setError("Failed to set rate limit");
      toast.error("Failed to set rate limit");
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rate Limiter</h1>
              <p className="text-gray-600 mt-1">Configure request rate limits for your load balancers</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-4">
                    <Server className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Load Balancers</p>
                    <p className="text-2xl font-bold text-gray-900">{loadBalancers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mr-4">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Instances</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loadBalancers.reduce((sum, lb) => sum + (lb.instances?.filter(i => i.isHealthy)?.length || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-4">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rate Limits Configured</p>
                    <p className="text-2xl font-bold text-gray-900">{loadBalancers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Load Balancers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loadBalancers.length > 0 ? (
              loadBalancers.map(lb => (
                <Card key={lb._id} className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                          <Server className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">{lb.name}</CardTitle>
                          <CardDescription className="text-gray-600">{lb.endpoint}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${(lb.instances?.length || 0) > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-500">
                          {(lb.instances?.length || 0) > 0 ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Algorithm</p>
                        <p className="font-semibold text-gray-900 mt-1">{lb.algorithm}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Instances</p>
                        <p className="font-semibold text-gray-900 mt-1">{lb.instances?.length || 0}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        <Activity className="h-3 w-3 mr-1" />
                        {lb.instances?.filter(i => i.isHealthy)?.length || 0} Healthy
                      </Badge>
                    </div>

                    <Dialog open={showModal && selectedLB?._id === lb._id} onOpenChange={setShowModal}>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={() => openModal(lb)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure Rate Limit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-semibold text-gray-900">
                            Set Rate Limit
                          </DialogTitle>
                          <p className="text-gray-600">
                            Configure rate limiting for <span className="font-medium text-blue-600">{selectedLB?.name}</span>
                          </p>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="limit" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Request Limit
                            </Label>
                            <Input
                              id="limit"
                              type="number"
                              placeholder="e.g., 100"
                              value={limit}
                              onChange={e => setLimit(e.target.value)}
                              className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500">Maximum number of requests allowed</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="window" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Time Window (seconds)
                            </Label>
                            <Input
                              id="window"
                              type="number"
                              placeholder="e.g., 60"
                              value={window}
                              onChange={e => setWindow(e.target.value)}
                              className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500">Time period for the rate limit (in seconds)</p>
                          </div>

                          {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-700">{error}</span>
                            </div>
                          )}

                          <div className="flex gap-3 pt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => setShowModal(false)} 
                              disabled={loading}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleSetRateLimit} 
                              disabled={loading}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {loading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Setting...
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Set Rate Limit
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card className="border border-gray-200">
                  <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                      <Server className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Load Balancers Available
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                      You haven't created any load balancers yet. Create your first load balancer to start configuring rate limits.
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Go to Dashboard
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Ratelimiter;
