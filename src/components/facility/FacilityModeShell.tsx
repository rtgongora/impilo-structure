// FacilityModeShell — the main shell when a user is operating in facility mode
// Renders a service-point-aware workspace with adaptive sidebar and toolbar

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServicePointSelector, SERVICE_POINTS, type ServicePointType } from "./ServicePointSelector";
import { ServicePointWorkspace } from "./ServicePointWorkspace";
import {
  Building2, ArrowLeft, Clock, Users, ChevronDown, LogOut,
  RefreshCw, Settings, Bell, Search, Activity,
} from "lucide-react";
import impiloLogo from "@/assets/impilo-logo.png";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FacilityModeShellProps {
  facilityId: string;
  facilityName: string;
  facilityType: string;
  contextLabel: string;
  onExitFacilityMode: () => void;
}

export function FacilityModeShell({
  facilityId, facilityName, facilityType, contextLabel, onExitFacilityMode,
}: FacilityModeShellProps) {
  const navigate = useNavigate();
  const [activeServicePoint, setActiveServicePoint] = useState<ServicePointType | null>(null);
  const [shiftStarted, setShiftStarted] = useState(false);
  const [shiftStartTime] = useState(new Date());

  const activeConfig = useMemo(
    () => SERVICE_POINTS.find(sp => sp.id === activeServicePoint),
    [activeServicePoint]
  );

  // Start shift handler
  const handleStartShift = (sp: ServicePointType) => {
    setActiveServicePoint(sp);
    setShiftStarted(true);
    const config = SERVICE_POINTS.find(s => s.id === sp);
    toast.success(`Shift started at ${config?.label}`, {
      description: `${facilityName} • ${new Date().toLocaleTimeString()}`,
    });
  };

  // Switch service point
  const handleSwitchServicePoint = (sp: ServicePointType) => {
    const config = SERVICE_POINTS.find(s => s.id === sp);
    toast.info(`Switched to ${config?.label}`, { description: facilityName });
    setActiveServicePoint(sp);
  };

  // End shift
  const handleEndShift = () => {
    toast.success("Shift ended", {
      description: `Duration: ${Math.round((Date.now() - shiftStartTime.getTime()) / 60000)} min`,
    });
    setShiftStarted(false);
    setActiveServicePoint(null);
    onExitFacilityMode();
  };

  // If no service point selected, show selector
  if (!activeServicePoint) {
    return (
      <ServicePointSelector
        facilityName={facilityName}
        onSelect={handleStartShift}
        onBack={onExitFacilityMode}
      />
    );
  }

  // Facility mode shell with active service point
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Facility Mode Top Bar */}
      <div className="h-10 min-h-[2.5rem] shrink-0 bg-card border-b border-border flex items-center justify-between px-3 z-50">
        <div className="flex items-center gap-3">
          <img src={impiloLogo} alt="Impilo" className="h-5 w-auto" />
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-semibold text-foreground">{facilityName}</span>
          </div>
          <Badge variant="outline" className="text-[10px]">{facilityType}</Badge>
        </div>

        {/* Active Service Point */}
        <div className="flex items-center gap-2">
          {activeConfig && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 h-7">
                  <activeConfig.icon className={`h-3.5 w-3.5 ${activeConfig.color}`} />
                  <span className="text-xs font-medium">{activeConfig.label}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuLabel className="text-xs">Switch Service Point</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SERVICE_POINTS.map(sp => (
                  <DropdownMenuItem
                    key={sp.id}
                    onClick={() => handleSwitchServicePoint(sp.id)}
                    className={sp.id === activeServicePoint ? "bg-accent" : ""}
                  >
                    <sp.icon className={`h-4 w-4 mr-2 ${sp.color}`} />
                    {sp.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{shiftStartTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Bell className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Search className="h-3.5 w-3.5" />
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={handleEndShift}>
            <LogOut className="h-3 w-3" />
            End Shift
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        <ServicePointWorkspace
          servicePoint={activeServicePoint}
          facilityName={facilityName}
          facilityId={facilityId}
        />
      </div>
    </div>
  );
}
