import { useState } from "react";
import { Plus, X, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CreateLBModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    endpoint: "",
    servers: [{ url: "", weight: 1 }]
  });

  const addServer = () => {
    setFormData(prev => ({
      ...prev,
      servers: [...prev.servers, { url: "", weight: 1 }]
    }));
  };

  const removeServer = (index) => {
    setFormData(prev => ({
      ...prev,
      servers: prev.servers.filter((_, i) => i !== index)
    }));
  };

  const updateServer = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      servers: prev.servers.map((server, i) => 
        i === index ? { ...server, [field]: value } : server
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
    // Reset form
    setFormData({
      name: "",
      endpoint: "",
      servers: [{ url: "", weight: 1 }]
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">Create New Load Balancer</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Configure your load balancer with server instances and endpoint settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Load Balancer Name</Label>
              <Input
                id="name"
                placeholder="Enter a name for your load balancer"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-input border-border focus:ring-primary focus:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint" className="text-foreground">Endpoint URL</Label>
              <Input
                id="endpoint"
                placeholder="https://your-loadbalancer.example.com"
                value={formData.endpoint}
                onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                className="bg-input border-border focus:ring-primary focus:border-primary"
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Server Instances</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addServer}
                  className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Server
                </Button>
              </div>

              <div className="space-y-3">
                {formData.servers.map((server, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg border border-border">
                    <div className="bg-primary/10 p-2 rounded">
                      <Server className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <Input
                          placeholder="https://server-url.com"
                          value={server.url}
                          onChange={(e) => updateServer(index, "url", e.target.value)}
                          className="bg-background border-border"
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm text-text-secondary whitespace-nowrap">Weight:</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={server.weight}
                          onChange={(e) => updateServer(index, "weight", parseInt(e.target.value) || 1)}
                          className="bg-background border-border w-20"
                        />
                      </div>
                    </div>
                    {formData.servers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeServer(index)}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex space-x-2 pt-4">
            <Button
              type="button" 
              variant="outline"
              onClick={onClose}
              className="border-border text-text-secondary hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-primary hover:bg-secondary text-primary-foreground"
            >
              Create Load Balancer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}