/**
 * My CME Dashboard - Practitioner Self-Service CPD Portal
 * For module home - practitioners manage their professional development
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { 
  GraduationCap, Award, Clock, Target, Calendar, 
  FileText, CheckCircle, AlertTriangle, TrendingUp,
  BookOpen, Users, Mic, FileCheck, Plus
} from 'lucide-react';
import { ProviderCPDTab } from './ProviderCPDTab';
import { ProviderDocumentsTab } from './ProviderDocumentsTab';
import { LicenseRenewalTab } from './LicenseRenewalTab';

interface CPDCycle {
  id: string;
  cycle_start: string;
  cycle_end: string;
  points_required: number;
  points_earned: number;
  status: string;
}

interface License {
  id: string;
  registration_number: string;
  license_category: string;
  council_name: string;
  expiry_date: string;
  status: string;
}

export const MyCMEDashboard = () => {
  const { user } = useAuth();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [currentCycle, setCurrentCycle] = useState<CPDCycle | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [pendingActivities, setPendingActivities] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      loadProviderData();
    }
  }, [user]);

  const loadProviderData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Get provider ID from user
    const { data: provider, error: providerError } = await supabase
      .from('health_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (providerError || !provider) {
      setLoading(false);
      return;
    }

    setProviderId(provider.id);

    // Load data in parallel
    const [cycleResult, licensesResult, activitiesResult] = await Promise.all([
      supabase
        .from('provider_cpd_cycles')
        .select('*')
        .eq('provider_id', provider.id)
        .eq('status', 'active')
        .single(),
      supabase
        .from('provider_licenses')
        .select('*')
        .eq('provider_id', provider.id)
        .eq('status', 'active'),
      supabase
        .from('provider_cpd_activities')
        .select('id')
        .eq('provider_id', provider.id)
        .eq('status', 'pending'),
    ]);

    if (cycleResult.data) setCurrentCycle(cycleResult.data);
    if (licensesResult.data) setLicenses(licensesResult.data);
    if (activitiesResult.data) setPendingActivities(activitiesResult.data.length);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!providerId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Provider Profile Found</h3>
          <p className="text-muted-foreground mb-4">
            Your account is not linked to a health provider profile.
          </p>
          <Button>Request Profile Link</Button>
        </CardContent>
      </Card>
    );
  }

  const daysUntilCycleEnd = currentCycle 
    ? differenceInDays(new Date(currentCycle.cycle_end), new Date())
    : 0;

  const expiringLicenses = licenses.filter(l => {
    const daysUntilExpiry = differenceInDays(new Date(l.expiry_date), new Date());
    return daysUntilExpiry <= 90;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          My Professional Development
        </h2>
        <p className="text-muted-foreground">
          Track your CME/CPD activities, manage documents, and renew licenses
        </p>
      </div>

      {/* Alerts */}
      {(expiringLicenses.length > 0 || (currentCycle && daysUntilCycleEnd < 60)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiringLicenses.length > 0 && (
            <Card className="border-destructive">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  License Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiringLicenses.map(license => (
                  <div key={license.id} className="flex items-center justify-between">
                    <span className="text-sm">{license.license_category}</span>
                    <span className="text-sm text-muted-foreground">
                      Expires {format(new Date(license.expiry_date), 'PP')}
                    </span>
                  </div>
                ))}
                <Button size="sm" className="mt-2 w-full" onClick={() => setActiveTab('licenses')}>
                  Start Renewal
                </Button>
              </CardContent>
            </Card>
          )}
          
          {currentCycle && daysUntilCycleEnd < 60 && currentCycle.points_earned < currentCycle.points_required && (
            <Card className="border-warning">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-warning">
                  <Clock className="h-4 w-4" />
                  CPD Cycle Ending Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {daysUntilCycleEnd} days remaining. 
                  You need {currentCycle.points_required - currentCycle.points_earned} more points.
                </p>
                <Button size="sm" className="mt-2 w-full" variant="outline" onClick={() => setActiveTab('cpd')}>
                  Add Activities
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              CPD Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentCycle ? (
              <>
                <div className="text-2xl font-bold">
                  {currentCycle.points_earned}/{currentCycle.points_required}
                </div>
                <Progress 
                  value={(currentCycle.points_earned / currentCycle.points_required) * 100} 
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {daysUntilCycleEnd} days remaining
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No active cycle</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Active Licenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenses.length}</div>
            {expiringLicenses.length > 0 && (
              <Badge variant="destructive" className="mt-1">
                {expiringLicenses.length} expiring
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingActivities}</div>
            <p className="text-xs text-muted-foreground">
              activities awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Next Renewal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {licenses.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {format(new Date(Math.min(...licenses.map(l => new Date(l.expiry_date).getTime()))), 'MMM yyyy')}
                </div>
                <p className="text-xs text-muted-foreground">
                  earliest expiry
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No licenses</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cpd">CPD Activities</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setActiveTab('cpd')}
                >
                  <BookOpen className="h-6 w-6" />
                  <span>Log Activity</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setActiveTab('documents')}
                >
                  <FileCheck className="h-6 w-6" />
                  <span>Upload Certificate</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setActiveTab('licenses')}
                >
                  <Award className="h-6 w-6" />
                  <span>Renew License</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Users className="h-6 w-6" />
                  <span>Find Events</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">CPD Categories</CardTitle>
              <CardDescription>Points breakdown by activity type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {['Educational', 'Clinical', 'Research', 'Teaching', 'Professional'].map(category => (
                  <div key={category} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-xs text-muted-foreground">{category}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Licenses Overview */}
          {licenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">My Licenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {licenses.map(license => {
                    const daysUntil = differenceInDays(new Date(license.expiry_date), new Date());
                    const isExpiring = daysUntil <= 90;
                    
                    return (
                      <div 
                        key={license.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{license.license_category}</div>
                          <div className="text-sm text-muted-foreground">
                            {license.registration_number} • {license.council_name}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={isExpiring ? 'destructive' : 'secondary'}>
                            {isExpiring ? `${daysUntil}d left` : 'Active'}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            Expires {format(new Date(license.expiry_date), 'PP')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cpd">
          <ProviderCPDTab providerId={providerId} />
        </TabsContent>

        <TabsContent value="documents">
          <ProviderDocumentsTab providerId={providerId} />
        </TabsContent>

        <TabsContent value="licenses">
          <LicenseRenewalTab providerId={providerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
