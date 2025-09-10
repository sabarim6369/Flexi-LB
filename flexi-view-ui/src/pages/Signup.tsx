import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiurl } from './../api';
import { toast } from "sonner"
import axios from 'axios'
import Lottie from "lottie-react";
import loginAnimation from "@/Lottie/login.json";
export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const navigate = useNavigate();

 
const handleSubmit = async (e) => {
  e.preventDefault();

  if (
    formData.name &&
    formData.email &&
    formData.password &&
    formData.password === formData.confirmPassword
  ) {
    setIsLoading(true);
    try {
      const response = await axios.post(`${apiurl}/auth/signup`, {
        username: formData.name,
        email: formData.email,
        password: formData.password,
      });
      if (response.data.token) {
          localStorage.setItem("token", response.data.token);
      }

      console.log("Signup success:", response.data);
      toast.success("Signup successful 🎉");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed ❌");
      console.error(
        "Signup failed:",
        error.response?.data || error.message
      );
    } finally {
      setIsLoading(false);
    }
  } else {
    if (!formData.name || !formData.email || !formData.password) {
      toast.warning("Please fill in all required fields ⚠️");
    } else if (formData.password !== formData.confirmPassword) {
      toast.warning("Passwords do not match ⚠️");
    } else {
      toast.warning("Please check your form details ⚠️");
    }
    console.warn("Validation failed: Check your input fields");
  }
};

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side with Lottie animation */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-r from-purple-600 to-violet-700 flex-col items-center justify-center p-12 relative">
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
          <h2 className="text-3xl font-bold text-white mb-4">Join Our Network</h2>
          <p className="text-white/80 text-lg">
            Create your account and experience next-generation load balancing technology
          </p>
        </div>
        
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white/70">© 2025 FlexiLB. All rights reserved.</p>
        </div>
      </div>
      
      {/* Right side with signup form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-b from-background to-background/80">
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/90 backdrop-blur-md rounded-xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"></div>
          
          <CardHeader className="text-center pb-6 pt-10">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="bg-violet-500/10 p-3.5 rounded-full shadow-lg">
                <Activity className="h-8 w-8 text-violet-500" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">Join FlexiLB</CardTitle>
            <CardDescription className="text-text-secondary mt-2 text-base">
              Create your account to get started
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 px-8">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium">Full Name</Label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-violet-500 transition-colors" />
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="pl-12 py-6 bg-input border-border focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-lg shadow-sm transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-violet-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="pl-12 py-6 bg-input border-border focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-lg shadow-sm transition-all"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-violet-500 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="pl-12 py-6 bg-input border-border focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-lg shadow-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-muted-foreground hover:text-violet-500 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-violet-500 transition-colors" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    className="pl-12 py-6 bg-input border-border focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-lg shadow-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-muted-foreground hover:text-violet-500 transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="text-sm pt-2">
                <label className="flex items-start cursor-pointer">
                  <div className="relative flex items-center mt-0.5">
                    <input type="checkbox" className="sr-only peer" id="terms" required />
                    <div className="h-5 w-5 rounded border border-muted-foreground peer-checked:bg-violet-500 peer-checked:border-violet-500 transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 h-4 w-4 scale-0 peer-checked:scale-75 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 text-white stroke-[3px]">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  <span className="text-text-secondary ml-2">
                    I agree to the{" "}
                    <Link to="#" className="text-violet-500 hover:text-violet-600 font-medium hover:underline">Terms of Service</Link>
                    {" "}and{" "}
                    <Link to="#" className="text-violet-500 hover:text-violet-600 font-medium hover:underline">Privacy Policy</Link>
                  </span>
                </label>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-5 px-8 pb-10 pt-4">
              <Button 
                type="submit" 
                className="w-full bg-violet-600 hover:bg-violet-700 text-primary-foreground font-semibold py-6 text-base rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </div>
                ) : "Create Account"}
              </Button>
              
              <div className="text-center text-sm text-text-secondary mt-2">
                Already have an account?{" "}
                <Link to="/login" className="text-violet-500 hover:text-violet-600 font-medium transition-colors hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}