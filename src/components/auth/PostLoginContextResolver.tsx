// PostLoginContextResolver
// After authentication, resolves all available contexts for the user
// Then either auto-routes (single context) or shows a context chooser

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderFacilities, type ProviderFacility } from "@/hooks/useProviderFacilities";
import { useAboveSiteRole } from "@/hooks/useAboveSiteRole";
import { useSystemRoles } from "@/hooks/useSystemRoles";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Heart, Stethoscope, Building2, Shield, Users, Database,
  ChevronRight, Clock, MapPin, Crown, Star, Briefcase,
  Settings, BookOpen, FileHeart, Globe, Loader2,
  User, Lock, Eye, Network, BarChart3,
} from "lucide-react";
import impiloLogo from "@/assets/impilo-logo.png";

export type OperationalContext =
  | { type: "personal" }
  | { type: "professional" }
  | { type: "facility"; facility: ProviderFacility }
  | { type: "above_site"; roleId: string; roleType: string; title: string }
  | { type: "registry_admin"; registry: string; registryLabel: string }
  | { type: "org_admin"; orgId: string; orgName: string };

interface PostLoginContextResolverProps {
  onContextSelected: (context: OperationalContext) => void;
}

export function PostLoginContextResolver({ onContextSelected }: PostLoginContextResolverProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { facilities, loading: facilitiesLoading, isDemoMode } = useProviderFacilities();
  const { isAboveSiteUser, roles: aboveSiteRoles, loading: aboveSiteLoading } = useAboveSiteRole();
  const { systemRoles, loading: systemRolesLoading, isSuperAdmin, hasSystemRole } = useSystemRoles();
  const [rememberChoice, setRememberChoice] = useState(false);

  const isLoading = facilitiesLoading || aboveSiteLoading || systemRolesLoading;
  const isClient = profile?.role === "client" || profile?.role === "patient";
  const isProvider = profile?.role === "doctor" || profile?.role === "nurse" || profile?.role === "specialist";

  // Detect registry admin capabilities from system roles
  const registryAdminContexts = useMemo(() => {
    const contexts: { registry: string; registryLabel: string; icon: React.ElementType }[] = [];
    if (!systemRoles || systemRoles.length === 0) return contexts;

    const hasAdmin = isSuperAdmin || hasSystemRole('system_superadmin');
    if (hasAdmin) {
      contexts.push(
        { registry: "vito", registryLabel: "Client Registry (VITO)", icon: Users },
        { registry: "varapi", registryLabel: "Provider Registry (VARAPI)", icon: Stethoscope },
        { registry: "tuso", registryLabel: "Facility Registry (TUSO)", icon: Building2 },
        { registry: "indawo", registryLabel: "Site & Premises Registry (INDAWO)", icon: Globe },
        { registry: "msika", registryLabel: "Products & Services Registry (MSIKA)", icon: Star },
        { registry: "tshepo", registryLabel: "Trust & IAM (TSHEPO)", icon: Shield },
        { registry: "zibo", registryLabel: "Terminology (ZIBO)", icon: BookOpen },
      );
    }
    return contexts;
  }, [systemRoles, isSuperAdmin, hasSystemRole]);

  // Count available contexts
  const contextCount = useMemo(() => {
    let count = 1; // Always have personal
    if (isProvider) count++; // Professional
    count += facilities.length; // Facilities
    if (isAboveSiteUser) count += (aboveSiteRoles?.length || 0);
    count += registryAdminContexts.length;
    return count;
  }, [isProvider, facilities, isAboveSiteUser, aboveSiteRoles, registryAdminContexts]);

  // Auto-route for simple cases
  useEffect(() => {
    if (isLoading) return;

    // Check for remembered choice
    const remembered = sessionStorage.getItem("impilo_last_context");
    if (remembered && rememberChoice) {
      try {
        const ctx = JSON.parse(remembered) as OperationalContext;
        onContextSelected(ctx);
        return;
      } catch {}
    }

    // Client/patient users → auto-route to personal
    if (isClient && facilities.length === 0) {
      onContextSelected({ type: "personal" });
      return;
    }

    // Single facility, no other roles → auto-suggest
    // (but still show chooser so user can pick personal/professional)
  }, [isLoading, isClient, facilities.length]);

  const handleSelect = (ctx: OperationalContext) => {
    if (rememberChoice) {
      sessionStorage.setItem("impilo_last_context", JSON.stringify(ctx));
    }
    onContextSelected(ctx);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src={impiloLogo} alt="Impilo" className="h-10 w-auto opacity-60" />
          <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Resolving your access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <img src={impiloLogo} alt="Impilo" className="h-10 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-display">
            Welcome, {profile?.display_name || "User"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Choose where you want to work
          </p>
        </div>

        <div className="space-y-3">
          {/* My Life — always available */}
          <ContextCard
            icon={Heart}
            iconColor="text-pink-500"
            iconBg="bg-pink-500/10"
            title="My Life"
            description="Personal health records, appointments, dependants, community"
            onClick={() => handleSelect({ type: "personal" })}
          />

          {/* My Professional — for providers */}
          {isProvider && (
            <ContextCard
              icon={Stethoscope}
              iconColor="text-teal-500"
              iconBg="bg-teal-500/10"
              title="My Professional Profile"
              description="CPD, licenses, credentials, referral network"
              onClick={() => handleSelect({ type: "professional" })}
            />
          )}

          {/* Facility Work — one card per affiliation */}
          {facilities.length > 0 && (
            <>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
                Facility Work
              </p>
              {facilities.map(f => (
                <ContextCard
                  key={f.facility_id}
                  icon={Building2}
                  iconColor="text-primary"
                  iconBg="bg-primary/10"
                  title={f.facility_name}
                  description={`${f.context_label} • ${f.facility_type}`}
                  badges={[
                    ...(f.is_primary ? [{ label: "Primary", variant: "default" as const }] : []),
                    ...(f.is_pic ? [{ label: "PIC", variant: "secondary" as const }] : []),
                    ...(f.is_owner ? [{ label: "Owner", variant: "outline" as const }] : []),
                    ...(f.is_demo ? [{ label: "Demo", variant: "outline" as const }] : []),
                  ]}
                  onClick={() => handleSelect({ type: "facility", facility: f })}
                />
              ))}
            </>
          )}

          {/* Above-Site Oversight */}
          {isAboveSiteUser && aboveSiteRoles && aboveSiteRoles.length > 0 && (
            <>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
                Oversight & Supervision
              </p>
              {aboveSiteRoles.map(role => (
                <ContextCard
                  key={role.id}
                  icon={Eye}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-500/10"
                  title={role.title}
                  description={`${role.role_type} oversight`}
                  onClick={() => handleSelect({
                    type: "above_site",
                    roleId: role.id,
                    roleType: role.role_type,
                    title: role.title,
                  })}
                />
              ))}
            </>
          )}

          {/* Registry Administration */}
          {registryAdminContexts.length > 0 && (
            <>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
                Registry Administration
              </p>
              {registryAdminContexts.map(ctx => (
                <ContextCard
                  key={ctx.registry}
                  icon={ctx.icon}
                  iconColor="text-indigo-600"
                  iconBg="bg-indigo-500/10"
                  title={ctx.registryLabel}
                  description="High-trust administrative workspace"
                  badges={[{ label: "Admin", variant: "outline" as const }]}
                  onClick={() => handleSelect({
                    type: "registry_admin",
                    registry: ctx.registry,
                    registryLabel: ctx.registryLabel,
                  })}
                />
              ))}
            </>
          )}
        </div>

        {/* Remember choice */}
        <div className="flex items-center justify-between mt-6 px-1">
          <div className="flex items-center gap-2">
            <Switch id="remember" checked={rememberChoice} onCheckedChange={setRememberChoice} />
            <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
              Remember last workspace
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            You can switch context anytime from the profile menu
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Reusable context card
function ContextCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  badges,
  onClick,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  badges?: { label: string; variant: "default" | "secondary" | "outline" | "destructive" }[];
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full group relative overflow-hidden rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {badges?.map(b => (
              <Badge key={b.label} variant={b.variant} className="text-[10px] px-1.5 py-0">
                {b.label}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </motion.button>
  );
}
