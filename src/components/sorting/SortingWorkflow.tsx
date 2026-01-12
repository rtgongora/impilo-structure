import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Search, 
  UserPlus, 
  CheckCircle2,
  AlertTriangle,
  Clock,
  Siren,
  User,
  FileText,
  ArrowRight,
  X,
  Loader2
} from "lucide-react";
import { 
  SortingSession, 
  PatientSearchResult, 
  TemporaryPatientIdentity,
  TriageUrgency,
  TRIAGE_URGENCY_CONFIG,
  COMMON_DANGER_SIGNS
} from "@/types/sorting";
import { useQueueManagement } from "@/hooks/useQueueManagement";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type WorkflowStep = 'identify' | 'triage' | 'route';

interface SortingWorkflowProps {
  session: SortingSession;
  onComplete: () => void;
  onCancel: () => void;
  searchPatients: (query: string) => Promise<PatientSearchResult[]>;
  confirmIdentity: (sessionId: string, patientId: string, healthId?: string) => Promise<boolean>;
  createTempIdentity: (sessionId: string, input: any) => Promise<TemporaryPatientIdentity | null>;
  performTriage: (sessionId: string, input: any) => Promise<boolean>;
  routeToImmediateCare: (sessionId: string, workspaceId?: string) => Promise<boolean>;
  routeToQueue: (sessionId: string, input: any) => Promise<string | null>;
  cancelSession: (sessionId: string, reason?: string) => Promise<boolean>;
}

