import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Bed, Package, Clock, DollarSign, Settings,
  ArrowLeft, Building2, Stethoscope, Shield, Headphones
} from "lucide-react";
import { WorkspaceDashboardPanel } from "./WorkspaceDashboardPanel";
import { StockManagementPanel } from "./StockManagementPanel";
import { HRShiftsPanel } from "./HRShiftsPanel";
import { BillingPanel } from "./BillingPanel";

export type WorkspaceOpsType = 'clinical' | 'admin' | 'support';

type OpsTab = 'dashboard' | 'stock' | 'hr-shifts' | 'billing' | 'settings';

interface WorkspaceOpsHubProps {
  workspaceName: string;
  workspaceType: WorkspaceOpsType;
  facilityName?: string;
  onBack?: () => void;
  /** Override which tabs are visible based on user role */
  visibleTabs?: OpsTab[];
}

// Default tab visibility per workspace type
const WORKSPACE_TYPE_TABS: Record<WorkspaceOpsType, OpsTab[]> = {
  clinical: ['dashboard', 'stock', 'hr-shifts', 'billing'],
  admin: ['dashboard', 'hr-shifts', 'billing', 'stock', 'settings'],
  support: ['dashboard', 'stock', 'hr-shifts', 'settings'],
};

const TAB_CONFIG: Record<OpsTab, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  dashboard: { label: 'Dashboard', icon: BarChart3 },
  stock: { label: 'Stock & Supplies', icon: Package },
  'hr-shifts': { label: 'HR & Shifts', icon: Clock },
  billing: { label: 'Billing & Finance', icon: DollarSign },
  settings: { label: 'Settings', icon: Settings },
};

const WORKSPACE_TYPE_META: Record<WorkspaceOpsType, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  clinical: { icon: Stethoscope, color: 'bg-blue-500', label: 'Clinical Workspace' },
  admin: { icon: Shield, color: 'bg-amber-500', label: 'Administration Workspace' },
  support: { icon: Headphones, color: 'bg-green-500', label: 'Support Services Workspace' },
};

export function WorkspaceOpsHub({ workspaceName, workspaceType, facilityName, onBack, visibleTabs }: WorkspaceOpsHubProps) {
  const tabs = visibleTabs || WORKSPACE_TYPE_TABS[workspaceType];
  const [activeTab, setActiveTab] = useState<OpsTab>(tabs[0]);
  const meta = WORKSPACE_TYPE_META[workspaceType];
  const TypeIcon = meta.icon;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className={`h-9 w-9 rounded-lg ${meta.color} flex items-center justify-center text-white`}>
          <TypeIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold truncate">{workspaceName}</h2>
            <Badge variant="outline" className="text-[10px] shrink-0">{meta.label}</Badge>
          </div>
          {facilityName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />{facilityName}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as OpsTab)} className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0">
          {tabs.map(tabId => {
            const cfg = TAB_CONFIG[tabId];
            const Icon = cfg.icon;
            return (
              <TabsTrigger key={tabId} value={tabId} className="gap-1.5 text-xs">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{cfg.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="flex-1 overflow-auto mt-3">
          <TabsContent value="dashboard" className="mt-0">
            <WorkspaceDashboardPanel />
          </TabsContent>
          <TabsContent value="stock" className="mt-0">
            <StockManagementPanel />
          </TabsContent>
          <TabsContent value="hr-shifts" className="mt-0">
            <HRShiftsPanel />
          </TabsContent>
          <TabsContent value="billing" className="mt-0">
            <BillingPanel />
          </TabsContent>
          <TabsContent value="settings" className="mt-0">
            <div className="text-center py-12 text-muted-foreground text-sm">
              Workspace settings coming soon
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
