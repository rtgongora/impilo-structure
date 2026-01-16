/**
 * Patient Access History Component
 * 
 * Displays sanitized audit trail of who accessed a patient's record.
 * Designed for patient-facing transparency (within chart) and 
 * administrative review.
 * 
 * Standards:
 * - HIPAA Right to Access (45 CFR 164.524)
 * - GDPR Article 15 (Right of Access)
 * - IHE ATNA (Audit Trail and Node Authentication)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  Clock,
  Building2,
  User,
  ShieldCheck,
  ShieldAlert,
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { PatientAccessHistory as PatientAccessHistoryType, PURPOSE_OF_USE_LABELS, PurposeOfUse } from "@/types/trustLayer";
import { auditService } from "@/services/trustLayer";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface PatientAccessHistoryProps {
  patientCpid: string;
  limit?: number;
  showTitle?: boolean;
  variant?: "compact" | "full";
  className?: string;
}

export function PatientAccessHistory({
  patientCpid,
  limit = 10,
  showTitle = true,
  variant = "full",
  className,
}: PatientAccessHistoryProps) {
  const [accessHistory, setAccessHistory] = useState<PatientAccessHistoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const history = await auditService.getPatientAccessHistory(patientCpid, limit);
      setAccessHistory(history);
    } catch (err) {
      console.error("Error fetching access history:", err);
      setError("Unable to load access history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patientCpid) {
      fetchHistory();
    }
  }, [patientCpid, limit]);

  const getPurposeConfig = (purpose: string) => {
    const purposeKey = purpose as PurposeOfUse;
    
    if (purpose === "emergency" || purpose === "break_glass") {
      return {
        icon: ShieldAlert,
        label: PURPOSE_OF_USE_LABELS[purposeKey] || "Emergency Access",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
      };
    }

    if (purpose === "treatment" || purpose === "care_coordination") {
      return {
        icon: ShieldCheck,
        label: PURPOSE_OF_USE_LABELS[purposeKey] || "Treatment",
        color: "text-success",
        bgColor: "bg-success/10",
      };
    }

    return {
      icon: Eye,
      label: PURPOSE_OF_USE_LABELS[purposeKey] || purpose,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    };
  };

  const displayedHistory = isExpanded ? accessHistory : accessHistory.slice(0, 5);

  if (isLoading) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Access History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertTriangle className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={fetchHistory}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Access History
          </CardTitle>
          <CardDescription>
            Who has accessed this patient's record
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        {accessHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <ShieldCheck className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No access records found</p>
          </div>
        ) : (
          <ScrollArea className={variant === "full" ? "max-h-[400px]" : "max-h-[250px]"}>
            <div className="space-y-3">
              {displayedHistory.map((access, index) => {
                const purposeConfig = getPurposeConfig(access.purposeOfUse);
                const PurposeIcon = purposeConfig.icon;

                return (
                  <div
                    key={access.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border bg-card transition-colors hover:bg-muted/50",
                      access.purposeOfUse === "emergency" && "border-destructive/30 bg-destructive/5"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn("p-2 rounded-full shrink-0", purposeConfig.bgColor)}>
                      <PurposeIcon className={cn("w-4 h-4", purposeConfig.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {access.showAccessorName && access.accessorName 
                            ? access.accessorName 
                            : access.accessorRole}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {access.accessorRole}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {access.accessorFacilityName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {access.accessorFacilityName}
                          </span>
                        )}
                        {access.accessorDepartment && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {access.accessorDepartment}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", purposeConfig.bgColor, purposeConfig.color)}
                        >
                          {purposeConfig.label}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(access.accessTimestamp), { addSuffix: true })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {format(new Date(access.accessTimestamp), "PPpp")}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {access.dataAccessedSummary && variant === "full" && (
                        <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1">
                          <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                          {access.dataAccessedSummary}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {accessHistory.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show {accessHistory.length - 5} More
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
