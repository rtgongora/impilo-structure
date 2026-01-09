/**
 * Client Registry Dashboard
 * Overview metrics and statistics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  GitMerge,
  AlertTriangle,
  TrendingUp,
  Activity,
  Heart,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { ClientRegistryCounts } from '@/types/clientRegistry';

interface ClientRegistryDashboardProps {
  counts: ClientRegistryCounts;
}

export function ClientRegistryDashboard({ counts }: ClientRegistryDashboardProps) {
  const statusData = [
    { name: 'Active', value: counts.active, color: '#10b981' },
    { name: 'Draft', value: counts.draft, color: '#f59e0b' },
    { name: 'Inactive', value: counts.inactive, color: '#6b7280' },
    { name: 'Deceased', value: counts.deceased, color: '#374151' },
    { name: 'Merged', value: counts.merged, color: '#8b5cf6' },
  ];

  const registrationTrend = [
    { month: 'Jul', registrations: 1250 },
    { month: 'Aug', registrations: 1480 },
    { month: 'Sep', registrations: 1620 },
    { month: 'Oct', registrations: 1890 },
    { month: 'Nov', registrations: 2150 },
    { month: 'Dec', registrations: 1980 },
    { month: 'Jan', registrations: 2340 },
  ];

  const provinceData = [
    { province: 'Harare', clients: 45000 },
    { province: 'Bulawayo', clients: 28000 },
    { province: 'Manicaland', clients: 22000 },
    { province: 'Midlands', clients: 18000 },
    { province: 'Masvingo', clients: 15000 },
    { province: 'Mash. West', clients: 14000 },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1 text-emerald-500" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Identities</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.active.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((counts.active / counts.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.draft.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>

        <Card className={counts.duplicates > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suspected Duplicates</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${counts.duplicates > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.duplicates}</div>
            <p className="text-xs text-muted-foreground">
              {counts.duplicates > 0 ? 'Action required' : 'No duplicates pending'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identity Status Distribution</CardTitle>
            <CardDescription>Breakdown by lifecycle state</CardDescription>
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

        {/* Registration Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registration Trend</CardTitle>
            <CardDescription>New Health IDs issued over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="registrations" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Province Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clients by Province</CardTitle>
          <CardDescription>Geographic distribution of registered clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={provinceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="province" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="clients" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Heart className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Health IDs Today</p>
                <p className="text-xl font-semibold">127</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verifications</p>
                <p className="text-xl font-semibold">89</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GitMerge className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Merges This Week</p>
                <p className="text-xl font-semibold">23</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <UserX className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deaths Recorded</p>
                <p className="text-xl font-semibold">{counts.deceased}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
