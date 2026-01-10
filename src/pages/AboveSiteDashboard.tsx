// Above-Site Master Dashboard
// Implements AS-DASH-01, AS-DASH-02, AS-DASH-10

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAboveSiteRole } from '@/hooks/useAboveSiteRole';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InterventionsList } from '@/components/aboveSite/InterventionsList';
import {
  Building2,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  ChevronRight,
  Eye,
  Shield,
  RefreshCw,
  BarChart3,
  Bell,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { ABOVE_SITE_ROLE_LABELS, CONTEXT_TYPE_LABELS } from '@/types/aboveSite';

interface FacilitySummary {
  id: string;
  name: string;
  type: string;
  province: string;
  district: string;
  queueLength: number;
  avgWaitMinutes: number;
  staffOnDuty: number;
  slaBreaches: number;
  status: 'normal' | 'busy' | 'critical';
}

interface JurisdictionMetrics {
  totalFacilities: number;
  totalQueued: number;
  avgWaitTime: number;
  slaBreaches: number;
  staffOnDuty: number;
  coverageGaps: number;
}

const AboveSiteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { 
    isAboveSiteUser, 
    roles, 
    activeSession, 
    logAuditEvent,
    exitActAsMode,
  } = useAboveSiteRole();

  const [activeTab, setActiveTab] = useState('overview');
  const [facilities, setFacilities] = useState<FacilitySummary[]>([]);
  const [metrics, setMetrics] = useState<JurisdictionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAboveSiteUser || !activeSession) {
      navigate('/auth');
      return;
    }

    fetchDashboardData();
    logAuditEvent('dashboard_viewed', 'view', {
      context_type: activeSession.context_type,
    });
  }, [isAboveSiteUser, activeSession]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch facilities within jurisdiction
      const { data: facilitiesData } = await supabase
        .from('facilities')
        .select('id, name, facility_type, province')
        .eq('is_active', true)
        .limit(50);

      // Mock data for demonstration - in production, this would aggregate real queue/staffing data
      const enrichedFacilities: FacilitySummary[] = (facilitiesData || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.facility_type || 'Hospital',
        province: f.province || 'Unknown',
        district: 'District',
        queueLength: Math.floor(Math.random() * 50),
        avgWaitMinutes: Math.floor(Math.random() * 120),
        staffOnDuty: Math.floor(Math.random() * 20) + 5,
        slaBreaches: Math.floor(Math.random() * 5),
        status: ['normal', 'busy', 'critical'][Math.floor(Math.random() * 3)] as 'normal' | 'busy' | 'critical',
      }));

      setFacilities(enrichedFacilities);

      // Calculate aggregate metrics
      setMetrics({
        totalFacilities: enrichedFacilities.length,
        totalQueued: enrichedFacilities.reduce((sum, f) => sum + f.queueLength, 0),
        avgWaitTime: Math.round(enrichedFacilities.reduce((sum, f) => sum + f.avgWaitMinutes, 0) / (enrichedFacilities.length || 1)),
        slaBreaches: enrichedFacilities.reduce((sum, f) => sum + f.slaBreaches, 0),
        staffOnDuty: enrichedFacilities.reduce((sum, f) => sum + f.staffOnDuty, 0),
        coverageGaps: Math.floor(Math.random() * 3),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleDrillDown = async (facilityId: string, facilityName: string) => {
    await logAuditEvent('drill_down', 'drill_down', {
      target_type: 'facility',
      target_id: facilityId,
      target_name: facilityName,
    });
    // Navigate to facility-specific view
    navigate(`/above-site/facility/${facilityId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal': return <Badge variant="secondary" className="bg-green-100 text-green-800">Normal</Badge>;
      case 'busy': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Busy</Badge>;
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!activeSession) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">No Active Session</h2>
            <p className="text-muted-foreground mb-4">Please log in to access the Above-Site Dashboard.</p>
            <Button onClick={() => navigate('/auth')}>Go to Login</Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const currentRole = roles.find(r => r.id === activeSession.above_site_role_id);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Context Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span>Above-Site Access</span>
              <ChevronRight className="h-4 w-4" />
              <span>{CONTEXT_TYPE_LABELS[activeSession.context_type]?.label || activeSession.context_type}</span>
            </div>
            <h1 className="text-2xl font-bold">{activeSession.context_label}</h1>
            {currentRole && (
              <p className="text-sm text-muted-foreground mt-1">
                {ABOVE_SITE_ROLE_LABELS[currentRole.role_type]} • {profile?.display_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              Change Context
            </Button>
          </div>
        </div>

        {/* Act-As Mode Warning */}
        {activeSession.is_acting_as && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Act-As Mode Active</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                You are acting as a facility workspace. Reason: {activeSession.acting_as_reason}
              </span>
              <Button size="sm" variant="outline" onClick={exitActAsMode}>
                Exit Act-As Mode
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.totalFacilities}</p>
                    <p className="text-xs text-muted-foreground">Facilities</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.totalQueued}</p>
                    <p className="text-xs text-muted-foreground">In Queues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.avgWaitTime}m</p>
                    <p className="text-xs text-muted-foreground">Avg Wait</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.slaBreaches}</p>
                    <p className="text-xs text-muted-foreground">SLA Breaches</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.staffOnDuty}</p>
                    <p className="text-xs text-muted-foreground">Staff On Duty</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.coverageGaps}</p>
                    <p className="text-xs text-muted-foreground">Coverage Gaps</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="facilities">
              <Building2 className="h-4 w-4 mr-2" />
              Facilities
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="interventions">
              <Shield className="h-4 w-4 mr-2" />
              Interventions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Facilities by Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Facility Status Overview</CardTitle>
                  <CardDescription>Current operational status across jurisdiction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['normal', 'busy', 'critical'].map(status => {
                      const count = facilities.filter(f => f.status === status).length;
                      const percentage = (count / (facilities.length || 1)) * 100;
                      return (
                        <div key={status} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize">{status}</span>
                            <span className="font-medium">{count} facilities</span>
                          </div>
                          <Progress value={percentage} className={`h-2 ${getStatusColor(status)}`} />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Busy Facilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Facilities Requiring Attention</CardTitle>
                  <CardDescription>Highest queue lengths and SLA breaches</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {facilities
                        .sort((a, b) => b.queueLength - a.queueLength)
                        .slice(0, 5)
                        .map(facility => (
                          <div
                            key={facility.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleDrillDown(facility.id, facility.name)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`h-2 w-2 rounded-full ${getStatusColor(facility.status)}`} />
                              <div>
                                <p className="font-medium text-sm">{facility.name}</p>
                                <p className="text-xs text-muted-foreground">{facility.district}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-medium">{facility.queueLength} queued</p>
                                <p className="text-xs text-muted-foreground">{facility.avgWaitMinutes}m wait</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="facilities" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Facilities</CardTitle>
                <CardDescription>
                  {facilities.length} facilities in your jurisdiction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {facilities.map(facility => (
                      <div
                        key={facility.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleDrillDown(facility.id, facility.name)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-3 w-3 rounded-full ${getStatusColor(facility.status)}`} />
                          <div>
                            <p className="font-medium">{facility.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {facility.type} • {facility.district}, {facility.province}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-lg font-semibold">{facility.queueLength}</p>
                            <p className="text-xs text-muted-foreground">Queue</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold">{facility.avgWaitMinutes}m</p>
                            <p className="text-xs text-muted-foreground">Avg Wait</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold">{facility.staffOnDuty}</p>
                            <p className="text-xs text-muted-foreground">Staff</p>
                          </div>
                          {getStatusBadge(facility.status)}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>SLA breaches and operational alerts across jurisdiction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {facilities
                    .filter(f => f.slaBreaches > 0)
                    .map(facility => (
                      <Alert key={facility.id} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{facility.name}</AlertTitle>
                        <AlertDescription>
                          {facility.slaBreaches} SLA breach(es) • Average wait time: {facility.avgWaitMinutes} minutes
                        </AlertDescription>
                      </Alert>
                    ))}
                  {facilities.filter(f => f.slaBreaches > 0).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p>No active alerts at this time.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interventions" className="mt-4">
            {activeSession && (
              <InterventionsList sessionId={activeSession.id} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AboveSiteDashboard;
