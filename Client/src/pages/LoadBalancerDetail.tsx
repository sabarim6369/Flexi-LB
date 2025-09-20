import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, Server, Edit, Trash2, Plus, Activity, AlertCircle, 
  CheckCircle, XCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/ui/layout";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import useLBStore from './../Zustand-Store/useLBStore';
import { apiurl } from './../api';
import axiosInstance from './../Utils/axiosInstance';
import { toast } from "sonner";

const mockLoadBalancer = {
  id: 1,
  name: "Production API Gateway",
  endpoint: "https://api.example.com",
  status: "active",
  created: "2024-01-15",
  lastUpdated: "2 minutes ago",
  instances: [],
  algorithm:"",
};

export default function LoadBalancerDetail() {
  const { id } = useParams();
  const { loadBalancers, setLoadBalancers, updateLoadBalancer } = useLBStore();

  const [lbData, setLbData] = useState({ ...mockLoadBalancer });
  const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
  const [isEditingLB, setIsEditingLB] = useState(false);
  const [newServer, setNewServer] = useState({ url: "", weight: 1 ,instancename:""});
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [editingServerData, setEditingServerData] = useState({ url: "", weight: 1,instancename:"" });

  // useEffect(() => {
  //   const lb = loadBalancers.find((lb) => lb.id.toString() === id);
  //   if (lb) setLbData(lb);
  // }, [loadBalancers, id]);
useEffect(() => {
  const fetchLB = async () => {
    try {
      const res = await axiosInstance.get(`${apiurl}/lbs/${id}`);
      console.log(res);
      if (res.data.lb) {
        setLbData(res.data.lb); // update local state
        setLoadBalancers(prev => [...prev, res.data.lb]); // optionally update store
      }
    } catch (err) {
      toast.error("Error fetching Load Balancer");
    }
  };

  fetchLB();
}, [id, setLoadBalancers]);


  const getServerStatusIcon = (status) => {
    switch(status) {
      case "active": return <CheckCircle className="h-4 w-4 text-success" />;
      case "inactive": return <XCircle className="h-4 w-4 text-destructive" />;
      case "warning": return <AlertCircle className="h-4 w-4 text-warning" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getServerStatusBadge = (status) => {
    const variants = {
      active: "bg-success text-success-foreground",
      inactive: "bg-destructive text-destructive-foreground",
      warning: "bg-warning text-warning-foreground"
    };
    return variants[status] || "bg-muted text-muted-foreground";
  };

  const handleAddServer = async () => {
    if (!newServer.url) return;
    try {
      console.log(newServer.instancename)
      const res = await axiosInstance.post(`${apiurl}/lbs/${id}/instances`, {
        url: newServer.url,
        weight: newServer.weight,
        instancename:newServer.instancename
      });
     
      if (res.data.lb) {
        setLbData(res.data.lb);
        // updateLoadBalancer(lbData.id, res.data.lb);
        setNewServer({ url: "", weight: 1 ,instancename:""});
        setIsAddServerModalOpen(false);
        toast.success("Server added successfully");
      }
    } catch (err) {
    // Check if the error is an Axios error and has a response
    if (err.response) {
      if (err.response.status === 400) {
        toast.error(err.response.data.message || "Server name already exists");
      } else {
        toast.error(err.response.data.message || "Failed to add server instance");
      }
    } else {
      toast.error("Failed to add server instance");
    }
  }
};

 const handleUpdateServer = async (serverId: string) => {
  try {
    const res = await axiosInstance.put(
      `${apiurl}/lbs/${lbData.id}/instances`,
      {
        id: serverId,
        url: editingServerData.url,
        weight: editingServerData.weight,
        instancename: editingServerData.instancename
      }
    );

    if (res.data.lb) {
      setLbData(res.data.lb);
      updateLoadBalancer(lbData.id, res.data.lb);
      setEditingServerId(null);
      toast.success("Server updated successfully");
    }
  } catch (err: any) {
    console.error(err);
    // Show server response message if available
    const message =
      err.response?.data?.error || "Failed to update server instance";
    toast.error(message);
  }
};

  const handleRemoveServer = async (serverId: string) => {
    try {
      const res = await axiosInstance.delete(`${apiurl}/lbs/${lbData.id}/instances`, {
        data: { id: serverId }
      });
      if (res.data.lb) {
        setLbData(res.data.lb);
        updateLoadBalancer(lbData.id, res.data.lb);
        toast.success("Server removed successfully");
      }
    } catch (err) {
      toast.error("Failed to remove server instance");
    }
  };

  const handleUpdateLB = async () => {
  try {
    const res = await axiosInstance.put(`${apiurl}/lbs/${id}`, {
      name: lbData.name,
      endpoint: lbData.endpoint,
      algorithm: lbData.algorithm, // added
    });
    if (res.data.lb) {
      // updateLoadBalancer(lbData.id, res.data.lb);
      setLbData(res.data.lb);
      setIsEditingLB(false);
      toast.success("Load Balancer updated successfully");
    }
  } catch (err) {
    toast.error("Failed to update Load Balancer");
  }
};


  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                {isEditingLB ? (
  <>
    <Input
      value={lbData.name || ""}
      onChange={(e) => setLbData(prev => ({ ...prev, name: e.target.value }))}
      className="text-xl font-bold bg-input border-border"
    />
    <Input
      value={lbData.endpoint || ""}
      onChange={(e) => setLbData(prev => ({ ...prev, endpoint: e.target.value }))}
      className="text-text-secondary bg-input border-border mt-1"
    />
   <div className="mt-2">
  <Label htmlFor="algorithm" className="text-foreground">Algorithm</Label>
  <select
    id="algorithm"
    value={lbData.algorithm || "round-robin"}
    onChange={(e) =>
      setLbData((prev) => ({ ...prev, algorithm: e.target.value }))
    }
    className="w-full mt-1 p-2 border border-border rounded bg-input"
  >
    <option value="round-robin">Round Robin</option>
    <option value="least_conn">Least Connections</option>
    <option value="random">Random</option>
    <option value="ip-hash">IP Hash</option>
    <option value="weighted_round_robin">Weighted Round Robin</option>
    <option value="least_response_time">Least Response Time</option>
  </select>
</div>

  </>
) : (
  <>
    <CardTitle className="text-2xl font-bold text-foreground">{lbData.name || "Unknown LB"}</CardTitle>
    <CardDescription className="text-text-secondary">{lbData.endpoint || "-"}</CardDescription>
    <p className="mt-1 text-sm text-text-secondary capitalize">Algorithm: {lbData.algorithm || "round-robin"}</p>
  </>
)}

                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-success text-success-foreground">{lbData.status || "active"}</Badge>
                {isEditingLB ? (
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleUpdateLB}>Save</Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditingLB(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingLB(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-text-secondary">Created</p>
                <p className="font-medium text-foreground">{lbData.created || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Last Updated</p>
                <p className="font-medium text-foreground">{lbData.lastUpdated || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Servers</p>
                <p className="font-medium text-foreground">{(lbData.instances || []).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Server Instances</CardTitle>
                <CardDescription className="text-text-secondary">Manage server instances for this load balancer</CardDescription>
              </div>
              <Button 
                onClick={() => setIsAddServerModalOpen(true)}
                className="bg-primary hover:bg-secondary text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Server
              </Button>
            </div>
          </CardHeader>
       <CardContent>
  <div className="space-y-4">
    {(lbData.instances || []).map((server) => (
      <div
        key={server.id}
        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-card p-2 rounded-lg border border-border">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            {/* Server Name */}
            {editingServerId === server.id ? (
              <Input
                value={editingServerData.instancename}
                onChange={(e) =>
                  setEditingServerData((prev) => ({
                    ...prev,
                    instancename: e.target.value,
                  }))
                }
                className="font-medium text-foreground mb-1"
                placeholder="Server Name"
              />
            ) : (
              <p className="font-medium text-foreground">
                {server.instancename || "Unnamed Server"}
              </p>
            )}

            {/* URL + Status */}
            <div className="flex items-center space-x-2">
              {editingServerId === server.id ? (
                <Input
                  value={editingServerData.url}
                  onChange={(e) =>
                    setEditingServerData((prev) => ({
                      ...prev,
                      url: e.target.value,
                    }))
                  }
                  className="text-foreground"
                  placeholder="https://server.example.com"
                />
              ) : (
                <p className="text-sm text-text-secondary">{server.url}</p>
              )}
              {getServerStatusIcon(server.status)}
            </div>

            {/* Weight + Response */}
            <div className="flex items-center space-x-4 mt-1 text-sm text-text-secondary">
              {editingServerId === server.id ? (
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={editingServerData.weight}
                  onChange={(e) =>
                    setEditingServerData((prev) => ({
                      ...prev,
                      weight: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-16"
                />
              ) : (
                <>
                  <span>Weight: {server.weight}</span>
                  <span>Response: {server.responseTime}ms</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <Badge
            className={`${getServerStatusBadge(server.status)} capitalize`}
          >
            {server.status}
          </Badge>

          {editingServerId === server.id ? (
            <>
              <Button size="sm" onClick={() => handleUpdateServer(server.id)}>
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingServerId(null)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingServerId(server.id);
                setEditingServerData({
                  instancename: server.instancename,
                  url: server.url,
                  weight: server.weight,
                });
              }}
            >
              <Edit className="h-3 w-3 mr-1" /> Edit
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRemoveServer(server.id)}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    ))}
  </div>
</CardContent>

        </Card>

        <Dialog open={isAddServerModalOpen} onOpenChange={setIsAddServerModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-foreground">Add Server Instance</DialogTitle>
              <DialogDescription className="text-text-secondary">
                Add a new server instance to this load balancer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                 <div className="space-y-2">
                <Label htmlFor="servername" className="text-foreground">Server Name</Label>
                <Input
                  id="serverName"
                  placeholder="server-1"
                  value={newServer.instancename}
                  onChange={(e) => setNewServer(prev => ({ ...prev, instancename: e.target.value }))}
                  className="bg-input border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serverUrl" className="text-foreground">Server URL</Label>
                <Input
                  id="serverUrl"
                  placeholder="https://server.example.com"
                  value={newServer.url}
                  onChange={(e) => setNewServer(prev => ({ ...prev, url: e.target.value }))}
                  className="bg-input border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serverWeight" className="text-foreground">Weight</Label>
                <Input
                  id="serverWeight"
                  type="number"
                  min="1"
                  max="10"
                  value={newServer.weight}
                  onChange={(e) => setNewServer(prev => ({ ...prev, weight: parseInt(e.target.value) || 1 }))}
                  className="bg-input border-border focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <DialogFooter className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsAddServerModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddServer} className="bg-primary hover:bg-secondary text-primary-foreground">Add Server</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}