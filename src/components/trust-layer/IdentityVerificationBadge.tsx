/**
 * Identity Verification Badge
 * 
 * Shows patient identity verification status including:
 * - MOSIP link status
 * - Biometric verification
 * - Document verification
 * 
 * Standards:
 * - MOSIP Integration Requirements
 * - Identity Assurance Framework
 */

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  UserCheck,
  UserX,
  Fingerprint,
  CreditCard,
  ShieldCheck,
  ShieldQuestion,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Link2,
  Unlink,
  ExternalLink,
} from "lucide-react";
import { MosipLinkStatus, AssuranceLevel } from "@/types/trustLayer";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface IdentityVerificationStatus {
  mosipLinked: boolean;
  mosipStatus?: MosipLinkStatus;
  assuranceLevel?: AssuranceLevel;
  verificationMethod?: string;
  verifiedAt?: string;
  documentVerified: boolean;
  biometricVerified: boolean;
}

interface IdentityVerificationBadgeProps {
  patientCrid?: string;
  patientCpid?: string;
  variant?: "minimal" | "standard" | "detailed";
  showPopover?: boolean;
  className?: string;
}

export function IdentityVerificationBadge({
  patientCrid,
  patientCpid,
  variant = "standard",
  showPopover = true,
  className,
}: IdentityVerificationBadgeProps) {
  const [verificationStatus, setVerificationStatus] = useState<IdentityVerificationStatus>({
    mosipLinked: false,
    documentVerified: false,
    biometricVerified: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchVerificationStatus() {
      if (!patientCrid) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch MOSIP link status
        const { data: mosipLink } = await supabase
          .from("trust_layer_mosip_links")
          .select("*")
          .eq("crid", patientCrid)
          .eq("mosip_link_status", "verified")
          .maybeSingle();

        if (mosipLink) {
          setVerificationStatus({
            mosipLinked: true,
            mosipStatus: mosipLink.mosip_link_status as MosipLinkStatus,
            assuranceLevel: mosipLink.identity_assurance_level as AssuranceLevel,
            verificationMethod: mosipLink.verification_method,
            verifiedAt: mosipLink.verification_timestamp,
            documentVerified: mosipLink.verification_method?.includes("document") || false,
            biometricVerified: mosipLink.verification_method?.includes("biometric") || false,
          });
        } else {
          // Check for pending link
          const { data: pendingLink } = await supabase
            .from("trust_layer_mosip_links")
            .select("*")
            .eq("crid", patientCrid)
            .eq("mosip_link_status", "pending")
            .maybeSingle();

          if (pendingLink) {
            setVerificationStatus({
              mosipLinked: false,
              mosipStatus: "pending",
              documentVerified: false,
              biometricVerified: false,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching verification status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVerificationStatus();
  }, [patientCrid]);

  const getStatusConfig = () => {
    if (isLoading) {
      return {
        icon: ShieldQuestion,
        label: "Verifying...",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        variant: "outline" as const,
      };
    }

    if (verificationStatus.mosipLinked && verificationStatus.mosipStatus === "verified") {
      const hasFullVerification = verificationStatus.biometricVerified;
      
      if (hasFullVerification) {
        return {
          icon: UserCheck,
          label: "Verified",
          color: "text-success",
          bgColor: "bg-success/10",
          variant: "outline" as const,
        };
      }

      return {
        icon: ShieldCheck,
        label: "ID Linked",
        color: "text-primary",
        bgColor: "bg-primary/10",
        variant: "outline" as const,
      };
    }

    if (verificationStatus.mosipStatus === "pending") {
      return {
        icon: Clock,
        label: "Pending",
        color: "text-warning",
        bgColor: "bg-warning/10",
        variant: "outline" as const,
      };
    }

    return {
      icon: UserX,
      label: "Unverified",
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      variant: "secondary" as const,
    };
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const badgeContent = (
    <Badge
      variant={config.variant}
      className={cn(
        "cursor-pointer transition-colors gap-1",
        config.bgColor,
        config.color,
        "border-current",
        isLoading && "animate-pulse",
        className
      )}
    >
      <IconComponent className="w-3 h-3" />
      {variant !== "minimal" && config.label}
    </Badge>
  );

  if (!showPopover) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent>
            <p>Identity: {config.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{badgeContent}</PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-full", config.bgColor)}>
              <IconComponent className={cn("w-4 h-4", config.color)} />
            </div>
            <div>
              <p className="font-medium">Identity Verification</p>
              <p className="text-xs text-muted-foreground">{config.label}</p>
            </div>
          </div>

          {/* Verification Details */}
          <div className="space-y-2 text-sm">
            {/* National ID Link */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                National ID
              </span>
              {verificationStatus.mosipLinked ? (
                <span className="flex items-center gap-1 text-success">
                  <Link2 className="w-3 h-3" />
                  Linked
                </span>
              ) : verificationStatus.mosipStatus === "pending" ? (
                <span className="flex items-center gap-1 text-warning">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Unlink className="w-3 h-3" />
                  Not Linked
                </span>
              )}
            </div>

            {/* Biometric Verification */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Fingerprint className="w-4 h-4" />
                Biometrics
              </span>
              {verificationStatus.biometricVerified ? (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">Not verified</span>
              )}
            </div>

            {/* Document Verification */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                Documents
              </span>
              {verificationStatus.documentVerified ? (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">Not verified</span>
              )}
            </div>

            {/* Assurance Level */}
            {verificationStatus.assuranceLevel && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="w-4 h-4" />
                  Assurance
                </span>
                <Badge variant="outline" className="text-xs capitalize">
                  {verificationStatus.assuranceLevel}
                </Badge>
              </div>
            )}
          </div>

          {/* Verification Timestamp */}
          {verificationStatus.verifiedAt && (
            <p className="text-xs text-muted-foreground border-t pt-2">
              Verified on {format(new Date(verificationStatus.verifiedAt), "PPp")}
            </p>
          )}

          {/* Unverified Warning */}
          {!verificationStatus.mosipLinked && verificationStatus.mosipStatus !== "pending" && (
            <div className="flex items-start gap-2 p-2 rounded bg-muted border">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                This patient's identity has not been verified against national records.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
