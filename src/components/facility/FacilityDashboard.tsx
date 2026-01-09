/**
 * Facility Registry Dashboard
 * Overview statistics and visualizations
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  Activity,
  TrendingUp,
  Users,
  Stethoscope,
  Pill,
  FlaskConical,
} from 'lucide-react';
import { useFacilityData, useFacilityTypes, useFacilityAdminHierarchies } from '@/hooks/useFacilityData';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export const FacilityDashboard = () => {
  const { facilities, counts } = useFacilityData({ status: 'all' });
  const { types } = useFacilityTypes();
  const { hierarchies: provinces } = useFacilityAdminHierarchies(1);

  // Calculate type distribution
  const typeDistribution = types.map(type => ({
    name: type.name,
    value: facilities.filter(f => f.facility_type_id === type.id).length,
    category: type.category,
  })).filter(t => t.value > 0);

  // Calculate province distribution
  const provinceDistribution = provinces.map(province => ({
    name: province.name,
    count: facilities.filter(f => f.admin_hierarchy_id === province.id).length,
  })).filter(p => p.count > 0).sort((a, b) => b.count - a.count);

  // Status distribution for pie chart
  const statusData = [
    { name: 'Approved', value: counts.approved, color: '#10b981' },
    { name: 'Pending', value: counts.pending, color: '#f59e0b' },
    { name: 'Draft', value: counts.draft, color: '#6b7280' },
    { name: 'Rejected', value: counts.rejected, color: '#ef4444' },
  ].filter(s => s.value > 0);

  // Category icons
  const categoryIcons: Record<string, React.ReactNode> = {
    hospital: <Building2 className="h-4 w-4" />,
    clinic: <Stethoscope className="h-4 w-4" />,
    pharmacy: <Pill className="h-4 w-4" />,
    laboratory: <FlaskConical className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{counts.total}</p>
                <p className="text-sm text-muted-foreground">Total Facilities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {facilities.filter(f => f.operational_status === 'operational').length}
                </p>
                <p className="text-sm text-muted-foreground">Operational</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{provinces.length}</p>
                <p className="text-sm text-muted-foreground">Provinces Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {facilities.reduce((sum, f) => sum + (f.bed_count || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Beds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Approval Status</CardTitle>
            <CardDescription>Distribution of facility workflow status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Province Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Facilities by Province</CardTitle>
            <CardDescription>Geographic distribution of facilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={provinceDistribution} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Facilities by Type</CardTitle>
          <CardDescription>Breakdown by facility type and category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {typeDistribution.slice(0, 8).map(type => (
              <div 
                key={type.name}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="p-2 bg-muted rounded-lg">
                  {categoryIcons[type.category || 'hospital'] || <Building2 className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{type.name}</p>
                  <p className="text-lg font-bold">{type.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Latest facility registry changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {facilities.slice(0, 5).map(facility => (
              <div key={facility.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{facility.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {facility.city || 'Unknown location'} • {facility.facility_type || 'Unknown type'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    facility.workflow_status === 'approved' ? 'default' :
                    facility.workflow_status === 'pending_approval' ? 'secondary' : 'outline'
                  }>
                    {facility.workflow_status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(facility.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
