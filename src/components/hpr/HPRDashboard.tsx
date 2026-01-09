/**
 * HPR Dashboard - Overview statistics and key metrics
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Building, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Shield,
  Calendar,
  FileText,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LIFECYCLE_STATE_METADATA, type ProviderLifecycleState } from '@/types/hpr';

interface DashboardStats {
  totalProviders: number;
  byState: Record<string, number>;
  byCouncil: { code: string; name: string; count: number }[];
  byCadre: { cadre: string; count: number }[];
  recentRegistrations: number;
  pendingVerifications: number;
  expiringLicenses: number;
  recentAuditActions: number;
}

export function HPRDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // Get total providers and by state
      const { data: providers } = await supabase
        .from('health_providers')
        .select('id, lifecycle_state, cadre, professional_council_id, created_at, council_registration_expires');

      const totalProviders = providers?.length || 0;
      
      const byState: Record<string, number> = {};
      const byCadreMap: Record<string, number> = {};
      let pendingVerifications = 0;
      let recentRegistrations = 0;
      let expiringLicenses = 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      providers?.forEach(p => {
        byState[p.lifecycle_state] = (byState[p.lifecycle_state] || 0) + 1;
        if (p.cadre) {
          byCadreMap[p.cadre] = (byCadreMap[p.cadre] || 0) + 1;
        }
        if (p.lifecycle_state === 'pending_council_verification') {
          pendingVerifications++;
        }
        if (new Date(p.created_at) > thirtyDaysAgo) {
          recentRegistrations++;
        }
        if (p.council_registration_expires && new Date(p.council_registration_expires) < thirtyDaysFromNow) {
          expiringLicenses++;
        }
      });

      // Get councils with counts
      const { data: councils } = await supabase
        .from('professional_councils')
        .select('code, name, abbreviation');

      const byCouncil = (councils || []).map(c => {
        const count = providers?.filter(p => p.professional_council_id === c.code).length || 0;
        return { code: c.code, name: c.abbreviation, count };
      });

      // Get recent audit actions
      const { count: auditCount } = await supabase
        .from('hpr_audit_log')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      setStats({
        totalProviders,
        byState,
        byCouncil,
        byCadre: Object.entries(byCadreMap).map(([cadre, count]) => ({ cadre, count })).sort((a, b) => b.count - a.count),
        recentRegistrations,
        pendingVerifications,
        expiringLicenses,
        recentAuditActions: auditCount || 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const activeProviders = stats?.byState['active'] || 0;
  const activePercentage = stats?.totalProviders ? Math.round((activeProviders / stats.totalProviders) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Providers</p>
                <p className="text-2xl font-bold">{stats?.totalProviders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeProviders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Verification</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.pendingVerifications || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-red-600">{stats?.expiringLicenses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Registry Health</span>
              <Badge variant="outline" className="text-green-600">{activePercentage}% Active</Badge>
            </div>
            <Progress value={activePercentage} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">New This Month</p>
                <p className="text-xl font-bold">{stats?.recentRegistrations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Audit Actions (30d)</p>
                <p className="text-xl font-bold">{stats?.recentAuditActions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lifecycle State Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Provider Lifecycle States
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(LIFECYCLE_STATE_METADATA).map(([state, meta]) => {
                const count = stats?.byState[state] || 0;
                const percentage = stats?.totalProviders ? (count / stats.totalProviders) * 100 : 0;
                return (
                  <div key={state} className="flex items-center gap-3">
                    <Badge className={`${meta.color} w-28 justify-center`}>{meta.label}</Badge>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              By Professional Council
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.byCouncil.map(c => {
                const percentage = stats?.totalProviders ? (c.count / stats.totalProviders) * 100 : 0;
                return (
                  <div key={c.code} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-16">{c.name}</span>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{c.count}</span>
                  </div>
                );
              })}
              {(!stats?.byCouncil || stats.byCouncil.length === 0) && (
                <p className="text-muted-foreground text-sm text-center py-4">No council data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Cadres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Distribution by Cadre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats?.byCadre.slice(0, 10).map(c => (
              <Badge key={c.cadre} variant="secondary" className="capitalize">
                {c.cadre.replace(/_/g, ' ')} ({c.count})
              </Badge>
            ))}
            {(!stats?.byCadre || stats.byCadre.length === 0) && (
              <p className="text-muted-foreground text-sm">No cadre data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
