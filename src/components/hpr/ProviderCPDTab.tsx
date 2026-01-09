/**
 * Provider CPD/CME Management Tab
 * Track continuing professional development activities and points
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  GraduationCap, Plus, CheckCircle, XCircle, Clock, Award,
  FileText, Calendar, Target, TrendingUp
} from 'lucide-react';

interface CPDActivityType {
  id: string;
  code: string;
  name: string;
  category: string;
  default_points: number;
  max_points_per_activity: number | null;
  requires_certificate: boolean;
  requires_approval: boolean;
  description: string | null;
}

interface CPDActivity {
  id: string;
  provider_id: string;
  activity_type_id: string | null;
  title: string;
  description: string | null;
  activity_date: string;
  points_claimed: number;
  points_awarded: number | null;
  category: string;
  provider_name: string | null;
  certificate_number: string | null;
  status: string;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface CPDCycle {
  id: string;
  provider_id: string;
  cycle_start: string;
  cycle_end: string;
  points_required: number;
  points_earned: number;
  status: string;
}

interface ProviderCPDTabProps {
  providerId: string;
  isAdmin?: boolean;
}

export const ProviderCPDTab = ({ providerId, isAdmin = false }: ProviderCPDTabProps) => {
  const [activities, setActivities] = useState<CPDActivity[]>([]);
  const [activityTypes, setActivityTypes] = useState<CPDActivityType[]>([]);
  const [currentCycle, setCurrentCycle] = useState<CPDCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    activityTypeId: '',
    title: '',
    description: '',
    activityDate: '',
    pointsClaimed: 0,
    category: '',
    providerName: '',
    certificateNumber: '',
  });

  useEffect(() => {
    loadData();
  }, [providerId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadActivityTypes(),
      loadActivities(),
      loadCurrentCycle(),
    ]);
    setLoading(false);
  };

  const loadActivityTypes = async () => {
    const { data, error } = await supabase
      .from('ref_cpd_activity_types')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (!error && data) {
      setActivityTypes(data);
    }
  };

  const loadActivities = async () => {
    const { data, error } = await supabase
      .from('provider_cpd_activities')
      .select('*')
      .eq('provider_id', providerId)
      .order('activity_date', { ascending: false });

    if (!error && data) {
      setActivities(data);
    }
  };

  const loadCurrentCycle = async () => {
    const { data, error } = await supabase
      .from('provider_cpd_cycles')
      .select('*')
      .eq('provider_id', providerId)
      .eq('status', 'active')
      .single();

    if (!error && data) {
      setCurrentCycle(data);
    }
  };

  const handleActivityTypeChange = (typeId: string) => {
    const type = activityTypes.find(t => t.id === typeId);
    if (type) {
      setForm(prev => ({
        ...prev,
        activityTypeId: typeId,
        category: type.category,
        pointsClaimed: type.default_points,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.activityDate || !form.category) {
      toast.error('Please fill required fields');
      return;
    }

    const { error } = await supabase
      .from('provider_cpd_activities')
      .insert({
        provider_id: providerId,
        activity_type_id: form.activityTypeId || null,
        title: form.title,
        description: form.description || null,
        activity_date: form.activityDate,
        points_claimed: form.pointsClaimed,
        category: form.category,
        provider_name: form.providerName || null,
        certificate_number: form.certificateNumber || null,
        status: 'pending',
      });

    if (error) {
      toast.error('Failed to add activity');
    } else {
      toast.success('CPD activity submitted for approval');
      setDialogOpen(false);
      setForm({
        activityTypeId: '',
        title: '',
        description: '',
        activityDate: '',
        pointsClaimed: 0,
        category: '',
        providerName: '',
        certificateNumber: '',
      });
      loadActivities();
    }
  };

  const handleApprove = async (activityId: string, pointsAwarded: number) => {
    const { error } = await supabase
      .from('provider_cpd_activities')
      .update({
        status: 'approved',
        points_awarded: pointsAwarded,
        approved_at: new Date().toISOString(),
      })
      .eq('id', activityId);

    if (error) {
      toast.error('Failed to approve activity');
    } else {
      toast.success('Activity approved');
      loadActivities();
      // Update cycle points
      if (currentCycle) {
        await supabase
          .from('provider_cpd_cycles')
          .update({
            points_earned: currentCycle.points_earned + pointsAwarded,
          })
          .eq('id', currentCycle.id);
        loadCurrentCycle();
      }
    }
  };

  const handleReject = async (activityId: string, reason: string) => {
    const { error } = await supabase
      .from('provider_cpd_activities')
      .update({
        status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', activityId);

    if (error) {
      toast.error('Failed to reject activity');
    } else {
      toast.success('Activity rejected');
      loadActivities();
    }
  };

  const categories = [...new Set(activityTypes.map(t => t.category))];
  
  const pointsByCategory = categories.map(cat => ({
    category: cat,
    points: activities
      .filter(a => a.category === cat && a.status === 'approved')
      .reduce((sum, a) => sum + (a.points_awarded || 0), 0),
  }));

  const totalApprovedPoints = activities
    .filter(a => a.status === 'approved')
    .reduce((sum, a) => sum + (a.points_awarded || 0), 0);

  const pendingPoints = activities
    .filter(a => a.status === 'pending')
    .reduce((sum, a) => sum + a.points_claimed, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Current Cycle
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
                  Ends {format(new Date(currentCycle.cycle_end), 'PP')}
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
              <Award className="h-4 w-4" />
              Approved Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalApprovedPoints}</div>
            <p className="text-xs text-muted-foreground">
              From {activities.filter(a => a.status === 'approved').length} activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPoints}</div>
            <p className="text-xs text-muted-foreground">
              {activities.filter(a => a.status === 'pending').length} awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-xs text-muted-foreground">
              Total recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Points by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Points by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {pointsByCategory.map(({ category, points }) => (
              <Badge key={category} variant="outline" className="text-sm">
                {category}: {points} pts
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>CPD Activities</CardTitle>
              <CardDescription>Record and track your continuing education</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Record CPD Activity</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Activity Type</Label>
                    <Select 
                      value={form.activityTypeId}
                      onValueChange={handleActivityTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <div key={cat}>
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                              {cat}
                            </div>
                            {activityTypes
                              .filter(t => t.category === cat)
                              .map(type => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name} ({type.default_points} pts)
                                </SelectItem>
                              ))
                            }
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Annual Medical Conference 2024"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the activity"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={form.activityDate}
                        onChange={(e) => setForm(prev => ({ ...prev, activityDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Points Claimed *</Label>
                      <Input
                        type="number"
                        value={form.pointsClaimed}
                        onChange={(e) => setForm(prev => ({ ...prev, pointsClaimed: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Provider/Institution</Label>
                      <Input
                        value={form.providerName}
                        onChange={(e) => setForm(prev => ({ ...prev, providerName: e.target.value }))}
                        placeholder="e.g., MDCZ"
                      />
                    </div>
                    <div>
                      <Label>Certificate Number</Label>
                      <Input
                        value={form.certificateNumber}
                        onChange={(e) => setForm(prev => ({ ...prev, certificateNumber: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSubmit} className="w-full">
                    Submit for Approval
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No CPD activities recorded yet</p>
              <p className="text-sm">Start tracking your continuing education</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map(activity => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{activity.title}</div>
                        {activity.provider_name && (
                          <div className="text-xs text-muted-foreground">
                            {activity.provider_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{activity.category}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(activity.activity_date), 'PP')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {activity.status === 'approved' 
                            ? activity.points_awarded 
                            : activity.points_claimed}
                        </span>
                        {activity.status === 'pending' && (
                          <span className="text-xs text-muted-foreground">(claimed)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.status === 'approved' ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      ) : activity.status === 'rejected' ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejected
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    {isAdmin && activity.status === 'pending' && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(activity.id, activity.points_claimed)}
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(activity.id, 'Insufficient documentation')}
                            className="text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
