import { motion } from "framer-motion";
import { WorkspaceData } from "@/types/ehr";
import { useEHR } from "@/contexts/EHRContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Clock, MapPin, User, CheckCircle, Package } from "lucide-react";
import { useEffect, useState } from "react";

interface WorkspaceViewProps {
  workspace: WorkspaceData;
}

export function WorkspaceView({ workspace }: WorkspaceViewProps) {
  const { closeWorkspace } = useEHR();
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Date.now() - workspace.startTime.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [workspace.startTime]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-workspace-bg">
      {/* Workspace Header - Persistent */}
      <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold">{workspace.type} Workspace</h1>
            <div className="flex items-center gap-4 text-primary-foreground/80 text-sm mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Started: {workspace.startTime.toLocaleTimeString()}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {workspace.location}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm opacity-80">Elapsed Time</div>
            <div className="text-2xl font-mono font-semibold elapsed-time">{elapsedTime}</div>
          </div>
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
            Active
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={closeWorkspace}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Workspace Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Context & Preparation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Context & Preparation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Indication</label>
                  <div className="p-3 bg-muted rounded-lg text-sm">Routine procedure</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Pre-checks</label>
                  <div className="p-3 bg-success-muted rounded-lg text-sm text-success flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    All pre-checks complete
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Execution Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Execution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                  Execution steps will be displayed here based on workspace type
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consumables Used */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Consumables Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                No consumables recorded yet
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={closeWorkspace}>
              Cancel
            </Button>
            <Button>Complete Workspace</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
