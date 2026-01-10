import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Building2, 
  Clock, 
  Users,
  Stethoscope,
  FlaskConical,
  Pill,
  AlertTriangle,
  Bed,
  Scissors,
  Baby,
  Heart,
  ChevronRight,
  Lock,
  Search,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkspaceData, type UserWorkspace, type Workspace } from '@/hooks/useWorkspaceData';
import { useShift } from '@/contexts/ShiftContext';
import { cn } from '@/lib/utils';

interface WorkspaceSelectorEnhancedProps {
  facilityId: string;
  facilityName: string;
  onWorkspaceSelected: (workspace: UserWorkspace | Workspace) => void;
  onBack?: () => void;
  showAllWorkspaces?: boolean; // Manager view
}

const WORKSPACE_TYPE_ICONS: Record<string, React.ElementType> = {
  'clinical': Stethoscope,
  'admin': Building2,
  'support': Users,
};

const SERVICE_TAG_ICONS: Record<string, React.ElementType> = {
  'emergency': AlertTriangle,
  'ward': Bed,
  'theatre': Scissors,
  'pharmacy': Pill,
  'laboratory': FlaskConical,
  'maternity': Baby,
  'icu': Heart,
};

export function WorkspaceSelectorEnhanced({
  facilityId,
  facilityName,
  onWorkspaceSelected,
  onBack,
  showAllWorkspaces = false
}: WorkspaceSelectorEnhancedProps) {
  const { myWorkspaces, workspaces, fetchWorkspaces, fetchMyWorkspaces, loading } = useWorkspaceData();
  const { isOnShift } = useShift();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'my' | 'all'>('my');

  useEffect(() => {
    fetchMyWorkspaces(facilityId);
    if (showAllWorkspaces) {
      fetchWorkspaces(facilityId);
    }
  }, [facilityId, fetchMyWorkspaces, fetchWorkspaces, showAllWorkspaces]);

  const filteredMyWorkspaces = myWorkspaces.filter(ws => 
    ws.workspace_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ws.service_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredAllWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ws.service_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getWorkspaceIcon = (workspace: UserWorkspace | Workspace) => {
    // Check service tags first
    const serviceTags = 'service_tags' in workspace ? workspace.service_tags : [];
    for (const tag of serviceTags) {
      if (SERVICE_TAG_ICONS[tag.toLowerCase()]) {
        return SERVICE_TAG_ICONS[tag.toLowerCase()];
      }
    }
    // Fall back to workspace type
    const type = 'workspace_type' in workspace ? workspace.workspace_type : 'clinical';
    return WORKSPACE_TYPE_ICONS[type] || MapPin;
  };

  const isUserWorkspace = (ws: UserWorkspace | Workspace): ws is UserWorkspace => {
    return 'workspace_id' in ws;
  };

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Select Workspace</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {facilityName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs for My vs All Workspaces */}
        {showAllWorkspaces && (
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'my' | 'all')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my">My Workspaces</TabsTrigger>
              <TabsTrigger value="all">All Workspaces</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Workspace List */}
        <ScrollArea className="h-[320px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-muted-foreground">Loading workspaces...</div>
            </div>
          ) : (
            <div className="space-y-2 pr-3">
              {(selectedTab === 'my' || !showAllWorkspaces) ? (
                filteredMyWorkspaces.length > 0 ? (
                  filteredMyWorkspaces.map((ws) => (
                    <WorkspaceCard
                      key={ws.workspace_id}
                      workspace={ws}
                      icon={getWorkspaceIcon(ws)}
                      onClick={() => onWorkspaceSelected(ws)}
                      isAuthorized
                      role={ws.workspace_role}
                    />
                  ))
                ) : (
                  <EmptyState 
                    message={searchQuery ? "No matching workspaces found" : "No workspaces assigned to you"} 
                  />
                )
              ) : (
                filteredAllWorkspaces.length > 0 ? (
                  filteredAllWorkspaces.map((ws) => {
                    const isAuthorized = myWorkspaces.some(mw => mw.workspace_id === ws.id);
                    return (
                      <WorkspaceCard
                        key={ws.id}
                        workspace={ws}
                        icon={getWorkspaceIcon(ws)}
                        onClick={() => onWorkspaceSelected(ws)}
                        isAuthorized={isAuthorized}
                      />
                    );
                  })
                ) : (
                  <EmptyState message="No workspaces found for this facility" />
                )
              )}
            </div>
          )}
        </ScrollArea>

        {/* Back Button */}
        {onBack && (
          <Button variant="outline" className="w-full" onClick={onBack}>
            Back
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function WorkspaceCard({
  workspace,
  icon: Icon,
  onClick,
  isAuthorized,
  role
}: {
  workspace: UserWorkspace | Workspace;
  icon: React.ElementType;
  onClick: () => void;
  isAuthorized: boolean;
  role?: string;
}) {
  const isUserWs = 'workspace_id' in workspace;
  const name = isUserWs ? workspace.workspace_name : workspace.name;
  const type = workspace.workspace_type;
  const tags = workspace.service_tags || [];

  return (
    <motion.button
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      disabled={!isAuthorized}
      className={cn(
        "w-full p-3 rounded-lg border text-left transition-all",
        "flex items-center gap-3",
        isAuthorized 
          ? "hover:border-primary hover:bg-primary/5 cursor-pointer"
          : "opacity-60 cursor-not-allowed bg-muted/30"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg",
        isAuthorized ? "bg-primary/10" : "bg-muted"
      )}>
        <Icon className={cn("h-4 w-4", isAuthorized ? "text-primary" : "text-muted-foreground")} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{name}</span>
          {!isAuthorized && <Lock className="h-3 w-3 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs py-0 capitalize">
            {type}
          </Badge>
          {role && (
            <Badge variant="secondary" className="text-xs py-0 capitalize">
              {role}
            </Badge>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {isAuthorized && (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
    </motion.button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-center">
      <MapPin className="h-8 w-8 text-muted-foreground/50 mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default WorkspaceSelectorEnhanced;
