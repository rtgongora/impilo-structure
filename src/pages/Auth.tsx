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

type AuthView = "lookup" | "biometric" | "workspace";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { setCurrentDepartment } = useWorkspace();

  const [view, setView] = useState<AuthView>("lookup");
  const [provider, setProvider] = useState<ProviderRegistryRecord | null>(null);
  const [facility, setFacility] = useState<FacilityRegistryRecord | null>(null);
  const [pendingAuth, setPendingAuth] = useState<{ method: string; confidence: number } | null>(null);

  useEffect(() => {
    if (user && view !== "workspace") {
      // If user is logged in and not in workspace selection, go home
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
      // Find the user account and email associated with this provider ID
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

      // Store pending auth for after workspace selection
      setPendingAuth({ method, confidence });
      
      // Move to workspace selection before completing sign-in
      setView("workspace");

    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Failed to complete authentication");
    }
  };

  const handleWorkspaceSelected = async (selection: WorkspaceSelectionData) => {
    if (!provider || !pendingAuth) return;

    try {
      // For demo: use the known test password for biometric-verified login
      const testPassword = "Impilo2025!";

      // Lookup email based on provider pattern
      const emailMap: Record<string, string> = {
        "VARAPI-2025-ZW000001-A1B2": "sarah.moyo@impilo.health",
        "VARAPI-2025-ZW000002-C3D4": "tendai.ncube@impilo.health",
        "VARAPI-2025-ZW000003-E5F6": "grace.mutasa@impilo.health",
        "VARAPI-2025-ZW000004-G7H8": "farai.chikwava@impilo.health",
        "VARAPI-2025-ZW000005-I9J0": "rumbi.mhaka@impilo.health",
      };

      const email = emailMap[provider.providerId];

      if (!email) {
        toast.error("Demo login not available for this provider");
        setView("lookup");
        return;
      }

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: testPassword,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        toast.error("Failed to complete sign in", { description: signInError.message });
        return;
      }

      // Set the workspace context
      setCurrentDepartment(selection.department);

      // Store workspace selection in session storage for persistence
      sessionStorage.setItem('activeWorkspace', JSON.stringify({
        department: selection.department,
        physicalWorkspace: selection.physicalWorkspace,
        workstation: selection.workstation,
        facility: facility?.name,
        loginTime: new Date().toISOString()
      }));

      // Log the biometric authentication with workspace info
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

  const handleBiometricFailed = (error: string) => {
    toast.error("Biometric verification failed", { description: error });
    setView("lookup");
    setProvider(null);
    setFacility(null);
  };

  const handleCancel = () => {
    setView("lookup");
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
      {view === "lookup" && (
        <ProviderIdLookup onProviderFound={handleProviderFound} onCancel={() => navigate("/")} />
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
