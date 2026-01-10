import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Clock, AlertTriangle, CheckCircle, MapPin, Phone, RefreshCw } from 'lucide-react';
import { useRosterData, TodaysRosterAssignment } from '@/hooks/useRosterData';
import { format } from 'date-fns';

interface OnDutyStaff {
  id: string;
  provider_name: string;
  workspace_name: string | null;
  pool_name: string | null;
  shift_name: string;
  shift_type: string;
  started_at: string;
  is_rostered: boolean;
  is_late: boolean;
}

interface OnDutyViewProps {
  facilityId: string;
  facilityName: string;
}

export function OnDutyView({ facilityId, facilityName }: OnDutyViewProps) {
  const { fetchShiftAssignments, fetchRosterPlans, checkIsSupervisor } = useRosterData();
  const [onDutyStaff, setOnDutyStaff] = useState<OnDutyStaff[]>([]);
  const [missingStaff, setMissingStaff] = useState<any[]>([]);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadOnDutyData();
    const interval = setInterval(loadOnDutyData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [facilityId]);

  const loadOnDutyData = async () => {
    setLoading(true);
    try {
      const supervisor = await checkIsSupervisor(facilityId);
      setIsSupervisor(supervisor);

      // Get published roster for today
      const plans = await fetchRosterPlans(facilityId, 'published');
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Find plan that covers today
      const currentPlan = plans.find(p => 
        p.period_start <= today && p.period_end >= today
      );

      if (currentPlan) {
        const assignments = await fetchShiftAssignments(currentPlan.id, today);
        
        // Mock on-duty status - in production this would come from shifts table
        const onDuty = assignments.map((a, idx) => ({
          id: a.id,
          provider_name: a.provider_name || 'Unknown',
          workspace_name: a.workspace_name,
          pool_name: a.pool_name,
          shift_name: a.shift_name || 'Shift',
          shift_type: a.shift_type || 'am',
          started_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          is_rostered: true,
          is_late: idx % 5 === 0 // Mock some as late
        }));
        
        setOnDutyStaff(onDuty);
        
        // Mock missing staff
        setMissingStaff([]);
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading on-duty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShiftColor = (shiftType: string) => {
    switch (shiftType) {
      case 'am': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pm': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'night': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'on_call': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Group staff by workspace/pool
  const groupedStaff = onDutyStaff.reduce((acc, staff) => {
    const location = staff.workspace_name || staff.pool_name || 'Unassigned';
    if (!acc[location]) acc[location] = [];
    acc[location].push(staff);
    return acc;
  }, {} as Record<string, OnDutyStaff[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">On-Duty Now</h2>
          <p className="text-muted-foreground">
            {facilityName} • {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Last updated: {format(lastRefresh, 'HH:mm')}
          </p>
          <Button variant="outline" size="sm" onClick={loadOnDutyData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{onDutyStaff.length}</p>
                <p className="text-sm text-muted-foreground">On Duty</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <CheckCircle className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {onDutyStaff.filter(s => s.is_rostered).length}
                </p>
                <p className="text-sm text-muted-foreground">Rostered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {onDutyStaff.filter(s => s.is_late).length}
                </p>
                <p className="text-sm text-muted-foreground">Late Arrivals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{missingStaff.length}</p>
                <p className="text-sm text-muted-foreground">Missing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff by Location */}
      <div className="grid gap-4">
        {Object.entries(groupedStaff).map(([location, staff]) => (
          <Card key={location}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-4 w-4" />
                  {location}
                </CardTitle>
                <Badge variant="secondary">{staff.length} staff</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <Avatar>
                      <AvatarFallback>{getInitials(person.provider_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{person.provider_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          Started {format(new Date(person.started_at), 'HH:mm')}
                        </span>
                        {person.is_late && (
                          <Badge variant="destructive" className="text-xs">Late</Badge>
                        )}
                      </div>
                    </div>
                    <Badge className={getShiftColor(person.shift_type)}>
                      {person.shift_name}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {Object.keys(groupedStaff).length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No staff currently on duty</p>
              <p className="text-sm mt-1">
                Staff will appear here when they start their shifts
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Missing Staff Alert */}
      {missingStaff.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Missing Staff Alert
            </CardTitle>
            <CardDescription>
              The following rostered staff have not yet started their shift
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {missingStaff.map((person, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-background rounded-lg border"
                >
                  <Avatar>
                    <AvatarFallback>{getInitials(person.name || 'UN')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{person.name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">
                      Expected: {person.expected_time || 'N/A'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
