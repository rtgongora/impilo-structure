import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, EyeOff, Shield, Wrench, AlertTriangle, Terminal } from "lucide-react";
import impiloLogo from "@/assets/impilo-logo.png";

interface SystemMaintenanceAuthProps {
  onBack: () => void;
}

export const SystemMaintenanceAuth: React.FC<SystemMaintenanceAuthProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        toast.error("Login failed", { description: authError.message });
        return;
      }

      // Verify user has system admin or dev_tester role
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id);

      if (rolesError) {
        console.error("Error checking roles:", rolesError);
      }

      const hasSystemRole = userRoles?.some(r => 
        (r.role as string) === 'admin' || (r.role as string) === 'dev_tester'
      );

      if (!hasSystemRole) {
        // Sign out if not authorized for system maintenance
        await supabase.auth.signOut();
        toast.error("Access Denied", { 
          description: "This login is restricted to platform administrators and developers." 
        });
        return;
      }

      const roleLabel = userRoles?.find(r => (r.role as string) === 'dev_tester') 
        ? 'Dev/Tester' 
        : 'System Admin';

      toast.success(`Welcome, ${roleLabel}!`, { 
        description: "System maintenance access granted." 
      });

      navigate("/");
    } catch (error) {
      console.error("System login error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick login for dev account
  const handleDevQuickLogin = async () => {
    setIsSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: "dev@impilo.health",
        password: "DevTest2025!",
      });

      if (authError) {
        toast.error("Dev login failed", { description: authError.message });
        return;
      }

      toast.success("Dev Mode Activated", { 
        description: "Zero-restriction access enabled." 
      });

      navigate("/");
    } catch (error) {
      console.error("Dev login error:", error);
      toast.error("Dev account not configured");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <img src={impiloLogo} alt="Impilo" className="h-10 w-auto" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
            <Wrench className="h-3 w-3 mr-1" />
            System Maintenance
          </Badge>
        </div>
        <CardTitle className="text-2xl font-display">Platform Access</CardTitle>
        <CardDescription>For platform administrators and developers only</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-700">Restricted Access</p>
              <p className="text-amber-600/80 mt-1">
                This login bypasses standard access controls. All actions are logged.
              </p>
            </div>
          </div>
        </div>

        {/* Dev Quick Login */}
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Dev/Test Account</p>
                <p className="text-xs text-muted-foreground">Zero-restriction access</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleDevQuickLogin}
              disabled={isSubmitting}
            >
              Quick Login
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or sign in manually</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="system-email" className="text-sm font-medium">Admin Email</Label>
            <Input
              id="system-email"
              type="email"
              placeholder="admin@impilo.health"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="system-password" className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Input
                id="system-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Authenticating...
                </div>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Access System
                </>
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

        <div className="text-center text-xs text-muted-foreground pt-2">
          <p>Platform SuperUser roles: <span className="font-medium">Superadmin</span>, <span className="font-medium">Auditor</span>, <span className="font-medium">Dev/Tester</span></p>
        </div>
      </CardContent>
    </Card>
  );
};
