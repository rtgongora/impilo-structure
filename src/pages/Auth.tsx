import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAboveSiteRole } from "@/hooks/useAboveSiteRole";
import { UnifiedSignIn } from "@/components/auth/UnifiedSignIn";
import { PostLoginContextResolver, type OperationalContext } from "@/components/auth/PostLoginContextResolver";
import { AboveSiteContextSelection } from "@/components/auth/AboveSiteContextSelection";
import { SystemMaintenanceAuth } from "@/components/auth/SystemMaintenanceAuth";
import { Heart, Activity, Shield } from "lucide-react";
import impiloLogo from "@/assets/impilo-logo.png";
import type { AboveSiteContextType } from "@/types/aboveSite";

type AuthPhase = 
  | "sign-in"              // Universal sign-in form
  | "context-resolver"     // Post-login context chooser
  | "above-site-context"   // Above-site scope selection (province/district)
  | "system-maintenance";  // Hidden maintenance pathway

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { setCurrentDepartment } = useWorkspace();
  const { isAboveSiteUser, startSession, loading: aboveSiteLoading } = useAboveSiteRole();

  const [phase, setPhase] = useState<AuthPhase>("sign-in");
  const [showMaintenanceOption, setShowMaintenanceOption] = useState(false);
  const [pendingAboveSite, setPendingAboveSite] = useState<{
    roleId: string; roleType: string; title: string;
  } | null>(null);

  // Detect maintenance mode from URL
  useEffect(() => {
    if (searchParams.get("mode") === "maintenance") {
      setShowMaintenanceOption(true);
    }
  }, [searchParams]);

  // When user becomes authenticated, move to context resolver
  useEffect(() => {
    if (user && !loading && !aboveSiteLoading) {
      if (phase === "sign-in") {
        setPhase("context-resolver");
      }
    }
  }, [user, loading, aboveSiteLoading, phase]);

  // Handle context selection from the resolver
  const handleContextSelected = (ctx: OperationalContext) => {
    switch (ctx.type) {
      case "personal":
        // Route to home, default to personal tab
        sessionStorage.setItem("impilo_landing_tab", "personal");
        navigate("/");
        break;
      case "professional":
        sessionStorage.setItem("impilo_landing_tab", "professional");
        navigate("/");
        break;
      case "facility":
        // Store facility context and route to work
        sessionStorage.setItem("impilo_landing_tab", "work");
        sessionStorage.setItem("impilo_current_facility_id", ctx.facility.facility_id);
        sessionStorage.setItem("impilo_active_context", JSON.stringify({
          type: "facility",
          facilityId: ctx.facility.facility_id,
          facilityName: ctx.facility.facility_name,
          facilityType: ctx.facility.facility_type,
          contextLabel: ctx.facility.context_label,
          accessMode: "clinical",
        }));
        navigate("/");
        break;
      case "above_site":
        // Need additional scope selection
        setPendingAboveSite({ roleId: ctx.roleId, roleType: ctx.roleType, title: ctx.title });
        setPhase("above-site-context");
        break;
      case "registry_admin":
        // Route to the specific registry admin page
        const registryRoutes: Record<string, string> = {
          vito: "/client-registry",
          varapi: "/hpr",
          tuso: "/facility-registry",
          tshepo: "/admin/tshepo/consents",
          zibo: "/admin/zibo",
        };
        sessionStorage.setItem("impilo_landing_tab", "work");
        navigate(registryRoutes[ctx.registry] || "/");
        break;
      case "org_admin":
        sessionStorage.setItem("impilo_landing_tab", "work");
        navigate("/");
        break;
    }
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

  // Loading state
  if (loading || (user && aboveSiteLoading && phase === "sign-in")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Phase: Context resolver (post-login)
  if (phase === "context-resolver" && user) {
    return <PostLoginContextResolver onContextSelected={handleContextSelected} />;
  }

  // Phase: Above-site scope selection
  if (phase === "above-site-context" && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg">
          <AboveSiteContextSelection
            onContextSelected={handleAboveSiteContextSelected}
            onCancel={() => setPhase("context-resolver")}
          />
        </div>
      </div>
    );
  }

  // Phase: System maintenance
  if (phase === "system-maintenance") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <SystemMaintenanceAuth onCancel={() => setPhase("sign-in")} />
        </div>
      </div>
    );
  }

  // Phase: Sign-in (default)
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
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
                Health Operating System
              </h1>
              <p className="text-xl text-primary-foreground/80 mt-4 max-w-md">
                One identity. Every context. Personal health, clinical care, facility operations, and system administration — all from a single sign-in.
              </p>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Heart className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">My Life</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">My Work</span>
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

      {/* Right Panel - Unified Sign In */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src={impiloLogo}
              alt="Impilo"
              className="h-12 w-auto select-none"
              onTouchStart={(e) => {
                const timer = setTimeout(() => {
                  setShowMaintenanceOption(true);
                }, 1500);
                (e.target as HTMLElement).dataset.timer = String(timer);
              }}
              onTouchEnd={(e) => {
                const timer = (e.target as HTMLElement).dataset.timer;
                if (timer) clearTimeout(Number(timer));
              }}
            />
          </div>

          <UnifiedSignIn
            onAuthenticated={() => setPhase("context-resolver")}
            onShowMaintenance={showMaintenanceOption ? () => setPhase("system-maintenance") : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;