export function SortingWorkflow({
  session,
  onComplete,
  onCancel,
  searchPatients,
  confirmIdentity,
  createTempIdentity,
  performTriage,
  routeToImmediateCare,
  routeToQueue,
  cancelSession,
}: SortingWorkflowProps) {
  // Determine starting step based on session state
  const getInitialStep = (): WorkflowStep => {
    if (session.identity_status === 'unknown') return 'identify';
    if (!session.triage_category) return 'triage';
    return 'route';
  };

  const [step, setStep] = useState<WorkflowStep>(getInitialStep());
  const [loading, setLoading] = useState(false);

  // Identity step state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showTempForm, setShowTempForm] = useState(false);
  const [tempIdentity, setTempIdentity] = useState({
    given_name: '',
    alias: '',
    sex: '',
    estimated_age: '',
    reason: 'Cannot confirm identity',
  });

  // Triage step state
  const [triageCategory, setTriageCategory] = useState<TriageUrgency | ''>('');
  const [complaint, setComplaint] = useState('');
  const [dangerSigns, setDangerSigns] = useState<string[]>([]);
  const [triageNotes, setTriageNotes] = useState('');

  // Route step state
  const [selectedQueueId, setSelectedQueueId] = useState('');
  const { queues } = useQueueManagement(session.facility_id || undefined);

  const waitTime = formatDistanceToNow(new Date(session.arrival_time), { addSuffix: false });

  // Search patients with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchPatients(searchQuery);
      setSearchResults(results);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchPatients]);

  // Handle patient selection
  const handleSelectPatient = async (patient: PatientSearchResult) => {
    setLoading(true);
    const success = await confirmIdentity(session.id, patient.id);
    setLoading(false);
    
    if (success) {
      toast.success(`Identity confirmed: ${patient.first_name} ${patient.last_name}`);
      setStep('triage');
    } else {
      toast.error('Failed to confirm identity');
    }
  };

  // Create temporary identity
  const handleCreateTempIdentity = async () => {
    if (!tempIdentity.reason) {
      toast.error('Please provide a reason for temporary ID');
      return;
    }

    setLoading(true);
    const result = await createTempIdentity(session.id, {
      given_name: tempIdentity.given_name || undefined,
      alias: tempIdentity.alias || undefined,
      sex: tempIdentity.sex || undefined,
      estimated_age: tempIdentity.estimated_age ? parseInt(tempIdentity.estimated_age) : undefined,
      reason: tempIdentity.reason,
    });
    setLoading(false);

    if (result) {
      toast.success(`Temporary ID created: ${result.temp_id}`);
      setStep('triage');
    } else {
      toast.error('Failed to create temporary ID');
    }
  };

  // Handle triage submission
  const handleTriageSubmit = async () => {
    if (!triageCategory) {
      toast.error('Please select urgency category');
      return;
    }
    if (!complaint.trim()) {
      toast.error('Please enter presenting complaint');
      return;
    }

    setLoading(true);
    const success = await performTriage(session.id, {
      triage_category: triageCategory,
      presenting_complaint: complaint,
      danger_signs: dangerSigns.length > 0 ? dangerSigns : undefined,
      triage_notes: triageNotes || undefined,
    });
    setLoading(false);

    if (success) {
      toast.success('Triage completed');
      setStep('route');
    } else {
      toast.error('Failed to complete triage');
    }
  };

  // Route to immediate care
  const handleImmediateCare = async () => {
    setLoading(true);
    const success = await routeToImmediateCare(session.id);
    setLoading(false);

    if (success) {
      toast.success('Patient routed to immediate care');
      onComplete();
    } else {
      toast.error('Failed to route patient');
    }
  };

  // Route to queue
  const handleRouteToQueue = async () => {
    if (!selectedQueueId) {
      toast.error('Please select a queue');
      return;
    }

    setLoading(true);
    const ticketNumber = await routeToQueue(session.id, { target_queue_id: selectedQueueId });
    setLoading(false);

    if (ticketNumber) {
      toast.success(`Patient queued with ticket: ${ticketNumber}`);
      onComplete();
    } else {
      toast.error('Failed to queue patient');
    }
  };

  // Cancel session
  const handleCancel = async () => {
    setLoading(true);
    await cancelSession(session.id, 'User cancelled');
    setLoading(false);
    onCancel();
  };

  return (
    <div className="h-[calc(100vh-56px)] bg-background p-2 md:p-3 flex flex-col overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={loading} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold">Sorting</h1>
              <Badge variant="outline" className="py-0 text-xs">{session.session_number}</Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {waitTime} waiting
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleCancel} disabled={loading} className="h-8 text-xs">
          <X className="h-3.5 w-3.5 mr-1" />
          Cancel
        </Button>
      </div>

      {/* Compact Progress Steps */}
      <div className="flex items-center justify-center gap-3 mb-3 flex-shrink-0">
        {(['identify', 'triage', 'route'] as WorkflowStep[]).map((s, idx) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              step === s 
                ? 'bg-primary text-primary-foreground' 
                : session.identity_status !== 'unknown' && s === 'identify'
                  ? 'bg-green-500 text-white'
                  : session.triage_category && s === 'triage'
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
            }`}>
              {(session.identity_status !== 'unknown' && s === 'identify') || 
               (session.triage_category && s === 'triage') 
                ? <CheckCircle2 className="h-3 w-3" />
                : idx + 1}
            </div>
            <span className={`text-xs ${step === s ? 'font-medium' : 'text-muted-foreground'}`}>
              {s === 'identify' ? 'ID' : s === 'triage' ? 'Triage' : 'Route'}
            </span>
            {idx < 2 && <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto pb-4">
        {/* IDENTIFY STEP */}
        {step === 'identify' && (
          <div className="space-y-4">
            {/* Primary Option: Search Existing Patients */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Find Existing Patient
                </CardTitle>
                <CardDescription>
                  Search by name, MRN, phone, or Health ID
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>

                {searching && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y">
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-3 hover:bg-muted cursor-pointer flex items-center justify-between"
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <div>
                          <p className="font-medium">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {patient.mrn} • {patient.gender} • {patient.date_of_birth}
                          </p>
                        </div>
                        <Badge variant={patient.matchConfidence === 'exact' ? 'default' : 'secondary'}>
                          {patient.matchConfidence === 'exact' ? 'Exact' : 'Probable'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No patients found matching "{searchQuery}"
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Secondary Option: Register New Patient */}
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <UserPlus className="h-5 w-5" />
                  New Patient Registration
                </CardTitle>
                <CardDescription>
                  Patient not found? Register them in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    // Navigate to registration with return context
                    window.location.href = `/registration?returnTo=/sorting&sessionId=${session.id}`;
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register New Patient
                </Button>
              </CardContent>
            </Card>

            {/* Last Resort: Temporary ID */}
            <Card className="border-dashed border-muted-foreground/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    Cannot Identify Patient?
                  </CardTitle>
                  {!showTempForm && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={() => setShowTempForm(true)}
                    >
                      Create Temporary ID
                    </Button>
                  )}
                </div>
                {!showTempForm && (
                  <CardDescription className="text-xs">
                    Only use when patient is unconscious, confused, or has no identification
                  </CardDescription>
                )}
              </CardHeader>
              
              {showTempForm && (
                <CardContent className="space-y-4 pt-0">
                  <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <p className="text-xs text-orange-700 dark:text-orange-300 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                      Temporary IDs must be reconciled with a permanent Health ID before discharge
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Name (if known)</Label>
                      <Input
                        value={tempIdentity.given_name}
                        onChange={(e) => setTempIdentity({ ...tempIdentity, given_name: e.target.value })}
                        placeholder="Given name"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Alias/Nickname</Label>
                      <Input
                        value={tempIdentity.alias}
                        onChange={(e) => setTempIdentity({ ...tempIdentity, alias: e.target.value })}
                        placeholder="e.g. 'John Doe'"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Sex</Label>
                      <RadioGroup
                        value={tempIdentity.sex}
                        onValueChange={(v) => setTempIdentity({ ...tempIdentity, sex: v })}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male" className="text-sm">Male</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female" className="text-sm">Female</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label className="text-xs">Estimated Age</Label>
                      <Input
                        type="number"
                        value={tempIdentity.estimated_age}
                        onChange={(e) => setTempIdentity({ ...tempIdentity, estimated_age: e.target.value })}
                        placeholder="Years"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Reason for Temporary ID*</Label>
                    <Textarea
                      value={tempIdentity.reason}
                      onChange={(e) => setTempIdentity({ ...tempIdentity, reason: e.target.value })}
                      placeholder="e.g. Unconscious, no ID, confused patient, brought in by emergency services"
                      className="min-h-[60px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateTempIdentity} 
                      disabled={loading}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Temporary ID
                    </Button>
                    <Button variant="outline" onClick={() => setShowTempForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* TRIAGE STEP */}
        {step === 'triage' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quick Triage
              </CardTitle>
              <CardDescription>
                Assess urgency and presenting complaint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Urgency Selection */}
              <div>
                <Label className="text-base font-medium">Urgency Category*</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {(Object.keys(TRIAGE_URGENCY_CONFIG) as TriageUrgency[]).map((category) => {
                    const config = TRIAGE_URGENCY_CONFIG[category];
                    return (
                      <div
                        key={category}
                        onClick={() => setTriageCategory(category)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          triageCategory === category
                            ? `${config.borderColor} ${config.bgColor}`
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        <p className={`font-medium ${triageCategory === category ? config.color : ''}`}>
                          {config.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {config.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Presenting Complaint */}
              <div>
                <Label>Presenting Complaint*</Label>
                <Textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Brief description of why patient is here..."
                  className="mt-2"
                />
              </div>

              {/* Danger Signs (optional) */}
              <div>
                <Label>Danger Signs (if any)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {COMMON_DANGER_SIGNS.slice(0, 8).map((sign) => (
                    <div key={sign} className="flex items-center gap-2">
                      <Checkbox
                        id={sign}
                        checked={dangerSigns.includes(sign)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setDangerSigns([...dangerSigns, sign]);
                          } else {
                            setDangerSigns(dangerSigns.filter(s => s !== sign));
                          }
                        }}
                      />
                      <Label htmlFor={sign} className="text-sm font-normal cursor-pointer">
                        {sign}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={triageNotes}
                  onChange={(e) => setTriageNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="mt-2"
                />
              </div>

              <Button onClick={handleTriageSubmit} disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Complete Triage
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ROUTE STEP */}
        {step === 'route' && (
          <div className="space-y-4">
            {/* Patient Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {session.patient 
                        ? `${session.patient.first_name} ${session.patient.last_name}`
                        : 'Temporary ID Patient'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {session.presenting_complaint}
                    </p>
                  </div>
                  {session.triage_category && (
                    <Badge className={`${TRIAGE_URGENCY_CONFIG[session.triage_category].bgColor} ${TRIAGE_URGENCY_CONFIG[session.triage_category].color} border-0`}>
                      {TRIAGE_URGENCY_CONFIG[session.triage_category].label}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Immediate Care Option */}
            {(session.triage_category === 'emergency' || session.triage_category === 'very_urgent') && (
              <Button 
                variant="destructive" 
                className="w-full h-16 text-lg"
                onClick={handleImmediateCare}
                disabled={loading}
              >
                <Siren className="h-6 w-6 mr-2" />
                ATTEND NOW - Immediate Care
              </Button>
            )}

            {/* Queue Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Send to Queue</CardTitle>
                <CardDescription>
                  Select the service queue for this patient
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {queues.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No queues configured for this facility
                  </p>
                ) : (
                  <RadioGroup value={selectedQueueId} onValueChange={setSelectedQueueId}>
                    {queues.map((queue) => (
                      <div key={queue.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                        <RadioGroupItem value={queue.id} id={queue.id} />
                        <Label htmlFor={queue.id} className="flex-1 cursor-pointer">
                          <p className="font-medium">{queue.name}</p>
                          <p className="text-sm text-muted-foreground">{queue.description}</p>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                <Button 
                  onClick={handleRouteToQueue} 
                  disabled={loading || !selectedQueueId}
                  className="w-full"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Send to Queue
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
