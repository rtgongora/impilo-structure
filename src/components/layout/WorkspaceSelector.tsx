import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, ChevronDown, Users, User, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type WorkspaceView = "personal" | "department" | "team";

interface WorkspaceSelectorProps {
  currentView: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
  collapsed?: boolean;
}

const DEPARTMENTS = [
  "Emergency",
  "Medical Ward",
  "Surgical Ward",
  "ICU",
  "Pediatrics",
  "Maternity",
  "Outpatient",
  "Pharmacy",
  "Laboratory",
  "Radiology",
];

export function WorkspaceSelector({ currentView, onViewChange, collapsed }: WorkspaceSelectorProps) {
  const { profile } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState(profile?.department || "Emergency");

  const viewLabels: Record<WorkspaceView, { label: string; icon: React.ElementType; description: string }> = {
    personal: { label: "My Work", icon: User, description: "Your assigned patients and tasks" },
    department: { label: selectedDepartment, icon: Building2, description: "Department-wide view" },
    team: { label: "My Team", icon: Users, description: "Team assignments and worklists" },
  };

  const current = viewLabels[currentView];

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="w-10 h-10 mx-auto">
            <current.icon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-56">
          <DropdownMenuLabel>Workspace View</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(viewLabels) as WorkspaceView[]).map((view) => {
            const ViewIcon = viewLabels[view].icon;
            return (
              <DropdownMenuItem 
                key={view}
                onClick={() => onViewChange(view)}
                className="flex items-center gap-2"
              >
                {currentView === view && <Check className="h-4 w-4" />}
                <ViewIcon className="h-4 w-4" />
                <span>{viewLabels[view].label}</span>
              </DropdownMenuItem>
            );
          })}
          {currentView === "department" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Change Department</DropdownMenuLabel>
              {DEPARTMENTS.slice(0, 5).map((dept) => (
                <DropdownMenuItem 
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className="text-sm"
                >
                  {selectedDepartment === dept && <Check className="h-3 w-3 mr-1" />}
                  {dept}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="px-3 py-3 border-b border-sidebar-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between h-auto py-2 px-3 hover:bg-sidebar-accent"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <current.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{current.label}</p>
                <p className="text-xs text-muted-foreground">{current.description}</p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Workspace View</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(viewLabels) as WorkspaceView[]).map((view) => {
            const ViewIcon = viewLabels[view].icon;
            return (
              <DropdownMenuItem 
                key={view}
                onClick={() => onViewChange(view)}
                className={cn(
                  "flex items-center gap-3 py-2",
                  currentView === view && "bg-accent"
                )}
              >
                <div className="p-1.5 rounded-md bg-primary/10">
                  <ViewIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{viewLabels[view].label}</p>
                  <p className="text-xs text-muted-foreground">{viewLabels[view].description}</p>
                </div>
                {currentView === view && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
          
          {currentView === "department" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Department</DropdownMenuLabel>
              {DEPARTMENTS.map((dept) => (
                <DropdownMenuItem 
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className="flex items-center gap-2"
                >
                  {selectedDepartment === dept ? (
                    <Check className="h-3 w-3 text-primary" />
                  ) : (
                    <span className="w-3" />
                  )}
                  <span className="text-sm">{dept}</span>
                  {selectedDepartment === dept && (
                    <Badge variant="secondary" className="ml-auto text-xs">Current</Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
