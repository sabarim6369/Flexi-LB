import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import axios from 'axios';
import { apiurl } from './../api';
import Lottie from "lottie-react";
import loginAnimation from "@/Lottie/login.json";
export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();

  if (email && password) {
    setIsLoading(true);
    try {
      const res = await axios.post(`${apiurl}/auth/login`, {
        email,
        password,
      });

      if (res.data) {
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }

        toast.success("Login successful 🎉");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Invalid credentials or server error ❌");
    } finally {
      setIsLoading(false);
    }
  } else {
    toast.warning("Please enter email and password ⚠️");
  }
};

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side with Lottie animation */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-r from-blue-600 to-primary flex-col items-center justify-center p-12 relative">
        <div className="absolute top-8 left-8 flex items-center space-x-2">
          <Activity className="h-8 w-8 text-white" />
          <h1 className="text-2xl font-bold text-white">FlexiLB</h1>
        </div>
        
        <div className="w-full max-w-lg">
          <Lottie 
            animationData={loginAnimation} 
            loop={true}
            className="w-full h-auto"
          />
        </div>
        
        <div className="mt-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Intelligent Load Balancing</h2>
          <p className="text-white/80 text-lg">
            Distribute your traffic efficiently with our advanced load balancing solution
          </p>
        </div>
        
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white/70">© 2025 FlexiLB. All rights reserved.</p>
        </div>
      </div>
      
      {/* Right side with login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-b from-background to-background/70">
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/90 backdrop-blur-md rounded-xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-secondary"></div>
          
          <CardHeader className="text-center pb-8 pt-10">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="bg-primary/10 p-3.5 rounded-full shadow-lg">
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">Welcome Back</CardTitle>
            <CardDescription className="text-text-secondary mt-2 text-base">
              Sign in to your FlexiLB dashboard
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 px-8">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 py-6 bg-input border-border focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-lg shadow-sm transition-all"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 py-6 bg-input border-border focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-lg shadow-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <div className="relative flex items-center">
                    <input type="checkbox" className="sr-only peer" id="remember" />
                    <div className="h-4 w-4 rounded border border-muted-foreground peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 h-3 w-3 scale-0 peer-checked:scale-75 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3 text-white stroke-[4px]">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  <span className="text-text-secondary">Remember me</span>
                </label>
                <Link to="#" className="text-primary hover:text-secondary transition-colors font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-5 px-8 pb-10 pt-2">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-secondary text-primary-foreground font-semibold py-6 text-base rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </div>
                ) : "Sign In"}
              </Button>
              
              <div className="text-center text-sm text-text-secondary mt-2">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:text-secondary font-medium transition-colors hover:underline">
                  Create an account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}