import { useState } from "react";
import { Plus, X, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CreateLBModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    instances: [{ url: "", weight: 1 }],
    algorithm: "round_robin",
  });

  const addInstance = () => {
    setFormData((prev) => ({
      ...prev,
      instances: [...prev.instances, { url: "", weight: 1 }],
    }));
  };

  const removeInstance = (index) => {
    setFormData((prev) => ({
      ...prev,
      instances: prev.instances.filter((_, i) => i !== index),
    }));
  };

  const updateInstance = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      instances: prev.instances.map((inst, i) =>
        i === index ? { ...inst, [field]: value } : inst
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData); // send to backend
    onClose();
    // Reset form
    setFormData({
      name: "",
      instances: [{ url: "", weight: 1 }],
      algorithm: "round_robin",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Create New Load Balancer
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Configure your load balancer with instances and algorithm.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* LB Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Load Balancer Name
              </Label>
              <Input
                id="name"
                placeholder="Enter a name for your load balancer"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            {/* Algorithm */}
            <div className="space-y-2">
              <Label htmlFor="algorithm" className="text-foreground">
                Algorithm
              </Label>
              <Select
                value={formData.algorithm}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, algorithm: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select algorithm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">Round Robin (default)</SelectItem>
                  <SelectItem value="least_conn">Least Connections</SelectItem>
                  <SelectItem value="ip_hash">IP Hash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Instances */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Server Instances</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInstance}
                  className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Instance
                </Button>
              </div>

              <div className="space-y-3">
                {formData.instances.map((instance, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-muted rounded-lg border border-border"
                  >
                    <div className="bg-primary/10 p-2 rounded">
                      <Server className="h-4 w-4 text-primary" />
                    </div>

                    {/* URL Input */}
                    <Input
                      placeholder="http://localhost:5001"
                      value={instance.url}
                      onChange={(e) =>
                        updateInstance(index, "url", e.target.value)
                      }
                      required
                    />

                    {/* Weight Input */}
                    <Input
                      type="number"
                      min="1"
                      className="w-20"
                      placeholder="Weight"
                      value={instance.weight}
                      onChange={(e) =>
                        updateInstance(index, "weight", Number(e.target.value))
                      }
                      required
                    />

                    {formData.instances.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInstance(index)}
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
