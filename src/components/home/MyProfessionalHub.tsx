// My Professional Hub - Professional command center for providers
// Shows aggregated view across all affiliations, patients, credentials, and schedule

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Building2,
  Calendar,
  Users,
  FileText,
  GraduationCap,
  AlertTriangle,
  Clock,
  ChevronRight,
  Search,
  Shield,
  Star,
  MapPin,
  Briefcase,
  Activity,
  Bell,
  CheckCircle2,
  XCircle,
  Filter,
  Play,
  Eye,
  MessageSquare,
  User,
  Award,
  BookOpen,
  TrendingUp,
  ClipboardList,
  Stethoscope,
  Crown,
  Globe,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProviderFacilities, type ProviderFacility } from '@/hooks/useProviderFacilities';
import { LandelaNotificationsPanel } from '@/components/professional/LandelaNotificationsPanel';
import { ProfessionalEmailPanel } from '@/components/professional/ProfessionalEmailPanel';

// Mock data for demonstration
const mockPriorityItems = [
  { id: '1', type: 'result', title: 'Critical K+ 7.2', patient: 'M. Ndlovu', context: 'Virtual', time: '2 min ago', severity: 'critical' },
  { id: '2', type: 'signature', title: 'Discharge summary pending', patient: 'T. Moyo', context: 'Parirenyatwa', time: 'Today', severity: 'warning' },
  { id: '3', type: 'callback', title: 'Missed specialist callback', patient: 'Referral', context: 'System', time: 'Yesterday', severity: 'info' },
];

const mockPatients = [
  { id: '1', name: 'T. Moyo', context: 'Virtual', lastSeen: '3 days ago', status: 'due', statusLabel: '⚠️ Due' },
  { id: '2', name: 'M. Ndlovu', context: 'Virtual', lastSeen: 'Today', status: 'critical', statusLabel: '🔴 Critical' },
  { id: '3', name: 'S. Dube', context: 'Parirenyatwa', lastSeen: '1 week', status: 'stable', statusLabel: 'Stable' },
  { id: '4', name: 'R. Chuma', context: 'Avenues', lastSeen: '2 weeks', status: 'stable', statusLabel: 'Stable' },
];

const mockSchedule = [
  { id: '1', time: '08:00', title: 'Shift @ Parirenyatwa', location: 'Ward 3A', type: 'shift' },
  { id: '2', time: '14:00', title: 'Virtual consult - T. Moyo', location: 'Online', type: 'consult' },
  { id: '3', time: '15:30', title: 'Virtual consult - S. Dube', location: 'Online', type: 'consult' },
];

const mockCPD = {
  cycleStart: '2024-04-01',
  cycleEnd: '2026-03-31',
  pointsRequired: 25,
  pointsEarned: 18,
  pointsPending: 3,
};

interface MyProfessionalHubProps {
  onStartShift?: (facility: ProviderFacility) => void;
  onSwitchToWork?: () => void;
}

