/**
 * HPR Reports
 * Generate reports on provider registry data
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3, 
  Download, 
  FileText,
  Users,
  Building,
  TrendingUp,
  Calendar,
  PieChart,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface ReportData {
  byState: { state: string; count: number }[];
  byCadre: { cadre: string; count: number }[];
  byCouncil: { council: string; count: number }[];
  registrationsTrend: { month: string; count: number }[];
  expiringLicenses: { month: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export function HPRReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Get all providers
      const { data: providers } = await supabase
        .from('health_providers')
        .select('id, lifecycle_state, cadre, professional_council_id, created_at, council_registration_expires');

      // By State
      const stateMap: Record<string, number> = {};
      providers?.forEach(p => {
        stateMap[p.lifecycle_state] = (stateMap[p.lifecycle_state] || 0) + 1;
      });
      const byState = Object.entries(stateMap)
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count);

      // By Cadre
      const cadreMap: Record<string, number> = {};
      providers?.forEach(p => {
        if (p.cadre) {
          cadreMap[p.cadre] = (cadreMap[p.cadre] || 0) + 1;
        }
      });
      const byCadre = Object.entries(cadreMap)
        .map(([cadre, count]) => ({ cadre: cadre.replace(/_/g, ' '), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get councils
      const { data: councils } = await supabase
        .from('professional_councils')
        .select('id, abbreviation');

      const councilMap: Record<string, string> = {};
      councils?.forEach(c => {
        councilMap[c.id] = c.abbreviation;
      });

      // By Council
      const councilCount: Record<string, number> = {};
      providers?.forEach(p => {
        if (p.professional_council_id) {
          const name = councilMap[p.professional_council_id] || p.professional_council_id;
          councilCount[name] = (councilCount[name] || 0) + 1;
        }
      });
      const byCouncil = Object.entries(councilCount)
        .map(([council, count]) => ({ council, count }))
        .sort((a, b) => b.count - a.count);

      // Registrations Trend (last 12 months)
      const registrationsTrend: { month: string; count: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'yyyy-MM');
        const monthLabel = format(date, 'MMM yy');
        const count = providers?.filter(p => p.created_at?.startsWith(monthKey)).length || 0;
        registrationsTrend.push({ month: monthLabel, count });
      }

      // Expiring Licenses (next 6 months)
      const expiringLicenses: { month: string; count: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        const monthKey = format(date, 'yyyy-MM');
        const monthLabel = format(date, 'MMM yy');
        const count = providers?.filter(p => 
          p.council_registration_expires?.startsWith(monthKey)
        ).length || 0;
        expiringLicenses.push({ month: monthLabel, count });
      }

      setReportData({
        byState,
        byCadre,
        byCouncil,
        registrationsTrend,
        expiringLicenses,
      });
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;
    
    const content = {
      generatedAt: new Date().toISOString(),
      ...reportData,
    };
    
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hpr-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reports & Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Insights into the Health Provider Registry
          </p>
        </div>
        <Button onClick={exportReport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Report Selector */}
      <div className="flex gap-2">
        {[
          { id: 'overview', label: 'Overview', icon: PieChart },
          { id: 'trends', label: 'Trends', icon: TrendingUp },
          { id: 'councils', label: 'By Council', icon: Building },
          { id: 'cadres', label: 'By Cadre', icon: Users },
        ].map(report => (
          <Button
            key={report.id}
            variant={selectedReport === report.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedReport(report.id)}
          >
            <report.icon className="h-4 w-4 mr-2" />
            {report.label}
          </Button>
        ))}
      </div>

      {/* Report Content */}
      {selectedReport === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* State Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Provider Lifecycle States</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={reportData?.byState}
                    dataKey="count"
                    nameKey="state"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ state, percent }) => `${state} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {reportData?.byState.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expiring Licenses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Expiring Licenses (Next 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData?.expiringLicenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" name="Expiring" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedReport === 'trends' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              New Registrations (Last 12 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData?.registrationsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Registrations" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {selectedReport === 'councils' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              Providers by Professional Council
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportData?.byCouncil.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No council assignment data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData?.byCouncil} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="council" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="Providers" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {selectedReport === 'cadres' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top 10 Cadres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData?.byCadre} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="cadre" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" name="Providers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Cadres</div>
            <div className="text-2xl font-bold">{reportData?.byCadre.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Councils Represented</div>
            <div className="text-2xl font-bold">{reportData?.byCouncil.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Lifecycle States</div>
            <div className="text-2xl font-bold">{reportData?.byState.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Report Generated</div>
            <div className="text-lg font-medium">{format(new Date(), 'dd MMM yyyy')}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
