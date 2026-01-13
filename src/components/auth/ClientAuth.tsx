import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Eye, EyeOff, Phone, Mail, User, Check } from "lucide-react";
import impiloLogo from "@/assets/impilo-logo.png";

interface ClientAuthProps {
  onBack: () => void;
}

export const ClientAuth: React.FC<ClientAuthProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Password validation
  const passwordRequirements = [
    { label: "At least 8 characters", met: signupPassword.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(signupPassword) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(signupPassword) },
    { label: "Contains a number", met: /\d/.test(signupPassword) },
  ];

  const allRequirementsMet = passwordRequirements.every(r => r.met);
  const passwordsMatch = signupPassword === signupConfirmPassword && signupConfirmPassword.length > 0;

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error) {
        toast.error("Login failed", { description: error.message });
        return;
      }

      toast.success("Welcome back!", { description: "Redirecting to your health portal..." });
      navigate("/portal");
    } catch (error) {
      console.error("Client login error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleClientSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allRequirementsMet) {
      toast.error("Password doesn't meet requirements");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords don't match");
      return;
    }

    setIsSigningUp(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            display_name: fullName,
            phone: signupPhone,
            role: "client",
            is_client: true,
          },
        },
      });

      if (error) {
        toast.error("Signup failed", { description: error.message });
        return;
      }

      setSignupSuccess(true);
      toast.success("Account created!", { 
        description: "You can now log in to access your health portal." 
      });
    } catch (error) {
      console.error("Client signup error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSigningUp(false);
    }
  };

  if (signupSuccess) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display">Account Created!</CardTitle>
          <CardDescription className="text-base">
            Your patient account has been created successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            You can now log in to access your personal health portal, view your medical records, 
            book appointments, and manage your healthcare.
          </p>
          <div className="space-y-3 pt-2">
            <Button 
              onClick={() => {
                setSignupSuccess(false);
                setActiveTab("login");
                setLoginEmail(signupEmail);
              }}
              className="w-full h-12 text-base font-medium"
            >
              Continue to Login
            </Button>
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full h-12"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to login options
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <img src={impiloLogo} alt="Impilo" className="h-10 w-auto" />
        </div>
        <CardTitle className="text-2xl font-display">Patient Portal</CardTitle>
        <CardDescription>Access your personal health information</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleClientLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="client-email" className="text-sm font-medium">Email or Phone</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="h-12 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="client-password" className="text-sm font-medium">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                    onClick={() => navigate("/reset-password")}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="client-password"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium" 
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    "Sign In to Portal"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onBack}
                  className="w-full h-12"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login options
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleClientSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="full-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-phone" className="text-sm font-medium">Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+263 77 123 4567"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showSignupPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showSignupPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {signupPassword && (
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <div className={`h-1.5 w-1.5 rounded-full ${req.met ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                        <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  required
                  className="h-12"
                />
                {signupConfirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords don't match</p>
                )}
              </div>
              
              <div className="space-y-3 pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium" 
                  disabled={isSigningUp || !allRequirementsMet || !passwordsMatch}
                >
                  {isSigningUp ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                      Creating account...
                    </div>
                  ) : (
                    "Create Patient Account"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onBack}
                  className="w-full h-12"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login options
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground pt-2">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
