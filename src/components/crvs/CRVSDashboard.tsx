import { useState, useEffect } from "react";
import { 
  BarChart3, Baby, Skull, FileText, Users, 
  TrendingUp, Clock, CheckCircle, AlertTriangle, MapPin
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DashboardStats {
  birthsToday: number;
  birthsThisMonth: number;
  deathsToday: number;
  deathsThisMonth: number;
  pendingRegistrations: number;
  certificatesIssued: number;
  communityReports: number;
  completionRate: number;
}

export function CRVSDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    birthsToday: 0,
    birthsThisMonth: 0,
    deathsToday: 0,
    deathsThisMonth: 0,
    pendingRegistrations: 0,
    certificatesIssued: 0,
    communityReports: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // Get birth counts
      const { count: birthsToday } = await supabase
        .from('birth_notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const { count: birthsMonth } = await supabase
        .from('birth_notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart);

      // Get death counts
      const { count: deathsToday } = await supabase
        .from('death_notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const { count: deathsMonth } = await supabase
        .from('death_notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart);

      // Get pending registrations
      const { count: pending } = await supabase
        .from('crvs_registrar_queue')
        .select('*', { count: 'exact', head: true })
        .eq('queue_status', 'pending_review');

      // Get certificates issued this month  
      const certQuery = await supabase
        .from('crvs_certificates')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStart);
      
      const certificatesCount = certQuery.count;

      // Get community reports
      const { count: communityCount } = await supabase
        .from('crvs_community_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('processed', false);

      setStats({
        birthsToday: birthsToday || 0,
        birthsThisMonth: birthsMonth || 0,
        deathsToday: deathsToday || 0,
        deathsThisMonth: deathsMonth || 0,
        pendingRegistrations: pending || 0,
        certificatesIssued: certificatesCount || 0,
        communityReports: communityCount || 0,
        completionRate: 85,
      });
    } catch (error) {
      console.error('Load stats error:', error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            CRVS Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Civil Registration and Vital Statistics Overview
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Last updated: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Baby className="w-4 h-4 text-blue-500" />
              Births Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '-' : stats.birthsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.birthsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Skull className="w-4 h-4 text-purple-500" />
              Deaths Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '-' : stats.deathsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.deathsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '-' : stats.pendingRegistrations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting registrar action
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-500" />
              Certificates Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '-' : stats.certificatesIssued}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Registration Completion Rate</CardTitle>
            <CardDescription>Events registered within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={stats.completionRate} className="flex-1" />
              <span className="text-lg font-bold">{stats.completionRate}%</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">+5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Community Reports</CardTitle>
            <CardDescription>Pending verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.communityReports}</div>
                <div className="text-xs text-muted-foreground">
                  Reports awaiting review
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quality Alerts</CardTitle>
            <CardDescription>Data quality issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  Critical
                </span>
                <Badge variant="destructive">3</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-500" />
                  Warning
                </span>
                <Badge variant="outline" className="bg-yellow-50">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Resolved Today
                </span>
                <Badge variant="outline" className="bg-green-50">8</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Registrations by Location</CardTitle>
          <CardDescription>Top provinces this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { province: 'Harare', births: 245, deaths: 78 },
              { province: 'Bulawayo', births: 156, deaths: 52 },
              { province: 'Manicaland', births: 134, deaths: 41 },
              { province: 'Mashonaland East', births: 98, deaths: 35 },
              { province: 'Midlands', births: 87, deaths: 29 },
            ].map((item) => (
              <div key={item.province} className="flex items-center gap-4">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 font-medium">{item.province}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-blue-600 w-20">
                    <Baby className="w-3 h-3 inline mr-1" />
                    {item.births}
                  </span>
                  <span className="text-sm text-purple-600 w-20">
                    <Skull className="w-3 h-3 inline mr-1" />
                    {item.deaths}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
