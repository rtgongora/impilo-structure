/**
 * Trust Layer Status Indicator
 * 
 * Displays overall Trust Layer connection and session status.
 * Used in headers and navigation areas.
 * 
 * Shows:
 * - Session assurance level
 * - Device trust status
 * - Offline mode status
 * - Active break-glass sessions
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
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Wifi,
  WifiOff,
  Smartphone,
  MonitorSmartphone,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Key,
} from "lucide-react";
import { AssuranceLevel, DeviceRegistration } from "@/types/trustLayer";
import { offlineService } from "@/services/trustLayer";
import { cn } from "@/lib/utils";

interface TrustLayerStatus {
  isConnected: boolean;
  isOffline: boolean;
  assuranceLevel: AssuranceLevel;
  deviceTrusted: boolean;
  deviceType?: DeviceRegistration["deviceType"];
  mfaVerified: boolean;
  activeBreakGlassCount: number;
  pendingOfflineSync: number;
  lastSyncAt?: string;
}

interface TrustLayerStatusIndicatorProps {
  variant?: "icon" | "badge" | "full";
  className?: string;
}

export function TrustLayerStatusIndicator({
  variant = "badge",
  className,
}: TrustLayerStatusIndicatorProps) {
  const [status, setStatus] = useState<TrustLayerStatus>({
    isConnected: true,
    isOffline: false,
    assuranceLevel: "medium",
    deviceTrusted: true,
    mfaVerified: false,
    activeBreakGlassCount: 0,
    pendingOfflineSync: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check offline status
    const isOffline = offlineService.isOffline();
    const offlineQueue = offlineService.getOfflineQueue();
    
    setStatus(prev => ({
      ...prev,
      isOffline,
      pendingOfflineSync: offlineQueue.length,
    }));

    // Listen for online/offline events
    const handleOnline = () => setStatus(prev => ({ ...prev, isOffline: false, isConnected: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOffline: true }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger offline sync if online
      if (!status.isOffline) {
        await offlineService.processOfflineQueue();
        const offlineQueue = offlineService.getOfflineQueue();
        setStatus(prev => ({
          ...prev,
          pendingOfflineSync: offlineQueue.length,
          lastSyncAt: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getOverallStatus = () => {
    if (!status.isConnected) {
      return { icon: ShieldOff, color: "text-destructive", label: "Disconnected" };
    }
    if (status.isOffline) {
      return { icon: ShieldAlert, color: "text-warning", label: "Offline Mode" };
    }
    if (status.activeBreakGlassCount > 0) {
      return { icon: ShieldAlert, color: "text-destructive", label: "Break-Glass Active" };
    }
    if (status.assuranceLevel === "high" || status.assuranceLevel === "very_high") {
      return { icon: ShieldCheck, color: "text-success", label: "High Assurance" };
    }
    return { icon: Shield, color: "text-primary", label: "Protected" };
  };

  const getAssuranceLevelConfig = (level: AssuranceLevel) => {
    switch (level) {
      case "very_high":
        return { label: "Very High", color: "text-success", bars: 4 };
      case "high":
        return { label: "High", color: "text-success", bars: 3 };
      case "medium":
        return { label: "Medium", color: "text-primary", bars: 2 };
      case "low":
        return { label: "Low", color: "text-warning", bars: 1 };
      default:
        return { label: "Unknown", color: "text-muted-foreground", bars: 0 };
    }
  };

  const overallStatus = getOverallStatus();
  const StatusIcon = overallStatus.icon;
  const assuranceConfig = getAssuranceLevelConfig(status.assuranceLevel);

  // Icon-only variant
  if (variant === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("p-1.5 rounded-full", className)}>
              <StatusIcon className={cn("w-5 h-5", overallStatus.color)} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Trust Layer: {overallStatus.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Badge variant
  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        "cursor-pointer transition-colors gap-1.5",
        overallStatus.color,
        status.isOffline && "border-warning bg-warning/10",
        status.activeBreakGlassCount > 0 && "border-destructive bg-destructive/10",
        className
      )}
    >
      <StatusIcon className="w-3.5 h-3.5" />
      {variant === "full" && overallStatus.label}
      {status.isOffline && <WifiOff className="w-3 h-3" />}
      {status.pendingOfflineSync > 0 && (
        <span className="text-xs opacity-70">({status.pendingOfflineSync})</span>
      )}
    </Badge>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>{badgeContent}</PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-full", 
                status.isOffline ? "bg-warning/10" : "bg-primary/10"
              )}>
                <Shield className={cn("w-5 h-5", 
                  status.isOffline ? "text-warning" : "text-primary"
                )} />
              </div>
              <div>
                <p className="font-medium">Trust Layer</p>
                <p className="text-xs text-muted-foreground">{overallStatus.label}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>

          <Separator />

          {/* Status Items */}
          <div className="space-y-3">
            {/* Connection */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                {status.isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                Connection
              </span>
              <Badge variant={status.isOffline ? "secondary" : "outline"} className="text-xs">
                {status.isOffline ? "Offline" : "Online"}
              </Badge>
            </div>

            {/* Assurance Level */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Key className="w-4 h-4" />
                Assurance Level
              </span>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className={cn(
                        "w-1.5 h-3 rounded-sm",
                        bar <= assuranceConfig.bars ? assuranceConfig.color.replace("text-", "bg-") : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <span className={cn("text-xs font-medium", assuranceConfig.color)}>
                  {assuranceConfig.label}
                </span>
              </div>
            </div>

            {/* Device Trust */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <MonitorSmartphone className="w-4 h-4" />
                Device
              </span>
              <span className="flex items-center gap-1">
                {status.deviceTrusted ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-warning" />
                )}
                <span className="text-xs">
                  {status.deviceTrusted ? "Trusted" : "Unknown"}
                </span>
              </span>
            </div>

            {/* MFA Status */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4" />
                MFA
              </span>
              <span className="flex items-center gap-1">
                {status.mfaVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-xs">
                  {status.mfaVerified ? "Verified" : "Not Required"}
                </span>
              </span>
            </div>

            {/* Break-Glass Alert */}
            {status.activeBreakGlassCount > 0 && (
              <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 border border-destructive/30">
                <ShieldAlert className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">
                  {status.activeBreakGlassCount} active break-glass session{status.activeBreakGlassCount > 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Pending Sync */}
            {status.pendingOfflineSync > 0 && (
              <div className="flex items-center gap-2 p-2 rounded bg-warning/10 border border-warning/30">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-sm text-warning">
                  {status.pendingOfflineSync} items pending sync
                </span>
              </div>
            )}
          </div>

          {/* Last Sync */}
          {status.lastSyncAt && (
            <p className="text-xs text-muted-foreground text-center pt-2 border-t">
              Last synced: {new Date(status.lastSyncAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
