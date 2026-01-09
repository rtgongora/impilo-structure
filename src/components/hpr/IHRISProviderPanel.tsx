/**
 * iHRIS v5 Aligned Provider Detail Panel
 * Comprehensive HR management UI with all iHRIS sections
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  User,
  GraduationCap,
  Briefcase,
  Award,
  Calendar,
  Shield,
  AlertTriangle,
  Star,
  DollarSign,
  Phone,
  Users,
  CreditCard,
  FileText,
  Building,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
} from 'lucide-react';
import type { HealthProvider } from '@/types/hpr';
import { IHRISService } from '@/services/ihrisService';
import type {
  ProviderEducation,
  ProviderTraining,
  ProviderEmploymentHistory,
  ProviderLeave,
  ProviderDisciplinary,
  ProviderPerformance,
  ProviderSalary,
  ProviderEmergencyContact,
  ProviderDependent,
  ProviderIdentifier,
} from '@/types/ihris';
import { format } from 'date-fns';
import { ProviderEditForm } from './ProviderEditForm';

interface IHRISProviderPanelProps {
  provider: HealthProvider;
  onProviderUpdated?: () => void;
}

type TabValue = 'overview' | 'education' | 'employment' | 'training' | 'leave' | 'performance' | 'salary' | 'personal';

export function IHRISProviderPanel({ provider, onProviderUpdated }: IHRISProviderPanelProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Data state
  const [education, setEducation] = useState<ProviderEducation[]>([]);
  const [training, setTraining] = useState<ProviderTraining[]>([]);
  const [employmentHistory, setEmploymentHistory] = useState<ProviderEmploymentHistory[]>([]);
  const [leave, setLeave] = useState<ProviderLeave[]>([]);
  const [disciplinary, setDisciplinary] = useState<ProviderDisciplinary[]>([]);
  const [performance, setPerformance] = useState<ProviderPerformance[]>([]);
  const [salary, setSalary] = useState<ProviderSalary[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<ProviderEmergencyContact[]>([]);
  const [dependents, setDependents] = useState<ProviderDependent[]>([]);
  const [identifiers, setIdentifiers] = useState<ProviderIdentifier[]>([]);

  useEffect(() => {
    loadAllData();
  }, [provider.id]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        eduData,
        trainData,
        empData,
        leaveData,
        discData,
        perfData,
        salData,
        emgData,
        depData,
        idData,
      ] = await Promise.all([
        IHRISService.getEducation(provider.id).catch(() => []),
        IHRISService.getTraining(provider.id).catch(() => []),
        IHRISService.getEmploymentHistory(provider.id).catch(() => []),
        IHRISService.getLeave(provider.id).catch(() => []),
        IHRISService.getDisciplinary(provider.id).catch(() => []),
        IHRISService.getPerformance(provider.id).catch(() => []),
        IHRISService.getSalary(provider.id).catch(() => []),
        IHRISService.getEmergencyContacts(provider.id).catch(() => []),
        IHRISService.getDependents(provider.id).catch(() => []),
        IHRISService.getIdentifiers(provider.id).catch(() => []),
      ]);
      
      setEducation(eduData);
      setTraining(trainData);
      setEmploymentHistory(empData);
      setLeave(leaveData);
      setDisciplinary(discData);
      setPerformance(perfData);
      setSalary(salData);
      setEmergencyContacts(emgData);
      setDependents(depData);
      setIdentifiers(idData);
    } catch (error) {
      console.error('Failed to load provider data:', error);
      toast.error('Failed to load some provider data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd MMM yyyy');
    } catch {
      return date;
    }
  };

  const currentSalary = salary.find(s => s.is_current);
  const activeDisciplinary = disciplinary.filter(d => d.status === 'active');
  const pendingLeave = leave.filter(l => l.status === 'pending');

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              {provider.first_name} {provider.surname}
            </CardTitle>
            <CardDescription className="font-mono">{provider.upid}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeDisciplinary.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {activeDisciplinary.length} Active Warning{activeDisciplinary.length > 1 ? 's' : ''}
              </Badge>
            )}
            {pendingLeave.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                {pendingLeave.length} Pending Leave
              </Badge>
            )}
            <Button size="sm" variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 grid grid-cols-4 lg:grid-cols-8 h-auto">
          <TabsTrigger value="overview" className="text-xs py-1.5">
            <User className="h-3 w-3 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="education" className="text-xs py-1.5">
            <GraduationCap className="h-3 w-3 mr-1" />
            Education
          </TabsTrigger>
          <TabsTrigger value="training" className="text-xs py-1.5">
            <Award className="h-3 w-3 mr-1" />
            Training
          </TabsTrigger>
          <TabsTrigger value="employment" className="text-xs py-1.5">
            <Briefcase className="h-3 w-3 mr-1" />
            Work Exp
          </TabsTrigger>
          <TabsTrigger value="leave" className="text-xs py-1.5">
            <Calendar className="h-3 w-3 mr-1" />
            Leave
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs py-1.5">
            <Star className="h-3 w-3 mr-1" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="salary" className="text-xs py-1.5">
            <DollarSign className="h-3 w-3 mr-1" />
            Salary
          </TabsTrigger>
          <TabsTrigger value="personal" className="text-xs py-1.5">
            <Users className="h-3 w-3 mr-1" />
            Personal
          </TabsTrigger>
        </TabsList>

        <CardContent className="flex-1 pt-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Employee Number</h4>
                    <p className="font-mono">{(provider as any).employee_number || '-'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Hire Date</h4>
                    <p>{formatDate((provider as any).hire_date)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Classification</h4>
                    <p>{(provider as any).classification || '-'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Cadre</h4>
                    <p className="capitalize">{provider.cadre?.replace('_', ' ') || '-'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Specialty</h4>
                    <p>{provider.specialty || '-'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Nationality</h4>
                    <p>{provider.nationality || '-'}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Summary Statistics</h4>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-muted rounded-md p-2 text-center">
                      <div className="text-lg font-bold">{education.length}</div>
                      <div className="text-xs text-muted-foreground">Qualifications</div>
                    </div>
                    <div className="bg-muted rounded-md p-2 text-center">
                      <div className="text-lg font-bold">{training.length}</div>
                      <div className="text-xs text-muted-foreground">Trainings</div>
                    </div>
                    <div className="bg-muted rounded-md p-2 text-center">
                      <div className="text-lg font-bold">{employmentHistory.length}</div>
                      <div className="text-xs text-muted-foreground">Work History</div>
                    </div>
                    <div className="bg-muted rounded-md p-2 text-center">
                      <div className="text-lg font-bold">{performance.length}</div>
                      <div className="text-xs text-muted-foreground">Evaluations</div>
                    </div>
                  </div>
                </div>

                {currentSalary && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Current Compensation
                      </h4>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Grade: {currentSalary.salary_grade}</p>
                            <p className="text-lg font-bold">
                              {currentSalary.currency} {currentSalary.base_salary.toLocaleString()}
                            </p>
                          </div>
                          <Badge>{currentSalary.funds_source}</Badge>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="mt-0 space-y-3">
                {education.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No education records found</p>
                  </div>
                ) : (
                  education.map((edu) => (
                    <div key={edu.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{edu.degree_name}</h5>
                          <p className="text-sm text-muted-foreground">{edu.institution_name}</p>
                        </div>
                        <div className="flex gap-2">
                          {edu.verified && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          <Badge variant="secondary">{edu.education_level}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Major: </span>
                          {edu.major || '-'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Graduated: </span>
                          {formatDate(edu.graduation_date)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status: </span>
                          <span className="capitalize">{edu.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Training Tab */}
              <TabsContent value="training" className="mt-0 space-y-3">
                {training.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No training records found</p>
                  </div>
                ) : (
                  training.map((t) => (
                    <div key={t.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{t.training_name}</h5>
                          <p className="text-sm text-muted-foreground">{t.training_provider}</p>
                        </div>
                        <div className="flex gap-2">
                          {t.certificate_received && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              <FileText className="h-3 w-3 mr-1" />
                              Certified
                            </Badge>
                          )}
                          <Badge variant="secondary">{t.training_type}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Duration: </span>
                          {t.duration_hours ? `${t.duration_hours}h` : '-'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date: </span>
                          {formatDate(t.start_date)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sponsor: </span>
                          {t.sponsored_by || 'Self'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Employment History Tab */}
              <TabsContent value="employment" className="mt-0 space-y-3">
                {employmentHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No employment history found</p>
                  </div>
                ) : (
                  employmentHistory.map((emp) => (
                    <div key={emp.id} className={`border rounded-lg p-3 space-y-2 ${emp.is_current ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{emp.position_title}</h5>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {emp.employer_name}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {emp.is_current && (
                            <Badge className="bg-green-100 text-green-800">Current</Badge>
                          )}
                          {emp.verified && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Department: </span>
                          {emp.department || '-'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Period: </span>
                          {formatDate(emp.start_date)} - {emp.end_date ? formatDate(emp.end_date) : 'Present'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type: </span>
                          <span className="capitalize">{emp.employer_type || '-'}</span>
                        </div>
                      </div>
                      {emp.departure_reason && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Departure: </span>
                          {emp.departure_reason}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Leave Tab */}
              <TabsContent value="leave" className="mt-0 space-y-3">
                {leave.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No leave records found</p>
                  </div>
                ) : (
                  leave.map((l) => (
                    <div key={l.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium capitalize">{String(l.leave_type).replace('_', ' ')} Leave</h5>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(l.start_date)} - {formatDate(l.end_date)}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            l.status === 'approved' ? 'default' : 
                            l.status === 'pending' ? 'secondary' : 
                            l.status === 'rejected' ? 'destructive' : 'outline'
                          }
                        >
                          {l.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Days Requested: </span>
                          {l.days_requested}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Days Approved: </span>
                          {l.days_approved ?? '-'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Requested: </span>
                          {formatDate(l.requested_at)}
                        </div>
                      </div>
                      {l.reason && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Reason: </span>
                          {l.reason}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="mt-0 space-y-3">
                {performance.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No performance evaluations found</p>
                  </div>
                ) : (
                  performance.map((p) => (
                    <div key={p.id} className="border rounded-lg p-3 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{p.evaluation_period}</h5>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(p.start_date)} - {formatDate(p.end_date)}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          {p.overall_score && (
                            <div className="text-right">
                              <div className="text-lg font-bold">{p.overall_score.toFixed(1)}/5</div>
                              <div className="text-xs text-muted-foreground">Overall</div>
                            </div>
                          )}
                          <Badge variant={p.status === 'finalized' ? 'default' : 'secondary'}>
                            {p.status}
                          </Badge>
                        </div>
                      </div>
                      {p.overall_score && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {p.attendance_score && (
                            <div>
                              <span className="text-muted-foreground">Attendance: </span>
                              {p.attendance_score.toFixed(1)}
                            </div>
                          )}
                          {p.quality_score && (
                            <div>
                              <span className="text-muted-foreground">Quality: </span>
                              {p.quality_score.toFixed(1)}
                            </div>
                          )}
                          {p.teamwork_score && (
                            <div>
                              <span className="text-muted-foreground">Teamwork: </span>
                              {p.teamwork_score.toFixed(1)}
                            </div>
                          )}
                        </div>
                      )}
                      {p.evaluator_name && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Evaluator: </span>
                          {p.evaluator_name} ({p.evaluator_position || 'N/A'})
                        </div>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Salary Tab */}
              <TabsContent value="salary" className="mt-0 space-y-3">
                {salary.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No salary records found</p>
                  </div>
                ) : (
                  salary.map((s) => (
                    <div key={s.id} className={`border rounded-lg p-3 space-y-2 ${s.is_current ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">Grade {s.salary_grade}</h5>
                          <p className="text-lg font-bold">
                            {s.currency} {s.base_salary?.toLocaleString() || 0}
                            {s.pay_frequency && (
                              <span className="text-sm font-normal text-muted-foreground ml-1">
                                /{s.pay_frequency}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {s.is_current && <Badge className="bg-green-100 text-green-800">Current</Badge>}
                          {s.funds_source && <Badge variant="outline">{s.funds_source}</Badge>}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Allowances: </span>
                          {s.currency} {(s.total_allowances || 0).toLocaleString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Deductions: </span>
                          {s.currency} {(s.total_deductions || 0).toLocaleString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Net: </span>
                          {s.net_salary ? `${s.currency} ${s.net_salary.toLocaleString()}` : '-'}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Effective: </span>
                        {formatDate(s.effective_from)} - {s.effective_until ? formatDate(s.effective_until) : 'Present'}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Personal Tab */}
              <TabsContent value="personal" className="mt-0 space-y-4">
                {/* Emergency Contacts */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Emergency Contacts ({emergencyContacts.length})
                  </h4>
                  {emergencyContacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No emergency contacts</p>
                  ) : (
                    <div className="space-y-2">
                      {emergencyContacts.map((c) => (
                        <div key={c.id} className="border rounded-md p-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{c.contact_name}</span>
                            <Badge variant="outline" className="text-xs">{c.relationship}</Badge>
                          </div>
                          <div className="text-muted-foreground">{c.phone_primary}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Dependents */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Dependents ({dependents.length})
                  </h4>
                  {dependents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No dependents</p>
                  ) : (
                    <div className="space-y-2">
                      {dependents.map((d) => (
                        <div key={d.id} className="border rounded-md p-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{d.full_name}</span>
                            <Badge variant="outline" className="text-xs">{d.relationship}</Badge>
                          </div>
                          {d.date_of_birth && (
                            <div className="text-muted-foreground">DOB: {formatDate(d.date_of_birth)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Identifiers */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Identifiers ({identifiers.length})
                  </h4>
                  {identifiers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No additional identifiers</p>
                  ) : (
                    <div className="space-y-2">
                      {identifiers.map((id) => (
                        <div key={id.id} className="border rounded-md p-2 text-sm flex justify-between items-center">
                          <div>
                            <span className="font-medium capitalize">{id.identifier_type.replace('_', ' ')}</span>
                            <div className="text-muted-foreground font-mono">{id.identifier_value}</div>
                          </div>
                          {id.verified ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Disciplinary (if any) */}
                {disciplinary.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Disciplinary Records ({disciplinary.length})
                      </h4>
                      <div className="space-y-2">
                        {disciplinary.map((d) => (
                          <div key={d.id} className={`border rounded-md p-2 text-sm ${d.status === 'active' ? 'border-destructive bg-destructive/10' : ''}`}>
                            <div className="flex justify-between">
                              <span className="font-medium capitalize">{d.action_type.replace('_', ' ')}</span>
                              <Badge variant={d.status === 'active' ? 'destructive' : 'secondary'}>
                                {d.status}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground">
                              {d.incident_type} - {formatDate(d.incident_date)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </ScrollArea>
          )}
        </CardContent>
      </Tabs>

      {/* Edit Provider Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Provider: {provider.first_name} {provider.surname}</DialogTitle>
          </DialogHeader>
          <ProviderEditForm 
            provider={provider}
            onSuccess={() => {
              setEditDialogOpen(false);
              onProviderUpdated?.();
            }}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
