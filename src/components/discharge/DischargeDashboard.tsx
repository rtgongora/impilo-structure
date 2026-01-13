import { useState, useEffect } from "react";
import { 
  LogOut, Skull, Clock, Check, AlertTriangle, Search,
  FileText, DollarSign, Users, Building2, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { DischargeCase, DischargeWorkflowState } from "./types";

interface DischargeDashboardProps {
  facilityId?: string;
  onSelectCase?: (caseId: string) => void;
}

const STATE_LABELS: Record<DischargeWorkflowState, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-blue-100 text-blue-700' },
  discharge_initiated: { label: 'Initiated', color: 'bg-yellow-100 text-yellow-700' },
  clinical_clearance: { label: 'Clinical', color: 'bg-orange-100 text-orange-700' },
  financial_clearance: { label: 'Financial', color: 'bg-purple-100 text-purple-700' },
  admin_approval: { label: 'Approval', color: 'bg-indigo-100 text-indigo-700' },
  closed_discharged: { label: 'Discharged', color: 'bg-green-100 text-green-700' },
  death_declared: { label: 'Declared', color: 'bg-red-100 text-red-700' },
  certification: { label: 'Certification', color: 'bg-pink-100 text-pink-700' },
  financial_reconciliation: { label: 'Reconciliation', color: 'bg-purple-100 text-purple-700' },
  closed_deceased: { label: 'Closed', color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' }
};

export function DischargeDashboard({ facilityId, onSelectCase }: DischargeDashboardProps) {
  const [cases, setCases] = useState<DischargeCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'all' | 'discharge' | 'death' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadCases();
  }, [facilityId]);

  const loadCases = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('discharge_cases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCases((data || []) as unknown as DischargeCase[]);
    } catch (error) {
      console.error('Load cases error:', error);
      toast.error("Failed to load cases");
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    // Search filter
    if (searchTerm && !c.case_number.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Type/status filter
    switch (filter) {
      case 'discharge':
        return c.workflow_type === 'discharge';
      case 'death':
        return c.workflow_type === 'death';
      case 'pending':
        return c.workflow_state !== 'closed_discharged' && c.workflow_state !== 'closed_deceased';
      case 'completed':
        return c.workflow_state === 'closed_discharged' || c.workflow_state === 'closed_deceased';
      default:
        return true;
    }
  });

  const stats = {
    total: cases.length,
    discharges: cases.filter(c => c.workflow_type === 'discharge').length,
    deaths: cases.filter(c => c.workflow_type === 'death').length,
    pending: cases.filter(c => 
      c.workflow_state !== 'closed_discharged' && c.workflow_state !== 'closed_deceased'
    ).length,
    completedToday: cases.filter(c => 
      c.closed_at && format(new Date(c.closed_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    ).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Discharge & Death Workflows
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage patient discharge and death processes
          </p>
        </div>
        <Button onClick={loadCases} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Cases</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-blue-500" />
              <div className="text-2xl font-bold text-blue-600">{stats.discharges}</div>
            </div>
            <div className="text-sm text-muted-foreground">Discharges</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Skull className="w-5 h-5 text-purple-500" />
              <div className="text-2xl font-bold text-purple-600">{stats.deaths}</div>
            </div>
            <div className="text-sm text-muted-foreground">Deaths</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            </div>
            <div className="text-sm text-muted-foreground">Completed Today</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by case number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="discharge">Discharges</TabsTrigger>
            <TabsTrigger value="death">Deaths</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Cases List */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading cases...
          </CardContent>
        </Card>
      ) : filteredCases.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No cases found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((c) => {
            const stateConfig = STATE_LABELS[c.workflow_state];
            const isComplete = c.workflow_state === 'closed_discharged' || c.workflow_state === 'closed_deceased';

            return (
              <Card 
                key={c.id} 
                className="hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onSelectCase?.(c.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${c.workflow_type === 'discharge' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        {c.workflow_type === 'discharge' ? (
                          <LogOut className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Skull className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{c.case_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {c.workflow_type === 'discharge' ? 'Discharge' : 'Death'} • 
                          Created {format(new Date(c.created_at), 'dd MMM yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Financial Status */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="w-3 h-3" />
                          <span className={c.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}>
                            {c.outstanding_balance > 0 ? `$${c.outstanding_balance.toFixed(2)} due` : 'Cleared'}
                          </span>
                        </div>
                      </div>
                      
                      {/* State Badge */}
                      <Badge className={stateConfig.color}>
                        {isComplete ? <Check className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {stateConfig.label}
                      </Badge>
                      
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
