import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Clock, 
  LogOut,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActiveWorkspaceInfo {
  department: string;
  physicalWorkspace: {
    name: string;
    location: string;
    type: string;
  };
  workstation?: string;
  facility?: string;
  loginTime: string;
}

interface ActiveWorkspaceIndicatorProps {
  className?: string;
  compact?: boolean;
}

export function ActiveWorkspaceIndicator({ className, compact }: ActiveWorkspaceIndicatorProps) {
  const navigate = useNavigate();
  const [workspace, setWorkspace] = React.useState<ActiveWorkspaceInfo | null>(null);

  React.useEffect(() => {
    const stored = sessionStorage.getItem('activeWorkspace');
    if (stored) {
      try {
        setWorkspace(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse workspace info', e);
      }
    }
  }, []);

  const handleSwitchWorkspace = () => {
    // Clear current workspace and redirect to auth for re-selection
    sessionStorage.removeItem('activeWorkspace');
    navigate('/auth');
  };

  if (!workspace) {
    return null;
  }

  const loginTime = new Date(workspace.loginTime);
  const elapsedHours = Math.floor((Date.now() - loginTime.getTime()) / (1000 * 60 * 60));
  const elapsedMinutes = Math.floor((Date.now() - loginTime.getTime()) / (1000 * 60)) % 60;

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 gap-1.5 text-xs", className)}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span className="hidden sm:inline truncate max-w-[120px]">
              {workspace.workstation || workspace.physicalWorkspace.name}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <WorkspaceDetails workspace={workspace} onSwitch={handleSwitchWorkspace} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-auto py-1.5 px-3 gap-2 text-left justify-start",
            className
          )}
        >
          <div className="p-1 rounded bg-primary/10">
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium leading-tight">
              {workspace.workstation || workspace.physicalWorkspace.name}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {workspace.department}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <WorkspaceDetails workspace={workspace} onSwitch={handleSwitchWorkspace} />
      </PopoverContent>
    </Popover>
  );
}

function WorkspaceDetails({ 
  workspace, 
  onSwitch 
}: { 
  workspace: ActiveWorkspaceInfo; 
  onSwitch: () => void;
}) {
  const loginTime = new Date(workspace.loginTime);
  const elapsedMs = Date.now() - loginTime.getTime();
  const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60)) % 60;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Active Workspace</h4>
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {elapsedHours}h {elapsedMinutes}m
        </Badge>
      </div>

      <div className="space-y-2">
        {/* Facility */}
        {workspace.facility && (
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Facility</p>
              <p className="text-sm font-medium">{workspace.facility}</p>
            </div>
          </div>
        )}

        {/* Department */}
        <div className="flex items-start gap-2">
          <div className="h-4 w-4 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Department</p>
            <p className="text-sm font-medium">{workspace.department}</p>
          </div>
        </div>

        {/* Physical Location */}
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="text-sm font-medium">{workspace.physicalWorkspace.name}</p>
            <p className="text-xs text-muted-foreground">{workspace.physicalWorkspace.location}</p>
          </div>
        </div>

        {/* Workstation */}
        {workspace.workstation && (
          <div className="flex items-start gap-2">
            <div className="h-4 w-4 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-sm bg-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Workstation</p>
              <p className="text-sm font-medium">{workspace.workstation}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
        <Clock className="h-3 w-3" />
        <span>Logged in at {format(loginTime, 'HH:mm')} on {format(loginTime, 'dd MMM yyyy')}</span>
      </div>

      <Separator />

      <Button 
        variant="outline" 
        size="sm" 
        className="w-full gap-2"
        onClick={onSwitch}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Switch Workspace
      </Button>
    </div>
  );
}

export default ActiveWorkspaceIndicator;