export function MyProfessionalHub({ onStartShift, onSwitchToWork }: MyProfessionalHubProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { facilities, loading: facilitiesLoading } = useProviderFacilities();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientFilter, setPatientFilter] = useState<string>('all');

  const getDisplayName = () => {
    const role = profile?.role;
    const name = profile?.display_name || 'Professional';
    if (role === 'doctor' || role === 'specialist') return `Dr ${name}`;
    if (role === 'nurse') return `Nurse ${name}`;
    return name;
  };

  const isClinicalRole = ['doctor', 'nurse', 'specialist', 'pharmacist'].includes(profile?.role || '');

  const handleStartShift = (facility: ProviderFacility) => {
    onStartShift?.(facility);
    toast.success(`Starting shift at ${facility.facility_name}`, {
      description: 'Switching to Work tab...',
    });
    // Switch to work tab after a brief delay
    setTimeout(() => {
      onSwitchToWork?.();
    }, 500);
  };

  const handleStartVirtualSession = () => {
    toast.success('Starting virtual practice session', {
      description: 'Your license-anchored session is now active.',
    });
    navigate('/telemedicine');
  };

  // Aggregate stats
  const stats = {
    pendingResults: 12,
    awaitingSignature: 3,
    referralsToMe: 5,
    followUpsDue: 8,
  };

  const filteredPatients = mockPatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(patientSearch.toLowerCase());
    const matchesFilter = patientFilter === 'all' || p.context.toLowerCase() === patientFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
        <TabsList className="grid w-full grid-cols-5 h-10 p-1 mb-2 flex-shrink-0">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
          <TabsTrigger value="affiliations" className="text-xs sm:text-sm">Affiliations</TabsTrigger>
          <TabsTrigger value="patients" className="text-xs sm:text-sm">{isClinicalRole ? 'My Patients' : 'My Tasks'}</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs sm:text-sm">Schedule</TabsTrigger>
          <TabsTrigger value="credentials" className="text-xs sm:text-sm">Credentials</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="flex-1 overflow-auto space-y-4 mt-0">
          {/* Priority Attention */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-600" />
                Priority Attention ({mockPriorityItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4 space-y-2">
              {mockPriorityItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-white transition-colors ${
                    item.severity === 'critical' ? 'border-red-300 bg-red-50' :
                    item.severity === 'warning' ? 'border-amber-300 bg-amber-50' :
                    'border-gray-200 bg-white'
                  }`}
                  onClick={() => navigate('/encounter')}
                >
                  <div className="flex items-center gap-3">
                    {item.severity === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    {item.severity === 'warning' && <FileText className="h-5 w-5 text-amber-500" />}
                    {item.severity === 'info' && <Bell className="h-5 w-5 text-blue-500" />}
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.patient} • {item.context}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* At a Glance Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/lims')}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">{stats.pendingResults}</p>
                <p className="text-xs text-muted-foreground">Pending Results</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/orders')}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-amber-600">{stats.awaitingSignature}</p>
                <p className="text-xs text-muted-foreground">Awaiting Signature</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/telemedicine?tab=referrals')}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-teal-600">{stats.referralsToMe}</p>
                <p className="text-xs text-muted-foreground">Referrals to Me</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/appointments')}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">{stats.followUpsDue}</p>
                <p className="text-xs text-muted-foreground">Follow-ups Due</p>
              </CardContent>
            </Card>
          </div>

          {/* Today's Schedule */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4 space-y-2">
              {mockSchedule.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Badge variant={item.type === 'shift' ? 'default' : 'secondary'} className="w-14 justify-center">
                      {item.time}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {item.location}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Patient Panel Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {facilities.slice(0, 3).map((facility) => (
              <Card key={facility.facility_id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm truncate">{facility.facility_name}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Patients</span>
                    <span className="font-semibold">{Math.floor(Math.random() * 50) + 10}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active</span>
                    <span className="font-semibold text-green-600">{Math.floor(Math.random() * 10) + 1}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Professional Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm">License: <span className="font-medium text-green-600">Active</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span className="text-sm">CPD: <span className="font-medium">{mockCPD.pointsEarned}/{mockCPD.pointsRequired} points</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Renews: 6 months</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('credentials')}>
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Landela DMS & Email - Ministry of Health Integration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LandelaNotificationsPanel compact />
            <ProfessionalEmailPanel compact />
          </div>
        </TabsContent>

        {/* Affiliations Tab */}
        <TabsContent value="affiliations" className="flex-1 overflow-auto mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-3 pr-4">
              {facilitiesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading affiliations...</div>
              ) : facilities.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <h4 className="font-medium mb-1">No Affiliations Found</h4>
                    <p className="text-sm text-muted-foreground">Contact your administrator to assign facilities.</p>
                  </CardContent>
                </Card>
              ) : (
                facilities.map((facility) => (
                  <motion.div
                    key={facility.facility_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{facility.facility_name}</h4>
                                {facility.is_pic && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Crown className="h-3 w-3 mr-1" />
                                    PIC
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {facility.context_label} • {facility.level_of_care}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" /> 
                                  {Math.floor(Math.random() * 50) + 10} patients
                                </span>
                                <span className="flex items-center gap-1">
                                  <Activity className="h-3 w-3 text-green-500" /> 
                                  Active
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleStartShift(facility)}
                              className="gap-1"
                            >
                              <Play className="h-3 w-3" />
                              Start Shift
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigate('/operations')}>
                              <Eye className="h-3 w-3 mr-1" />
                              View Facility
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}

              {/* Virtual/Independent Practice */}
              <Card className="border-dashed border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Independent Practice (Virtual)</h4>
                        <p className="text-sm text-muted-foreground">License-anchored • No facility required</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> 23 virtual patients
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleStartVirtualSession}>
                      <Globe className="h-3 w-3 mr-1" />
                      Start Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Patients/Tasks Tab */}
        <TabsContent value="patients" className="flex-1 overflow-auto mt-0 space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Context Filter Pills */}
          <div className="flex gap-2 flex-wrap">
            <Badge 
              variant={patientFilter === 'all' ? 'default' : 'outline'} 
              className="cursor-pointer"
              onClick={() => setPatientFilter('all')}
            >
              All
            </Badge>
            {['Parirenyatwa', 'Avenues', 'Virtual'].map((ctx) => (
              <Badge 
                key={ctx}
                variant={patientFilter.toLowerCase() === ctx.toLowerCase() ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setPatientFilter(ctx)}
              >
                {ctx}
              </Badge>
            ))}
          </div>

          {/* Patient List */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {filteredPatients.map((patient) => (
                <Card key={patient.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {patient.context} • Last seen: {patient.lastSeen}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          patient.status === 'critical' ? 'destructive' :
                          patient.status === 'due' ? 'secondary' : 'outline'
                        }>
                          {patient.statusLabel}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="flex-1 overflow-auto mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Merged Schedule (All Contexts)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Today */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Today</h4>
                <div className="space-y-2">
                  {mockSchedule.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Badge variant={item.type === 'shift' ? 'default' : 'secondary'}>
                        {item.time}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tomorrow */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tomorrow</h4>
                <div className="p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge>08:00</Badge>
                    <div>
                      <p className="font-medium">Locum @ Avenues Clinic</p>
                      <p className="text-xs text-muted-foreground">General Practice</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="flex-1 overflow-auto mt-0 space-y-4">
          {/* License Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Professional License
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold">License Active</p>
                    <p className="text-sm text-muted-foreground">MDPCZ-2024-12345</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-medium">2026-12-31</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CPD Tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                CPD Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Cycle: 2024-2026</span>
                  <span className="text-sm font-medium">{mockCPD.pointsEarned}/{mockCPD.pointsRequired} points</span>
                </div>
                <Progress value={(mockCPD.pointsEarned / mockCPD.pointsRequired) * 100} className="h-2" />
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{mockCPD.pointsRequired - mockCPD.pointsEarned} points needed</span>
                  <span>Deadline: {mockCPD.cycleEnd}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Browse Courses
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Award className="h-4 w-4 mr-1" />
                  Log Activity
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">BLS Provider</p>
                    <p className="text-xs text-muted-foreground">American Heart Association</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-300">Valid</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">ACLS Provider</p>
                    <p className="text-xs text-muted-foreground">American Heart Association</p>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-300">Expiring Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
