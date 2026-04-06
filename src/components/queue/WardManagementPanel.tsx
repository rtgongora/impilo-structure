import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Bed, Users, Activity, AlertTriangle, Building2, ArrowRightLeft,
  User, Clock, RefreshCw, ChevronRight, Stethoscope, LogOut,
  TrendingUp, Heart, FileText, Eye, UserPlus, ClipboardList,
  Pill, Thermometer, CheckCircle2, Circle, Timer, LogIn,
  ShieldCheck, CalendarCheck, Clipboard, Ban, Syringe
} from "lucide-react";
import { useBedData, WARDS, type BedData } from "@/hooks/useBedData";
import { BedCard } from "@/components/ehr/beds/BedCard";
import { toast } from "sonner";

type WardSubView = 'overview' | 'ward-detail';

export function WardManagementPanel() {
  const navigate = useNavigate();
  const { beds, loading, refetch, updateBedStatus } = useBedData();
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [subView, setSubView] = useState<WardSubView>('overview');
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);
  const [transferTargetWard, setTransferTargetWard] = useState('');
  const [transferTargetBed, setTransferTargetBed] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [patientDetailBed, setPatientDetailBed] = useState<BedData | null>(null);

  const totalBeds = beds.length;
  const totalOccupied = beds.filter(b => b.status === 'occupied').length;
  const totalAvailable = beds.filter(b => b.status === 'available').length;
  const occupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;
  const criticalPatients = beds.filter(b => b.patient?.acuityLevel === 'critical').length;

  const handleSelectWard = (wardId: string) => {
    setSelectedWardId(wardId);
    setSubView('ward-detail');
  };

  const handleBackToOverview = () => {
    setSubView('overview');
    setSelectedWardId(null);
  };

  const handleBedClick = (bed: BedData) => {
    setPatientDetailBed(bed);
  };

  const handleTransferOpen = (bed: BedData) => {
    setSelectedBed(bed);
    setTransferTargetWard('');
    setTransferTargetBed('');
    setTransferReason('');
    setTransferDialogOpen(true);
  };

  const handleTransferConfirm = async () => {
    if (!selectedBed || !transferTargetBed) return;
    
    // Discharge from current bed
    await updateBedStatus(selectedBed.id, 'discharge');
    
    // Admit to target bed
    if (selectedBed.patient) {
      await updateBedStatus(transferTargetBed, 'admit', {
        patientId: selectedBed.patient.id,
        patientName: selectedBed.patient.name,
        patientMrn: selectedBed.patient.mrn,
        diagnosis: selectedBed.patient.diagnosis,
        attendingPhysician: selectedBed.patient.attendingPhysician,
        acuityLevel: selectedBed.patient.acuityLevel,
      });
    }
    
    toast.success(`Patient transferred to ${WARDS.find(w => w.id === transferTargetWard)?.name || 'new bed'}`);
    setTransferDialogOpen(false);
    setPatientDetailBed(null);
    refetch();
  };

  const handleDischarge = async (bed: BedData) => {
    await updateBedStatus(bed.id, 'discharge');
    toast.success(`Patient ${bed.patient?.name} discharged from Bed ${bed.bedNumber}`);
    setPatientDetailBed(null);
    refetch();
  };

  const handleViewChart = (bed: BedData) => {
    if (bed.patient?.id) {
      navigate(`/patients/${bed.patient.id}`);
    }
  };

  const availableTargetBeds = beds.filter(
    b => b.status === 'available' && (!transferTargetWard || b.wardId === transferTargetWard)
  );

  const getAcuityColor = (acuity: string) => {
    const map: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
    };
    return map[acuity] || map.medium;
  };

  // ── Ward Detail Sub-Dashboard ──
  if (subView === 'ward-detail' && selectedWardId) {
    const ward = WARDS.find(w => w.id === selectedWardId);
    const wardBeds = beds.filter(b => b.wardId === selectedWardId);
    const wardOccupied = wardBeds.filter(b => b.status === 'occupied');
    const wardAvailable = wardBeds.filter(b => b.status === 'available');
    const wardPct = wardBeds.length > 0 ? Math.round((wardOccupied.length / wardBeds.length) * 100) : 0;

    return (
      <div className="flex flex-col h-full gap-3">
        {/* Ward Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackToOverview}>
              ← Overview
            </Button>
            <div>
              <h3 className="text-base font-semibold">{ward?.name}</h3>
              <p className="text-xs text-muted-foreground">
                {wardOccupied.length}/{wardBeds.length} beds occupied · {wardAvailable.length} available
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Ward Stats Row */}
        <div className="grid grid-cols-5 gap-2 shrink-0">
          <Card className="p-2.5">
            <div className="text-lg font-bold">{wardBeds.length}</div>
            <p className="text-[10px] text-muted-foreground">Total Beds</p>
          </Card>
          <Card className="p-2.5">
            <div className="text-lg font-bold text-blue-600">{wardOccupied.length}</div>
            <p className="text-[10px] text-muted-foreground">Occupied</p>
          </Card>
          <Card className="p-2.5">
            <div className="text-lg font-bold text-green-600">{wardAvailable.length}</div>
            <p className="text-[10px] text-muted-foreground">Available</p>
          </Card>
          <Card className="p-2.5">
            <div className={`text-lg font-bold ${wardPct >= 90 ? 'text-red-600' : ''}`}>{wardPct}%</div>
            <p className="text-[10px] text-muted-foreground">Occupancy</p>
          </Card>
          <Card className="p-2.5">
            <div className="text-lg font-bold text-red-600">
              {wardBeds.filter(b => b.patient?.acuityLevel === 'critical').length}
            </div>
            <p className="text-[10px] text-muted-foreground">Critical</p>
          </Card>
        </div>

        {/* Ward Tabs: Expanded with Intake, Daily Tasks, Checkout */}
        <Tabs defaultValue="patients" className="flex-1 flex flex-col min-h-0">
          <TabsList className="h-9 shrink-0 flex-wrap justify-start">
            <TabsTrigger value="patients" className="text-xs gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Patients ({wardOccupied.length})
            </TabsTrigger>
            <TabsTrigger value="intake" className="text-xs gap-1.5">
              <LogIn className="h-3.5 w-3.5" />
              Intake
            </TabsTrigger>
            <TabsTrigger value="daily" className="text-xs gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Daily Tasks
            </TabsTrigger>
            <TabsTrigger value="checkout" className="text-xs gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              Checkout
            </TabsTrigger>
            <TabsTrigger value="beds" className="text-xs gap-1.5">
              <Bed className="h-3.5 w-3.5" />
              Bed Map
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Patient List */}
          <TabsContent value="patients" className="flex-1 overflow-auto mt-2">
            {wardOccupied.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No patients in this ward</div>
            ) : (
              <div className="space-y-2">
                {wardOccupied.map(bed => (
                  <Card key={bed.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleBedClick(bed)}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                            {bed.bedNumber}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{bed.patient?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {bed.patient?.mrn} · {bed.patient?.diagnosis}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getAcuityColor(bed.patient?.acuityLevel || 'medium')}`}>
                            {bed.patient?.acuityLevel}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {bed.patient ? Math.floor((Date.now() - bed.patient.admissionDate.getTime()) / 86400000) : 0}d
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Intake / Admission ── */}
          <TabsContent value="intake" className="flex-1 overflow-auto mt-2">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                    Pending Admissions
                    <Badge variant="secondary" className="ml-auto text-xs">3 waiting</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {[
                    { name: 'John Moyo', mrn: 'MRN-2024-0891', from: 'Emergency', reason: 'Acute appendicitis – post-surgical monitoring', priority: 'high', waitTime: '25min' },
                    { name: 'Grace Ndlovu', mrn: 'MRN-2024-1204', from: 'OPD', reason: 'Severe pneumonia – IV antibiotics', priority: 'medium', waitTime: '40min' },
                    { name: 'Tendai Chirwa', mrn: 'MRN-2024-1198', from: 'Referral', reason: 'Elective hip replacement – pre-op admission', priority: 'low', waitTime: '1h 10min' },
                  ].map((p, i) => (
                    <Card key={i} className="border-dashed">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                              p.priority === 'high' ? 'bg-red-100' : p.priority === 'medium' ? 'bg-amber-100' : 'bg-green-100'
                            }`}>
                              <UserPlus className={`h-4 w-4 ${
                                p.priority === 'high' ? 'text-red-600' : p.priority === 'medium' ? 'text-amber-600' : 'text-green-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.mrn} · From: {p.from}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{p.reason}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <Badge variant={p.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">{p.priority}</Badge>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Timer className="h-3 w-3" />{p.waitTime}
                              </p>
                            </div>
                            <Button size="sm" className="text-xs gap-1 h-8">
                              <Bed className="h-3.5 w-3.5" />
                              Assign Bed
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    Admission Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { label: 'Patient identity verified', done: true },
                      { label: 'Consent forms signed', done: true },
                      { label: 'Admission orders placed', done: false },
                      { label: 'Allergies & medications reconciled', done: false },
                      { label: 'Nursing assessment completed', done: false },
                      { label: 'Fall risk assessment done', done: false },
                      { label: 'Dietary needs documented', done: false },
                      { label: 'Wristband & labels issued', done: true },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-muted/50">
                        {item.done 
                          ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        }
                        <span className={item.done ? 'text-muted-foreground line-through' : 'font-medium'}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Daily Processes ── */}
          <TabsContent value="daily" className="flex-1 overflow-auto mt-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-lg font-bold">{wardOccupied.length}</p>
                      <p className="text-[10px] text-muted-foreground">Vitals Due</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-lg font-bold">18</p>
                      <p className="text-[10px] text-muted-foreground">Meds Rounds</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-lg font-bold">6</p>
                      <p className="text-[10px] text-muted-foreground">Ward Rounds</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Syringe className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-lg font-bold">4</p>
                      <p className="text-[10px] text-muted-foreground">Procedures</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-indigo-600" />
                    Patient Tasks — Today
                    <Badge variant="secondary" className="ml-auto text-xs">12 pending</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {wardOccupied.slice(0, 5).map((bed, idx) => {
                    const tasks = [
                      { label: '08:00 Vitals', status: idx < 2 ? 'done' : 'pending' },
                      { label: '09:00 Medications', status: idx < 1 ? 'done' : idx < 3 ? 'pending' : 'upcoming' },
                      { label: '10:00 Ward Round', status: 'upcoming' },
                    ];
                    return (
                      <div key={bed.id} className="p-3 rounded-lg bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-blue-700 bg-blue-100 h-7 w-7 rounded flex items-center justify-center">{bed.bedNumber}</span>
                            <div>
                              <p className="font-medium text-sm">{bed.patient?.name}</p>
                              <p className="text-xs text-muted-foreground">{bed.patient?.diagnosis}</p>
                            </div>
                          </div>
                          <Badge className={`text-xs ${getAcuityColor(bed.patient?.acuityLevel || 'medium')}`}>
                            {bed.patient?.acuityLevel}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tasks.map((t, ti) => (
                            <Badge 
                              key={ti} 
                              variant={t.status === 'done' ? 'default' : t.status === 'pending' ? 'destructive' : 'outline'} 
                              className="text-xs gap-1"
                            >
                              {t.status === 'done' && <CheckCircle2 className="h-3 w-3" />}
                              {t.status === 'pending' && <Clock className="h-3 w-3" />}
                              {t.status === 'upcoming' && <Circle className="h-3 w-3" />}
                              {t.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clipboard className="h-4 w-4 text-amber-600" />
                    Shift Handover Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {[
                    { time: '07:00', shift: 'Night → Day', nurse: 'Sr. Mabena', notes: 'Bed 3A patient spiked temp 38.9°C at 03:00, given paracetamol. Bed 5B fall risk – bed rails up. All IV lines patent.' },
                    { time: '19:00', shift: 'Day → Night', nurse: 'Sr. Moyo', notes: 'Bed 2C post-op stable, drain output 50ml. Bed 4A discharge planned AM pending bloods. New admission expected from ED.' },
                  ].map((h, i) => (
                    <div key={i} className="p-3 rounded-lg border bg-muted/20 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{h.shift}</span>
                        <span className="text-xs text-muted-foreground">{h.time} · {h.nurse}</span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{h.notes}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Checkout / Discharge ── */}
          <TabsContent value="checkout" className="flex-1 overflow-auto mt-2">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-green-600" />
                    Pending Discharges
                    <Badge variant="secondary" className="ml-auto text-xs">{Math.min(wardOccupied.length, 3)} pending</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {wardOccupied.slice(0, 3).map((bed, idx) => {
                    const clearances = [
                      { name: 'Clinical', cleared: idx < 2 },
                      { name: 'Nursing', cleared: idx < 1 },
                      { name: 'Pharmacy', cleared: idx < 2 },
                      { name: 'Financial', cleared: idx === 0 },
                    ];
                    const allCleared = clearances.every(c => c.cleared);
                    return (
                      <Card key={bed.id} className={`border ${allCleared ? 'border-green-200 bg-green-50/30 dark:bg-green-950/10' : ''}`}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-xs text-blue-700 bg-blue-100 h-8 w-8 rounded-lg flex items-center justify-center">{bed.bedNumber}</span>
                              <div>
                                <p className="font-medium text-sm">{bed.patient?.name}</p>
                                <p className="text-xs text-muted-foreground">{bed.patient?.mrn} · {bed.patient?.diagnosis}</p>
                                <p className="text-xs text-muted-foreground">
                                  LOS: {bed.patient ? Math.floor((Date.now() - bed.patient.admissionDate.getTime()) / 86400000) : 0}d · Dr. {bed.patient?.attendingPhysician}
                                </p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant={allCleared ? 'default' : 'outline'} 
                              disabled={!allCleared}
                              className="text-xs gap-1 h-8"
                              onClick={() => allCleared && handleDischarge(bed)}
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              {allCleared ? 'Discharge' : 'Pending'}
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {clearances.map((c, ci) => (
                              <Badge 
                                key={ci} 
                                variant={c.cleared ? 'default' : 'outline'}
                                className={`text-xs gap-1 ${c.cleared ? 'bg-green-600 hover:bg-green-700' : ''}`}
                              >
                                {c.cleared ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                {c.name}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    Discharge Process Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { label: 'Discharge summary completed', done: false },
                      { label: 'Medications reconciled & dispensed', done: false },
                      { label: 'Follow-up appointments scheduled', done: false },
                      { label: 'Patient education completed', done: false },
                      { label: 'Wound care instructions given', done: false },
                      { label: 'Transport arranged', done: false },
                      { label: 'Final bill generated', done: false },
                      { label: 'Belongings returned', done: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                        {item.done 
                          ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        }
                        <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                    Discharged Today
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {[
                    { name: 'Simba Mhaka', bed: '2A', time: '09:30', destination: 'Home', los: 3 },
                    { name: 'Rudo Katsande', bed: '6C', time: '11:15', destination: 'Step-down facility', los: 7 },
                  ].map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div>
                          <span className="font-medium">{d.name}</span>
                          <p className="text-xs text-muted-foreground">Bed {d.bed} · LOS {d.los}d · → {d.destination}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{d.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bed Map */}
          <TabsContent value="beds" className="flex-1 overflow-auto mt-2">
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {wardBeds.map(bed => (
                <BedCard key={bed.id} bed={bed} compact onClick={handleBedClick} />
              ))}
            </div>
          </TabsContent>

          {/* Activity Feed */}
          <TabsContent value="activity" className="flex-1 overflow-auto mt-2">
            <div className="space-y-3 text-sm">
              {wardOccupied.slice(0, 5).map((bed, i) => (
                <div key={bed.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium">{bed.patient?.name} — Bed {bed.bedNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Admitted {bed.patient ? Math.floor((Date.now() - bed.patient.admissionDate.getTime()) / 86400000) : 0} days ago · {bed.patient?.attendingPhysician}
                    </p>
                  </div>
                </div>
              ))}
              {wardOccupied.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No recent activity</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Patient Detail Side-Sheet */}
        <PatientBedDetailDialog
          bed={patientDetailBed}
          open={!!patientDetailBed}
          onClose={() => setPatientDetailBed(null)}
          onTransfer={handleTransferOpen}
          onDischarge={handleDischarge}
          onViewChart={handleViewChart}
        />

        {/* Transfer Dialog */}
        <TransferBedDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          bed={selectedBed}
          wards={WARDS}
          availableBeds={availableTargetBeds}
          targetWard={transferTargetWard}
          targetBed={transferTargetBed}
          reason={transferReason}
          onTargetWardChange={setTransferTargetWard}
          onTargetBedChange={setTransferTargetBed}
          onReasonChange={setTransferReason}
          onConfirm={handleTransferConfirm}
        />
      </div>
    );
  }

  // ── Overview Dashboard ──
  return (
    <div className="flex flex-col h-full gap-3">
      {/* Hospital-wide stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 shrink-0">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Bed className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalBeds}</p>
              <p className="text-[10px] text-muted-foreground">Total Beds</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalOccupied}</p>
              <p className="text-[10px] text-muted-foreground">Occupied</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center">
              <Bed className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalAvailable}</p>
              <p className="text-[10px] text-muted-foreground">Available</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${occupancyRate > 90 ? 'bg-red-100' : 'bg-blue-100'}`}>
              <Activity className={`h-4 w-4 ${occupancyRate > 90 ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${occupancyRate > 90 ? 'text-red-600' : ''}`}>{occupancyRate}%</p>
              <p className="text-[10px] text-muted-foreground">Occupancy</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">{criticalPatients}</p>
              <p className="text-[10px] text-muted-foreground">Critical</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Capacity alerts */}
      {beds.some(b => {
        const wardBeds = beds.filter(bb => bb.wardId === b.wardId);
        const wardOcc = wardBeds.filter(bb => bb.status === 'occupied').length;
        return wardOcc >= wardBeds.length && wardBeds.length > 0;
      }) && (
        <Card className="border-red-200 bg-red-50/50 p-3 shrink-0">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {(() => {
                const fullWards = WARDS.filter(w => {
                  const wb = beds.filter(b => b.wardId === w.id);
                  return wb.length > 0 && wb.filter(b => b.status === 'occupied').length >= wb.length;
                });
                return fullWards.map(w => w.name).join(', ') + ' at full capacity';
              })()}
            </span>
          </div>
        </Card>
      )}

      {/* Ward Cards — clickable sub-dashboards */}
      <ScrollArea className="flex-1">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {WARDS.map((ward) => {
            const wardBeds = beds.filter(b => b.wardId === ward.id);
            const wardOccupied = wardBeds.filter(b => b.status === 'occupied').length;
            const pct = wardBeds.length > 0 ? Math.round((wardOccupied / wardBeds.length) * 100) : 0;
            const isFull = wardBeds.length > 0 && wardOccupied >= wardBeds.length;
            const wardCritical = wardBeds.filter(b => b.patient?.acuityLevel === 'critical').length;
            const wardDischarges = wardBeds.filter(b => b.status === 'cleaning').length;

            return (
              <Card
                key={ward.id}
                className={`cursor-pointer hover:shadow-md transition-all ${isFull ? 'border-red-200' : 'hover:border-primary/30'}`}
                onClick={() => handleSelectWard(ward.id)}
              >
                <CardHeader className="pb-2 pt-3 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {ward.name}
                    </CardTitle>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">{wardOccupied}/{wardBeds.length}</span>
                    <span className={`text-sm font-medium ${
                      pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-yellow-600' : 'text-green-600'
                    }`}>{pct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {wardCritical > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        {wardCritical} critical
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      {wardBeds.filter(b => b.status === 'available').length} available
                    </span>
                    {wardDischarges > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-purple-500" />
                        {wardDischarges} cleaning
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Patient Bed Detail Dialog ──
function PatientBedDetailDialog({
  bed,
  open,
  onClose,
  onTransfer,
  onDischarge,
  onViewChart,
}: {
  bed: BedData | null;
  open: boolean;
  onClose: () => void;
  onTransfer: (bed: BedData) => void;
  onDischarge: (bed: BedData) => void;
  onViewChart: (bed: BedData) => void;
}) {
  if (!bed) return null;
  const daysAdmitted = bed.patient
    ? Math.floor((Date.now() - bed.patient.admissionDate.getTime()) / 86400000)
    : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bed className="h-5 w-5" />
            Bed {bed.bedNumber}
            <Badge variant="outline" className="text-xs">{bed.wardName}</Badge>
          </DialogTitle>
        </DialogHeader>

        {bed.status === 'occupied' && bed.patient ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{bed.patient.name}</p>
                  <p className="text-xs text-muted-foreground">{bed.patient.mrn}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Diagnosis</span>
                  <p className="font-medium">{bed.patient.diagnosis}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Acuity</span>
                  <p><Badge className={`text-xs ${bed.patient.acuityLevel === 'critical' ? 'bg-red-100 text-red-800' : bed.patient.acuityLevel === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {bed.patient.acuityLevel}
                  </Badge></p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Attending</span>
                  <p className="font-medium">{bed.patient.attendingPhysician}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Length of Stay</span>
                  <p className="font-medium">{daysAdmitted} days</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onViewChart(bed)}>
                <Eye className="h-3.5 w-3.5" />
                View Chart
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onTransfer(bed)}>
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Transfer
              </Button>
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => onDischarge(bed)}>
                <LogOut className="h-3.5 w-3.5" />
                Discharge
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Bed className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Bed is {bed.status}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Transfer Bed Dialog ──
function TransferBedDialog({
  open,
  onOpenChange,
  bed,
  wards,
  availableBeds,
  targetWard,
  targetBed,
  reason,
  onTargetWardChange,
  onTargetBedChange,
  onReasonChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  bed: BedData | null;
  wards: typeof WARDS;
  availableBeds: BedData[];
  targetWard: string;
  targetBed: string;
  reason: string;
  onTargetWardChange: (v: string) => void;
  onTargetBedChange: (v: string) => void;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
}) {
  if (!bed) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Patient
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium">{bed.patient?.name}</p>
            <p className="text-xs text-muted-foreground">
              Currently in Bed {bed.bedNumber} · {bed.wardName}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Target Ward</Label>
              <Select value={targetWard} onValueChange={(v) => { onTargetWardChange(v); onTargetBedChange(''); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select ward..." />
                </SelectTrigger>
                <SelectContent>
                  {wards.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Target Bed</Label>
              <Select value={targetBed} onValueChange={onTargetBedChange} disabled={!targetWard}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={targetWard ? "Select bed..." : "Select ward first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableBeds.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      Bed {b.bedNumber} — {b.wardName}
                    </SelectItem>
                  ))}
                  {availableBeds.length === 0 && (
                    <div className="text-xs text-muted-foreground p-2">No available beds</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Reason for Transfer</Label>
              <Textarea
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="Clinical reason for bed transfer..."
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={onConfirm} disabled={!targetBed}>
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
            Confirm Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
