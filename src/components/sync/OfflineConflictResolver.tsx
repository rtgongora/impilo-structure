import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Cloud,
  Smartphone,
  Check,
  X,
  RefreshCw,
  Clock,
  User,
  FileText,
  ArrowRight,
  CheckCircle2,
  Merge,
  GitMerge
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ConflictField {
  field: string;
  localValue: any;
  serverValue: any;
}

interface SyncConflict {
  id: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  localModified: string;
  serverModified: string;
  localModifiedBy: string;
  serverModifiedBy: string;
  conflicts: ConflictField[];
  resolution?: "local" | "server" | "merged";
}

const MOCK_CONFLICTS: SyncConflict[] = [
  {
    id: "1",
    resourceType: "Patient",
    resourceId: "patient-001",
    resourceName: "John Moyo",
    localModified: "2024-01-15T10:30:00Z",
    serverModified: "2024-01-15T10:35:00Z",
    localModifiedBy: "Dr. Smith",
    serverModifiedBy: "Nurse Ndlovu",
    conflicts: [
      { field: "phone", localValue: "+263 77 123 4567", serverValue: "+263 77 987 6543" },
      { field: "address.city", localValue: "Harare", serverValue: "Bulawayo" },
    ]
  },
  {
    id: "2",
    resourceType: "ClinicalNote",
    resourceId: "note-001",
    resourceName: "Progress Note - 15 Jan 2024",
    localModified: "2024-01-15T11:00:00Z",
    serverModified: "2024-01-15T11:05:00Z",
    localModifiedBy: "Dr. Smith",
    serverModifiedBy: "Dr. Patel",
    conflicts: [
      { 
        field: "assessment", 
        localValue: "Patient responding well to treatment. Continue current medications.",
        serverValue: "Patient showing improvement. Consider reducing dosage."
      },
    ]
  },
  {
    id: "3",
    resourceType: "Vitals",
    resourceId: "vitals-001",
    resourceName: "Blood Pressure Reading",
    localModified: "2024-01-15T09:45:00Z",
    serverModified: "2024-01-15T09:50:00Z",
    localModifiedBy: "Nurse Chikwanha",
    serverModifiedBy: "Nurse Ndlovu",
    conflicts: [
      { field: "systolic", localValue: 128, serverValue: 132 },
      { field: "diastolic", localValue: 82, serverValue: 85 },
    ]
  }
];

