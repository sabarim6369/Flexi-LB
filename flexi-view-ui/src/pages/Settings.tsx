import { User, Bell, Shield, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/Sidebar";

export default function Settings() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
        <div className="w-64 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Main Content - scrollable */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto h-screen">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-text-secondary mt-1">
            Manage your account and application preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <Card className="shadow-sm border-border">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-semibold text-foreground">Profile</CardTitle>
              </div>
              <CardDescription className="text-text-secondary">
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <Input id="name" placeholder="Your full name" className="bg-input border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  className="bg-input border-border"
                />
              </div>
              <Button className="bg-primary hover:bg-secondary text-primary-foreground">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="shadow-sm border-border">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-semibold text-foreground">Notifications</CardTitle>
              </div>
              <CardDescription className="text-text-secondary">
                Configure your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Email Alerts</p>
                  <p className="text-sm text-text-secondary">Receive email notifications for critical events</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Server Down Alerts</p>
                  <p className="text-sm text-text-secondary">Get notified when servers go offline</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Performance Alerts</p>
                  <p className="text-sm text-text-secondary">Alerts for latency and error rate thresholds</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Weekly Reports</p>
                  <p className="text-sm text-text-secondary">Weekly performance summary emails</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="shadow-sm border-border">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-semibold text-foreground">Security</CardTitle>
              </div>
              <CardDescription className="text-text-secondary">
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-foreground">Current Password</Label>
                <Input id="currentPassword" type="password" className="bg-input border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-foreground">New Password</Label>
                <Input id="newPassword" type="password" className="bg-input border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" className="bg-input border-border" />
              </div>
              <Button className="bg-primary hover:bg-secondary text-primary-foreground">
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* API Settings (Under Development) */}
          <Card className="shadow-sm border-border opacity-70 pointer-events-none relative">
            <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded z-10">
              Under Development
            </div>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-semibold text-foreground">API Configuration</CardTitle>
              </div>
              <CardDescription className="text-text-secondary">
                Configure API access and webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-foreground">API Key</Label>
                <div className="flex space-x-2">
                  <Input id="apiKey" value="lb_1234567890abcdef" readOnly className="bg-muted border-border" />
                  <Button variant="outline" size="sm">Regenerate</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookUrl" className="text-foreground">Webhook URL</Label>
                <Input id="webhookUrl" placeholder="https://your-app.com/webhook" className="bg-input border-border" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Enable Webhooks</p>
                  <p className="text-sm text-text-secondary">Send events to your webhook endpoint</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
