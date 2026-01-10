import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, Users, Clock, AlertTriangle, CheckCircle, Eye, Send } from 'lucide-react';
import { useRosterData, RosterPlan, ShiftDefinition, ShiftAssignment } from '@/hooks/useRosterData';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';

interface RosterDashboardProps {
  facilityId: string;
  facilityName: string;
}

export function RosterDashboard({ facilityId, facilityName }: RosterDashboardProps) {
  const {
    loading,
    fetchRosterPlans,
    fetchShiftDefinitions,
    fetchShiftAssignments,
    createRosterPlan,
    publishRosterPlan,
    checkIsSupervisor
  } = useRosterData();

  const [rosterPlans, setRosterPlans] = useState<RosterPlan[]>([]);
  const [shiftDefinitions, setShiftDefinitions] = useState<ShiftDefinition[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RosterPlan | null>(null);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanStart, setNewPlanStart] = useState('');
  const [newPlanEnd, setNewPlanEnd] = useState('');
  const [newPlanNotes, setNewPlanNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [facilityId]);

  useEffect(() => {
    if (selectedPlan) {
      loadAssignments(selectedPlan.id);
    }
  }, [selectedPlan]);

  const loadData = async () => {
    const [plans, shifts, supervisor] = await Promise.all([
      fetchRosterPlans(facilityId),
      fetchShiftDefinitions(facilityId),
      checkIsSupervisor(facilityId)
    ]);
    
    setRosterPlans(plans);
    setShiftDefinitions(shifts);
    setIsSupervisor(supervisor);
    
    // Auto-select the first published or draft plan
    const activePlan = plans.find(p => p.status === 'published') || plans.find(p => p.status === 'draft');
    if (activePlan) {
      setSelectedPlan(activePlan);
    }
  };

  const loadAssignments = async (planId: string) => {
    const data = await fetchShiftAssignments(planId);
    setAssignments(data);
  };

  const handleCreatePlan = async () => {
    if (!newPlanName || !newPlanStart || !newPlanEnd) return;
    
    const plan = await createRosterPlan(
      facilityId,
      newPlanName,
      newPlanStart,
      newPlanEnd,
      newPlanNotes || undefined
    );
    
    if (plan) {
      setRosterPlans(prev => [plan, ...prev]);
      setSelectedPlan(plan);
      setShowCreateDialog(false);
      setNewPlanName('');
      setNewPlanStart('');
      setNewPlanEnd('');
      setNewPlanNotes('');
    }
  };

  const handlePublishPlan = async () => {
    if (!selectedPlan) return;
    
    const success = await publishRosterPlan(selectedPlan.id);
    if (success) {
      setSelectedPlan(prev => prev ? { ...prev, status: 'published' } : null);
      setRosterPlans(prev => prev.map(p => 
        p.id === selectedPlan.id ? { ...p, status: 'published' } : p
      ));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'draft': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'archived': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const getShiftColor = (shiftType: string) => {
    switch (shiftType) {
      case 'am': return 'bg-blue-500/10 text-blue-500';
      case 'pm': return 'bg-orange-500/10 text-orange-500';
      case 'night': return 'bg-purple-500/10 text-purple-500';
      case 'on_call': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted';
    }
  };

  // Group assignments by date
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const date = assignment.assignment_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(assignment);
    return acc;
  }, {} as Record<string, ShiftAssignment[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Roster Management</h2>
          <p className="text-muted-foreground">{facilityName}</p>
        </div>
        {isSupervisor && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Roster Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Roster Plan</DialogTitle>
                <DialogDescription>
                  Create a new roster plan for the facility
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Plan Name</Label>
                  <Input
                    placeholder="Week 1 January 2026"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newPlanStart}
                      onChange={(e) => setNewPlanStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newPlanEnd}
                      onChange={(e) => setNewPlanEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Any notes about this roster period..."
                    value={newPlanNotes}
                    onChange={(e) => setNewPlanNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreatePlan} disabled={loading} className="w-full">
                  Create Roster Plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Current Roster</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="plans">All Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {selectedPlan ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {selectedPlan.name}
                    </CardTitle>
                    <CardDescription>
                      {format(parseISO(selectedPlan.period_start), 'MMM d, yyyy')} - {format(parseISO(selectedPlan.period_end), 'MMM d, yyyy')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedPlan.status)}>
                      {selectedPlan.status}
                    </Badge>
                    {isSupervisor && selectedPlan.status === 'draft' && (
                      <Button size="sm" onClick={handlePublishPlan} disabled={loading}>
                        <Send className="h-4 w-4 mr-2" />
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {Object.keys(groupedAssignments).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(groupedAssignments).map(([date, dayAssignments]) => (
                      <div key={date} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">
                          {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {dayAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{assignment.provider_name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {assignment.workspace_name || assignment.pool_name || 'Unassigned'}
                                </p>
                              </div>
                              <Badge className={getShiftColor(assignment.shift_type || 'am')}>
                                {assignment.shift_name || assignment.shift_type?.toUpperCase()}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No shift assignments yet</p>
                    {isSupervisor && (
                      <Button variant="outline" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Assignments
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No roster plans found</p>
                {isSupervisor && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Roster Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Calendar view coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4">
            {rosterPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-colors ${
                  selectedPlan?.id === plan.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>
                        {format(parseISO(plan.period_start), 'MMM d')} - {format(parseISO(plan.period_end), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(plan.status)}>
                      {plan.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {rosterPlans.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No roster plans found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