export function OfflineConflictResolver() {
  const { toast } = useToast();
  const [conflicts, setConflicts] = useState<SyncConflict[]>(MOCK_CONFLICTS);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(conflicts[0]);
  const [resolutions, setResolutions] = useState<Record<string, Record<string, "local" | "server">>>({});
  const [resolvedCount, setResolvedCount] = useState(0);

  const handleFieldResolution = (conflictId: string, field: string, choice: "local" | "server") => {
    setResolutions(prev => ({
      ...prev,
      [conflictId]: {
        ...(prev[conflictId] || {}),
        [field]: choice
      }
    }));
  };

  const isConflictFullyResolved = (conflict: SyncConflict) => {
    const fieldResolutions = resolutions[conflict.id];
    if (!fieldResolutions) return false;
    return conflict.conflicts.every(c => fieldResolutions[c.field]);
  };

  const handleApplyResolution = (conflict: SyncConflict) => {
    setConflicts(prev => prev.filter(c => c.id !== conflict.id));
    setResolvedCount(prev => prev + 1);
    toast({
      title: "Conflict Resolved",
      description: `${conflict.resourceType} "${conflict.resourceName}" has been synced`,
    });
    
    // Select next conflict
    const remaining = conflicts.filter(c => c.id !== conflict.id);
    setSelectedConflict(remaining[0] || null);
  };

  const handleResolveAll = (strategy: "local" | "server") => {
    setConflicts([]);
    setResolvedCount(prev => prev + conflicts.length);
    toast({
      title: "All Conflicts Resolved",
      description: `Applied ${strategy === "local" ? "local" : "server"} version to all ${conflicts.length} conflicts`,
    });
    setSelectedConflict(null);
  };

  if (conflicts.length === 0) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">All Synced!</h3>
          <p className="text-muted-foreground mb-2">
            No conflicts to resolve. Your data is up to date.
          </p>
          {resolvedCount > 0 && (
            <Badge variant="secondary" className="text-sm">
              {resolvedCount} conflict{resolvedCount > 1 ? "s" : ""} resolved this session
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Conflict List */}
      <div className="col-span-4 border-r">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Sync Conflicts
              </CardTitle>
              <Badge variant="destructive">{conflicts.length}</Badge>
            </div>
            <CardDescription>
              Changes made while offline that conflict with server data
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 p-2">
                {conflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors",
                      selectedConflict?.id === conflict.id
                        ? "bg-warning/10 border border-warning/30"
                        : "hover:bg-muted"
                    )}
                    onClick={() => setSelectedConflict(conflict)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {conflict.resourceType}
                      </Badge>
                      {isConflictFullyResolved(conflict) && (
                        <Check className="h-4 w-4 text-success" />
                      )}
                    </div>
                    <p className="font-medium text-sm">{conflict.resourceName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {conflict.conflicts.length} conflicting field{conflict.conflicts.length > 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t space-y-2">
              <p className="text-xs text-muted-foreground">Quick Actions</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleResolveAll("local")}
                >
                  <Smartphone className="h-3 w-3 mr-1" />
                  Keep All Local
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleResolveAll("server")}
                >
                  <Cloud className="h-3 w-3 mr-1" />
                  Keep All Server
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conflict Detail */}
      <div className="col-span-8">
        {selectedConflict ? (
          <Card className="h-full">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{selectedConflict.resourceType}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {selectedConflict.resourceId}
                    </span>
                  </div>
                  <CardTitle>{selectedConflict.resourceName}</CardTitle>
                </div>
                <Button
                  disabled={!isConflictFullyResolved(selectedConflict)}
                  onClick={() => handleApplyResolution(selectedConflict)}
                >
                  <GitMerge className="h-4 w-4 mr-2" />
                  Apply Resolution
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg">
                  <Smartphone className="h-4 w-4 text-blue-500" />
                  <div className="text-xs">
                    <p className="font-medium">Local Version</p>
                    <p className="text-muted-foreground">
                      {selectedConflict.localModifiedBy} • {format(new Date(selectedConflict.localModified), "HH:mm")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded-lg">
                  <Cloud className="h-4 w-4 text-purple-500" />
                  <div className="text-xs">
                    <p className="font-medium">Server Version</p>
                    <p className="text-muted-foreground">
                      {selectedConflict.serverModifiedBy} • {format(new Date(selectedConflict.serverModified), "HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <ScrollArea className="h-[350px]">
                <div className="space-y-6">
                  {selectedConflict.conflicts.map((conflict, idx) => {
                    const resolution = resolutions[selectedConflict.id]?.[conflict.field];
                    
                    return (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="font-mono text-sm font-semibold">
                            {conflict.field}
                          </Label>
                          {resolution && (
                            <Badge className="bg-success/10 text-success">
                              <Check className="h-3 w-3 mr-1" />
                              Using {resolution}
                            </Badge>
                          )}
                        </div>

                        <RadioGroup
                          value={resolution}
                          onValueChange={(value) => 
                            handleFieldResolution(selectedConflict.id, conflict.field, value as "local" | "server")
                          }
                        >
                          <div className={cn(
                            "flex items-start space-x-3 border rounded-lg p-3 cursor-pointer transition-all",
                            resolution === "local" && "border-blue-500 bg-blue-500/5"
                          )}>
                            <RadioGroupItem value="local" id={`local-${idx}`} className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor={`local-${idx}`} className="flex items-center gap-2 cursor-pointer">
                                <Smartphone className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Local Value</span>
                              </Label>
                              <div className="mt-2 p-2 bg-muted rounded text-sm font-mono break-all">
                                {typeof conflict.localValue === "object" 
                                  ? JSON.stringify(conflict.localValue, null, 2)
                                  : String(conflict.localValue)
                                }
                              </div>
                            </div>
                          </div>

                          <div className={cn(
                            "flex items-start space-x-3 border rounded-lg p-3 cursor-pointer transition-all mt-2",
                            resolution === "server" && "border-purple-500 bg-purple-500/5"
                          )}>
                            <RadioGroupItem value="server" id={`server-${idx}`} className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor={`server-${idx}`} className="flex items-center gap-2 cursor-pointer">
                                <Cloud className="h-4 w-4 text-purple-500" />
                                <span className="font-medium">Server Value</span>
                              </Label>
                              <div className="mt-2 p-2 bg-muted rounded text-sm font-mono break-all">
                                {typeof conflict.serverValue === "object" 
                                  ? JSON.stringify(conflict.serverValue, null, 2)
                                  : String(conflict.serverValue)
                                }
                              </div>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <Merge className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conflict to resolve</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
