import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Server, Edit, Trash2, Plus, Activity, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/ui/layout";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const mockLoadBalancer = {
  id: 1,
  name: "Production API Gateway",
  endpoint: "https://api.example.com",
  status: "active",
  created: "2024-01-15",
  lastUpdated: "2 minutes ago",
  servers: [
    { id: 1, url: "https://server1.example.com", weight: 3, status: "active", responseTime: 89 },
    { id: 2, url: "https://server2.example.com", weight: 2, status: "active", responseTime: 92 },
    { id: 3, url: "https://server3.example.com", weight: 1, status: "inactive", responseTime: 0 },
  ]
};

export default function LoadBalancerDetail() {
  const { id } = useParams();
  const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
  const [isEditingLB, setIsEditingLB] = useState(false);
  const [lbData, setLbData] = useState(mockLoadBalancer);
  const [newServer, setNewServer] = useState({ url: "", weight: 1 });

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

  const handleAddServer = () => {
    if (newServer.url) {
      const server = {
        id: Date.now(),
        ...newServer,
        status: "active",
        responseTime: Math.floor(Math.random() * 200) + 50
      };
      setLbData(prev => ({
        ...prev,
        servers: [...prev.servers, server]
      }));
      setNewServer({ url: "", weight: 1 });
      setIsAddServerModalOpen(false);
    }
  };

  const handleRemoveServer = (serverId) => {
    setLbData(prev => ({
      ...prev,
      servers: prev.servers.filter(s => s.id !== serverId)
    }));
  };

  const handleUpdateLB = () => {
    setIsEditingLB(false);
    // In real app, would save to backend
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Load Balancer Info */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  {isEditingLB ? (
                    <Input
                      value={lbData.name}
                      onChange={(e) => setLbData(prev => ({ ...prev, name: e.target.value }))}
                      className="text-xl font-bold bg-input border-border"
                    />
                  ) : (
                    <CardTitle className="text-2xl font-bold text-foreground">{lbData.name}</CardTitle>
                  )}
                  {isEditingLB ? (
                    <Input
                      value={lbData.endpoint}
                      onChange={(e) => setLbData(prev => ({ ...prev, endpoint: e.target.value }))}
                      className="text-text-secondary bg-input border-border mt-1"
                    />
                  ) : (
                    <CardDescription className="text-text-secondary">{lbData.endpoint}</CardDescription>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-success text-success-foreground">Active</Badge>
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
                <p className="font-medium text-foreground">{lbData.created}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Last Updated</p>
                <p className="font-medium text-foreground">{lbData.lastUpdated}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Servers</p>
                <p className="font-medium text-foreground">{lbData.servers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server Instances */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Server Instances</CardTitle>
                <CardDescription className="text-text-secondary">
                  Manage server instances for this load balancer
                </CardDescription>
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
              {lbData.servers.map((server) => (
                <div key={server.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center space-x-4">
                    <div className="bg-card p-2 rounded-lg border border-border">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-foreground">{server.url}</p>
                        {getServerStatusIcon(server.status)}
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-text-secondary">
                        <span>Weight: {server.weight}</span>
                        <span>Response: {server.responseTime}ms</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getServerStatusBadge(server.status)} capitalize`}>
                      {server.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
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

        {/* Add Server Modal */}
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
              <Button variant="outline" onClick={() => setIsAddServerModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddServer} className="bg-primary hover:bg-secondary text-primary-foreground">
                Add Server
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}