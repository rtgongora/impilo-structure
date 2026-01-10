import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  BadgeCheck,
  Clock,
  Loader2,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EligibilityStatus {
  isEligible: boolean;
  checks: EligibilityCheck[];
  warnings: string[];
  blockers: string[];
}

interface EligibilityCheck {
  id: string;
  name: string;
  status: "pass" | "warning" | "fail" | "loading";
  message?: string;
}

interface EligibilityCheckProps {
  onEligibilityConfirmed: () => void;
  onEligibilityFailed?: () => void;
}

export function EligibilityCheck({ onEligibilityConfirmed, onEligibilityFailed }: EligibilityCheckProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (user) {
      runEligibilityChecks();
    }
  }, [user]);

  const runEligibilityChecks = async () => {
    if (!user) return;

    setLoading(true);
    const checks: EligibilityCheck[] = [
      { id: "identity", name: "Identity Verification", status: "loading" },
      { id: "license", name: "Professional License", status: "loading" },
      { id: "facility", name: "Facility Assignment", status: "loading" },
      { id: "workspace", name: "Workspace Authorization", status: "loading" },
    ];
    setEligibility({ isEligible: false, checks, warnings: [], blockers: [] });

    const warnings: string[] = [];
    const blockers: string[] = [];

    // Check 1: Identity/Provider Record
    await delay(300);
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, status, specialty")
      .eq("user_id", user.id)
      .maybeSingle();

    if (providerError || !provider) {
      checks[0] = { id: "identity", name: "Identity Verification", status: "fail", message: "No provider record found" };
      blockers.push("Your account is not linked to a provider record. Please contact administration.");
    } else {
      checks[0] = { id: "identity", name: "Identity Verification", status: "pass", message: "Provider verified" };
    }
    setEligibility(prev => ({ ...prev!, checks: [...checks] }));

    // Check 2: License Status
    await delay(300);
    if (provider) {
      const isActive = provider.status === "active";

      if (!isActive) {
        checks[1] = { id: "license", name: "Professional License", status: "fail", message: "Provider status inactive" };
        blockers.push("Your provider status is not active. Please contact HR.");
      } else {
        checks[1] = { id: "license", name: "Professional License", status: "pass", message: "Active status" };
      }
    } else {
      checks[1] = { id: "license", name: "Professional License", status: "fail", message: "Cannot verify" };
    }
    setEligibility(prev => ({ ...prev!, checks: [...checks] }));

    // Check 3: Facility Assignment
    await delay(300);
    if (provider) {
      const { data: assignments } = await supabase
        .from("provider_facility_assignments")
        .select("facility_id, is_primary, facilities(name)")
        .eq("provider_id", provider.id)
        .eq("is_active", true);

      if (!assignments || assignments.length === 0) {
        checks[2] = { id: "facility", name: "Facility Assignment", status: "fail", message: "No facility assigned" };
        blockers.push("You are not assigned to any facility. Please contact administration.");
      } else {
        checks[2] = { id: "facility", name: "Facility Assignment", status: "pass", message: `${assignments.length} facility(s) assigned` };
      }
    } else {
      checks[2] = { id: "facility", name: "Facility Assignment", status: "fail", message: "Cannot verify" };
    }
    setEligibility(prev => ({ ...prev!, checks: [...checks] }));

    // Check 4: Workspace Memberships
    await delay(300);
    if (provider) {
      const { data: memberships } = await supabase
        .from("workspace_memberships")
        .select("id, workspace_id, workspace_role")
        .eq("provider_id", provider.id)
        .eq("is_active", true);

      if (!memberships || memberships.length === 0) {
        checks[3] = { id: "workspace", name: "Workspace Authorization", status: "warning", message: "No workspaces assigned" };
        warnings.push("You have no workspace memberships. You may have limited access.");
      } else {
        checks[3] = { id: "workspace", name: "Workspace Authorization", status: "pass", message: `${memberships.length} workspace(s)` };
      }
    } else {
      checks[3] = { id: "workspace", name: "Workspace Authorization", status: "fail", message: "Cannot verify" };
    }

    const isEligible = blockers.length === 0;
    setEligibility({ isEligible, checks, warnings, blockers });
    setLoading(false);

    if (!isEligible) {
      onEligibilityFailed?.();
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    await runEligibilityChecks();
    setRetrying(false);
  };

  const getStatusIcon = (status: EligibilityCheck["status"]) => {
    switch (status) {
      case "pass": return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "fail": return <XCircle className="h-5 w-5 text-destructive" />;
      case "loading": return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    }
  };

  if (!eligibility) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Eligibility Verification
        </CardTitle>
        <CardDescription>
          Verifying your credentials before starting shift
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Check Items */}
        <div className="space-y-3">
          {eligibility.checks.map((check) => (
            <div 
              key={check.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <p className="font-medium">{check.name}</p>
                  {check.message && (
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {eligibility.warnings.length > 0 && (
          <Alert variant="default" className="border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Warnings</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {eligibility.warnings.map((w, i) => (
                  <li key={i} className="text-sm">{w}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Blockers */}
        {eligibility.blockers.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Cannot Proceed</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {eligibility.blockers.map((b, i) => (
                  <li key={i} className="text-sm">{b}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleRetry}
            disabled={loading || retrying}
          >
            {retrying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Re-check
          </Button>

          {eligibility.isEligible ? (
            <Button onClick={onEligibilityConfirmed} disabled={loading}>
              Continue to Shift Start
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Eligibility Check Failed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
