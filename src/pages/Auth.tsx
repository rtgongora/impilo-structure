import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAboveSiteRole } from "@/hooks/useAboveSiteRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProviderIdLookup } from "@/components/auth/ProviderIdLookup";
import { BiometricAuth } from "@/components/auth/BiometricAuth";
import { WorkspaceSelection, type WorkspaceSelectionData } from "@/components/auth/WorkspaceSelection";
import { AboveSiteContextSelection } from "@/components/auth/AboveSiteContextSelection";
import { type ProviderRegistryRecord, type FacilityRegistryRecord } from "@/services/registryServices";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, Mail, Shield, ArrowLeft, Eye, EyeOff, Heart, Activity } from "lucide-react";
import impiloLogo from "@/assets/impilo-logo.png";
import type { AboveSiteContextType } from "@/types/aboveSite";

type AuthView = "method-select" | "lookup" | "biometric" | "workspace" | "email-login" | "above-site-context";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { setCurrentDepartment } = useWorkspace();
  const { isAboveSiteUser, roles, availableContexts, startSession, loading: aboveSiteLoading } = useAboveSiteRole();

  const [view, setView] = useState<AuthView>("method-select");
  const [provider, setProvider] = useState<ProviderRegistryRecord | null>(null);
  const [facility, setFacility] = useState<FacilityRegistryRecord | null>(null);
  const [pendingAuth, setPendingAuth] = useState<{ method: string; confidence: number } | null>(null);
  
  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && view !== "workspace" && view !== "above-site-context") {
      if (isAboveSiteUser && !aboveSiteLoading) {
        setView("above-site-context");
      } else if (!aboveSiteLoading) {
        navigate("/");
      }
    }
  }, [user, view, navigate, isAboveSiteUser, aboveSiteLoading]);

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

  const handleAboveSiteContextSelected = async (
    roleId: string,
    contextType: AboveSiteContextType,
    contextLabel: string,
    scope?: { province?: string; district?: string; programme?: string }
  ) => {
    await startSession(roleId, contextType, contextLabel, scope);
    navigate("/above-site");
  };

  if (loading || (user && aboveSiteLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <img src={impiloLogo} alt="Impilo" className="h-14 w-auto brightness-0 invert" />
          </div>
          
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold font-display leading-tight">
                Digital Health Platform
              </h1>
              <p className="text-xl text-primary-foreground/80 mt-4 max-w-md">
                Empowering healthcare providers with seamless, secure, and intelligent clinical solutions.
              </p>
            </div>
            
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Heart className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Patient-Centered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Real-time</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-primary-foreground/60">
            © 2025 Impilo Health. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {view === "method-select" && (
            <div className="space-y-8">
              {/* Mobile logo */}
              <div className="lg:hidden flex justify-center mb-8">
                <img src={impiloLogo} alt="Impilo" className="h-12 w-auto" />
              </div>

              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-foreground font-display">Welcome back</h2>
                <p className="text-muted-foreground mt-2">Choose your preferred login method</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setView("lookup")}
                  className="w-full group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Fingerprint className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">Provider ID & Biometric</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        For clinical staff with registered Provider ID
                      </p>
                    </div>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowLeft className="h-5 w-5 text-primary rotate-180" />
                  </div>
                </button>

                <button
                  onClick={() => setView("email-login")}
                  className="w-full group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0 group-hover:bg-secondary/30 transition-colors">
                      <Mail className="h-7 w-7 text-secondary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">Email & Password</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        For admin and system users
                      </p>
                    </div>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowLeft className="h-5 w-5 text-primary rotate-180" />
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
                <Shield className="h-4 w-4" />
                <span>Secure authentication powered by Impilo</span>
              </div>
            </div>
          )}

          {view === "email-login" && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <img src={impiloLogo} alt="Impilo" className="h-10 w-auto" />
                </div>
                <CardTitle className="text-2xl font-display">Sign in</CardTitle>
                <CardDescription>Enter your email and password to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
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
                        id="password"
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
                          Signing in...
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setView("method-select")}
                      className="w-full h-12"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to login options
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

          {view === "above-site-context" && isAboveSiteUser && (
            <AboveSiteContextSelection
              roles={roles}
              availableContexts={availableContexts}
              onContextSelected={handleAboveSiteContextSelected}
              onBack={() => {
                supabase.auth.signOut();
                setView("method-select");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
