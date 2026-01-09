import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProviderIdLookup } from "@/components/auth/ProviderIdLookup";
import { BiometricAuth } from "@/components/auth/BiometricAuth";
import { WorkspaceSelection, type WorkspaceSelectionData } from "@/components/auth/WorkspaceSelection";
import { type ProviderRegistryRecord, type FacilityRegistryRecord } from "@/services/registryServices";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fingerprint, Mail, Shield, ArrowLeft } from "lucide-react";
import impiloLogo from "@/assets/impilo-logo.png";

type AuthView = "method-select" | "lookup" | "biometric" | "workspace" | "email-login";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { setCurrentDepartment } = useWorkspace();

  const [view, setView] = useState<AuthView>("method-select");
  const [provider, setProvider] = useState<ProviderRegistryRecord | null>(null);
  const [facility, setFacility] = useState<FacilityRegistryRecord | null>(null);
  const [pendingAuth, setPendingAuth] = useState<{ method: string; confidence: number } | null>(null);
  
  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && view !== "workspace") {
      navigate("/");
    }
  }, [user, view, navigate]);

  const handleProviderFound = (providerData: ProviderRegistryRecord, facilityData: FacilityRegistryRecord) => {
    setProvider(providerData);
    setFacility(facilityData);
    setView("biometric");
  };

  const handleBiometricVerified = async (method: string, confidence: number) => {
    if (!provider) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("provider_registry_id", provider.providerId)
        .maybeSingle();

      if (!profile) {
        toast.error("No user account linked to this Provider ID");
        setView("lookup");
        return;
      }

      setPendingAuth({ method, confidence });
      setView("workspace");

    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Failed to complete authentication");
    }
  };

  const handleWorkspaceSelected = async (selection: WorkspaceSelectionData) => {
    if (!provider || !pendingAuth) return;

    try {
      const testPassword = "Impilo2025!";

      const emailMap: Record<string, string> = {
        "VARAPI-2025-ZW000001-A1B2": "sarah.moyo@impilo.health",
        "VARAPI-2025-ZW000002-C3D4": "tendai.ncube@impilo.health",
        "VARAPI-2025-ZW000003-E5F6": "grace.mutasa@impilo.health",
        "VARAPI-2025-ZW000004-G7H8": "farai.chikwava@impilo.health",
        "VARAPI-2025-ZW000005-I9J0": "rumbi.mhaka@impilo.health",
      };

      const providerEmail = emailMap[provider.providerId];

      if (!providerEmail) {
        toast.error("Demo login not available for this provider");
        setView("lookup");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: providerEmail,
        password: testPassword,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        toast.error("Failed to complete sign in", { description: signInError.message });
        return;
      }

      setCurrentDepartment(selection.department);

      sessionStorage.setItem('activeWorkspace', JSON.stringify({
        department: selection.department,
        physicalWorkspace: selection.physicalWorkspace,
        workstation: selection.workstation,
        facility: facility?.name,
        loginTime: new Date().toISOString()
      }));

      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("provider_registry_id", provider.providerId)
        .maybeSingle();

      if (profileData) {
        supabase.from("provider_registry_logs").insert({
          user_id: profileData.user_id,
          provider_registry_id: provider.providerId,
          action: "biometric_login",
          biometric_method: pendingAuth.method,
          verification_status: "success",
          user_agent: navigator.userAgent,
        });
      }

      const workstationLabel = selection.workstation 
        ? ` at ${selection.workstation}` 
        : ` in ${selection.physicalWorkspace.name}`;

      toast.success(`Welcome, ${provider.fullName}!`, {
        description: `Logged in to ${selection.department}${workstationLabel}`,
      });

      navigate("/");
    } catch (error) {
      console.error("Workspace selection error:", error);
      toast.error("Failed to complete login");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error("Login failed", { description: error.message });
        return;
      }

      toast.success("Welcome back!", { description: "You have been logged in successfully." });
      navigate("/");
    } catch (error) {
      console.error("Email login error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricFailed = (error: string) => {
    toast.error("Biometric verification failed", { description: error });
    setView("lookup");
    setProvider(null);
    setFacility(null);
  };

  const handleCancel = () => {
    setView("method-select");
    setProvider(null);
    setFacility(null);
    setPendingAuth(null);
  };

  const handleWorkspaceBack = () => {
    setView("biometric");
    setPendingAuth(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      {view === "method-select" && (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={impiloLogo} alt="Impilo" className="h-16 w-auto" />
            </div>
            <div>
              <CardTitle className="text-2xl">Welcome to Impilo</CardTitle>
              <CardDescription>Choose your login method</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex items-center gap-4 justify-start"
              onClick={() => setView("lookup")}
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Fingerprint className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Provider ID & Biometric</p>
                <p className="text-sm text-muted-foreground">For clinical staff with Provider ID</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto py-4 flex items-center gap-4 justify-start"
              onClick={() => setView("email-login")}
            >
              <div className="h-12 w-12 rounded-lg bg-secondary/50 flex items-center justify-center">
                <Mail className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Email & Password</p>
                <p className="text-sm text-muted-foreground">For admin and system users</p>
              </div>
            </Button>

            <div className="pt-4 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
                Secure authentication powered by Impilo
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {view === "email-login" && (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={impiloLogo} alt="Impilo" className="h-12 w-auto" />
            </div>
            <div>
              <CardTitle className="text-xl">Admin Login</CardTitle>
              <CardDescription>Sign in with your email and password</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@impilo.health"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setView("method-select")}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {view === "lookup" && (
        <ProviderIdLookup onProviderFound={handleProviderFound} onCancel={handleCancel} />
      )}

      {view === "biometric" && provider && (
        <BiometricAuth
          providerId={provider.providerId}
          onVerified={handleBiometricVerified}
          onFailed={handleBiometricFailed}
          onCancel={handleCancel}
          requiredMethods={["fingerprint", "facial", "iris"]}
        />
      )}

      {view === "workspace" && provider && facility && (
        <WorkspaceSelection
          facility={facility}
          provider={provider}
          onWorkspaceSelected={handleWorkspaceSelected}
          onBack={handleWorkspaceBack}
        />
      )}
    </div>
  );
};

export default Auth;
