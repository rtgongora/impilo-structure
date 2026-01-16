/**
 * Trust Layer Consent Badge
 * 
 * Displays patient consent status with visual indicators.
 * Used on patient banners and chart headers.
 * 
 * Standards:
 * - FHIR Consent Resource (R4)
 * - HIPAA Authorization Requirements
 */

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldOff, 
  ShieldQuestion,
  FileCheck,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react";
import { ConsentStatus, ConsentType, CONSENT_TYPE_LABELS } from "@/types/trustLayer";
import { consentService } from "@/services/trustLayer";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ConsentSummary {
  hasActiveConsent: boolean;
  primaryConsentType?: ConsentType;
  expiresAt?: string;
  consentCount: number;
  restrictedDataClasses?: string[];
}

interface TrustLayerConsentBadgeProps {
  patientCpid: string;
  variant?: "minimal" | "standard" | "detailed";
  showPopover?: boolean;
  className?: string;
}

export function TrustLayerConsentBadge({
  patientCpid,
  variant = "standard",
  showPopover = true,
  className,
}: TrustLayerConsentBadgeProps) {
  const [consentSummary, setConsentSummary] = useState<ConsentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchConsents() {
      try {
        const consents = await consentService.getActiveConsents(patientCpid);
        
        const hasActiveConsent = consents.length > 0;
        const primaryConsent = consents[0];
        
        // Aggregate restricted data classes
        const restrictedClasses = new Set<string>();
        consents.forEach(c => {
          if (c.provisionType === 'deny' && c.dataClasses) {
            c.dataClasses.forEach(dc => restrictedClasses.add(dc));
          }
        });

        setConsentSummary({
          hasActiveConsent,
          primaryConsentType: primaryConsent?.consentType,
          expiresAt: primaryConsent?.periodEnd,
          consentCount: consents.length,
          restrictedDataClasses: Array.from(restrictedClasses),
        });
      } catch (error) {
        console.error("Error fetching consent status:", error);
        setConsentSummary({
          hasActiveConsent: false,
          consentCount: 0,
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (patientCpid) {
      fetchConsents();
    }
  }, [patientCpid]);

  if (isLoading) {
    return (
      <Badge variant="outline" className={cn("animate-pulse", className)}>
        <ShieldQuestion className="w-3 h-3 mr-1" />
        Checking...
      </Badge>
    );
  }

  const getStatusConfig = () => {
    if (!consentSummary) {
      return {
        icon: ShieldQuestion,
        label: "Unknown",
        variant: "secondary" as const,
        color: "text-muted-foreground",
        bgColor: "bg-muted",
      };
    }

    if (consentSummary.hasActiveConsent) {
      const hasRestrictions = (consentSummary.restrictedDataClasses?.length ?? 0) > 0;
      const isExpiringSoon = consentSummary.expiresAt && 
        new Date(consentSummary.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

      if (hasRestrictions) {
        return {
          icon: ShieldAlert,
          label: "Restricted",
          variant: "warning" as const,
          color: "text-warning",
          bgColor: "bg-warning/10",
        };
      }

      if (isExpiringSoon) {
        return {
          icon: Clock,
          label: "Expiring Soon",
          variant: "outline" as const,
          color: "text-warning",
          bgColor: "bg-warning/10",
        };
      }

      return {
        icon: ShieldCheck,
        label: "Consented",
        variant: "success" as const,
        color: "text-success",
        bgColor: "bg-success/10",
      };
    }

    return {
      icon: ShieldOff,
      label: "No Consent",
      variant: "destructive" as const,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    };
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const badgeContent = (
    <Badge 
      variant="outline" 
      className={cn(
        "cursor-pointer transition-colors",
        config.bgColor,
        config.color,
        "border-current",
        className
      )}
    >
      <IconComponent className="w-3 h-3 mr-1" />
      {variant !== "minimal" && config.label}
      {variant === "detailed" && consentSummary && consentSummary.consentCount > 1 && (
        <span className="ml-1 text-xs opacity-70">
          ({consentSummary.consentCount})
        </span>
      )}
    </Badge>
  );

  if (!showPopover) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent>
            <p>{config.label}</p>
            {consentSummary?.primaryConsentType && (
              <p className="text-xs text-muted-foreground">
                {CONSENT_TYPE_LABELS[consentSummary.primaryConsentType]}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{badgeContent}</PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-full", config.bgColor)}>
              <IconComponent className={cn("w-4 h-4", config.color)} />
            </div>
            <div>
              <p className="font-medium">{config.label}</p>
              <p className="text-xs text-muted-foreground">
                Trust Layer Consent Status
              </p>
            </div>
          </div>

          {consentSummary?.hasActiveConsent && (
            <>
              <div className="space-y-2 text-sm">
                {consentSummary.primaryConsentType && (
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {CONSENT_TYPE_LABELS[consentSummary.primaryConsentType]}
                    </span>
                  </div>
                )}
                
                {consentSummary.expiresAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>
                      Expires {formatDistanceToNow(new Date(consentSummary.expiresAt), { addSuffix: true })}
                    </span>
                  </div>
                )}

                {consentSummary.restrictedDataClasses && consentSummary.restrictedDataClasses.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="block text-warning font-medium">Restricted Data:</span>
                      <span className="text-xs text-muted-foreground">
                        {consentSummary.restrictedDataClasses.join(", ")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {consentSummary.consentCount > 1 && (
                <p className="text-xs text-muted-foreground border-t pt-2">
                  {consentSummary.consentCount} active consent directives
                </p>
              )}
            </>
          )}

          {!consentSummary?.hasActiveConsent && (
            <div className="flex items-start gap-2 p-2 rounded bg-destructive/5 border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">No Active Consent</p>
                <p className="text-xs text-muted-foreground">
                  Break-glass access may be required for emergency situations.
                </p>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
