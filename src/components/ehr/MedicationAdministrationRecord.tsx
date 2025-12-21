import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Syringe,
  Droplet,
  Tablets,
  User,
  Info,
  Ban,
  PauseCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format, addDays, subDays, isSameDay, setHours, setMinutes } from "date-fns";

// Types
type MedicationRoute = "PO" | "IV" | "IM" | "SC" | "SL" | "PR" | "TOP" | "INH" | "NG";
type MedicationFrequency = "STAT" | "ONCE" | "BD" | "TDS" | "QID" | "Q4H" | "Q6H" | "Q8H" | "Q12H" | "DAILY" | "WEEKLY" | "PRN";
type AdministrationStatus = "given" | "held" | "refused" | "not-given" | "pending" | "late";

interface Medication {
  id: string;
  name: string;
  genericName: string;
  dose: string;
  unit: string;
  route: MedicationRoute;
  frequency: MedicationFrequency;
  startDate: Date;
  endDate?: Date;
  instructions?: string;
  prescriber: string;
  isHighAlert?: boolean;
  isPRN?: boolean;
  maxDailyDose?: string;
  scheduledTimes: number[]; // Hours of day (0-23)
}

interface AdministrationRecord {
  id: string;
  medicationId: string;
  scheduledTime: Date;
  status: AdministrationStatus;
  administeredTime?: Date;
  administeredBy?: string;
  dose?: string;
  notes?: string;
  reason?: string; // For held/refused
}

// Route icons
const routeIcons: Record<MedicationRoute, React.ComponentType<{ className?: string }>> = {
  PO: Tablets,
  IV: Syringe,
  IM: Syringe,
  SC: Syringe,
  SL: Tablets,
  PR: Pill,
  TOP: Droplet,
  INH: Droplet,
  NG: Syringe,
};

// Mock Data
const MOCK_MEDICATIONS: Medication[] = [
  {
    id: "M1",
    name: "Augmentin",
    genericName: "Amoxicillin/Clavulanate",
    dose: "625",
    unit: "mg",
    route: "PO",
    frequency: "TDS",
    startDate: new Date("2024-12-19"),
    instructions: "Take with food",
    prescriber: "Dr. Mwangi",
    scheduledTimes: [8, 14, 20],
  },
  {
    id: "M2",
    name: "Paracetamol",
    genericName: "Acetaminophen",
    dose: "1",
    unit: "g",
    route: "PO",
    frequency: "Q6H",
    startDate: new Date("2024-12-19"),
    prescriber: "Dr. Mwangi",
    scheduledTimes: [6, 12, 18, 24],
    maxDailyDose: "4g",
  },
  {
    id: "M3",
    name: "Heparin",
    genericName: "Heparin Sodium",
    dose: "5000",
    unit: "IU",
    route: "SC",
    frequency: "BD",
    startDate: new Date("2024-12-19"),
    instructions: "Rotate injection sites",
    prescriber: "Dr. Ochieng",
    isHighAlert: true,
    scheduledTimes: [8, 20],
  },
  {
    id: "M4",
    name: "Morphine",
    genericName: "Morphine Sulfate",
    dose: "5",
    unit: "mg",
    route: "IV",
    frequency: "PRN",
    startDate: new Date("2024-12-19"),
    instructions: "For severe pain. Max Q4H",
    prescriber: "Dr. Mwangi",
    isHighAlert: true,
    isPRN: true,
    maxDailyDose: "30mg",
    scheduledTimes: [],
  },
  {
    id: "M5",
    name: "Metformin",
    genericName: "Metformin HCl",
    dose: "500",
    unit: "mg",
    route: "PO",
    frequency: "BD",
    startDate: new Date("2024-12-18"),
    instructions: "Take with meals",
    prescriber: "Dr. Kamau",
    scheduledTimes: [8, 18],
  },
  {
    id: "M6",
    name: "Omeprazole",
    genericName: "Omeprazole",
    dose: "20",
    unit: "mg",
    route: "PO",
    frequency: "DAILY",
    startDate: new Date("2024-12-18"),
    instructions: "Take before breakfast",
    prescriber: "Dr. Mwangi",
    scheduledTimes: [6],
  },
];

// Generate mock administration records
const generateAdministrationRecords = (medications: Medication[], date: Date): AdministrationRecord[] => {
  const records: AdministrationRecord[] = [];
  const now = new Date();
  
  medications.forEach(med => {
    if (med.isPRN) return; // PRN meds don't have scheduled times
    
    med.scheduledTimes.forEach(hour => {
      const scheduledTime = setMinutes(setHours(date, hour === 24 ? 0 : hour), 0);
      const isPast = scheduledTime < now;
      const isToday = isSameDay(date, now);
      
      // Simulate some administered, some pending
      let status: AdministrationStatus = "pending";
      let administeredTime: Date | undefined;
      let administeredBy: string | undefined;
      
      if (isPast && isToday) {
        const rand = Math.random();
        if (rand > 0.2) {
          status = "given";
          administeredTime = new Date(scheduledTime.getTime() + Math.random() * 30 * 60000); // Within 30 min
          administeredBy = "Nurse Wanjiku";
        } else if (rand > 0.1) {
          status = "late";
        } else {
          status = Math.random() > 0.5 ? "held" : "refused";
        }
      } else if (!isToday && date < now) {
        status = "given";
        administeredTime = new Date(scheduledTime.getTime() + Math.random() * 15 * 60000);
        administeredBy = "Nurse Akinyi";
      }
      
      records.push({
        id: `AR-${med.id}-${hour}-${date.getTime()}`,
        medicationId: med.id,
        scheduledTime,
        status,
        administeredTime,
        administeredBy,
        dose: `${med.dose} ${med.unit}`,
      });
    });
  });
  
  return records;
};

// Status styles and labels
const statusConfig: Record<AdministrationStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  given: { label: "Given", color: "bg-success text-success-foreground", icon: CheckCircle2 },
  held: { label: "Held", color: "bg-warning text-warning-foreground", icon: PauseCircle },
  refused: { label: "Refused", color: "bg-destructive text-destructive-foreground", icon: Ban },
  "not-given": { label: "Not Given", color: "bg-muted text-muted-foreground", icon: XCircle },
  pending: { label: "Pending", color: "bg-primary/20 text-primary", icon: Clock },
  late: { label: "Late", color: "bg-critical text-critical-foreground", icon: AlertTriangle },
};

// Components
function MedicationCard({ 
  medication, 
  records,
  onAdminister 
}: { 
  medication: Medication; 
  records: AdministrationRecord[];
  onAdminister: (med: Medication, record?: AdministrationRecord) => void;
}) {
  const RouteIcon = routeIcons[medication.route] || Pill;
  const nextDue = records.find(r => r.status === "pending" || r.status === "late");
  const givenToday = records.filter(r => r.status === "given").length;
  const totalToday = records.length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-lg border transition-all hover:shadow-md",
        medication.isHighAlert ? "border-critical/50 bg-critical/5" : "border-border bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            medication.isHighAlert ? "bg-critical/20" : "bg-primary/10"
          )}>
            <RouteIcon className={cn(
              "w-5 h-5",
              medication.isHighAlert ? "text-critical" : "text-primary"
            )} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{medication.name}</span>
              {medication.isHighAlert && (
                <Badge variant="outline" className="bg-critical/20 text-critical border-critical/50 text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  High Alert
                </Badge>
              )}
              {medication.isPRN && (
                <Badge variant="outline" className="bg-warning/20 text-warning border-warning/50 text-xs">
                  PRN
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{medication.genericName}</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-mono font-medium">
                {medication.dose} {medication.unit}
              </span>
              <Badge variant="secondary" className="text-xs">
                {medication.route}
              </Badge>
              <span className="text-muted-foreground">{medication.frequency}</span>
            </div>
            {medication.instructions && (
              <p className="text-xs text-muted-foreground italic">
                {medication.instructions}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {!medication.isPRN && nextDue && (
            <div className={cn(
              "text-right",
              nextDue.status === "late" && "text-critical"
            )}>
              <span className="text-xs text-muted-foreground">Next due:</span>
              <p className={cn(
                "font-mono font-medium text-sm",
                nextDue.status === "late" && "text-critical"
              )}>
                {format(nextDue.scheduledTime, "HH:mm")}
                {nextDue.status === "late" && " (LATE)"}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            {!medication.isPRN && totalToday > 0 && (
              <span className="text-xs text-muted-foreground">
                {givenToday}/{totalToday} given
              </span>
            )}
            <Button 
              size="sm" 
              onClick={() => onAdminister(medication, nextDue)}
              className={cn(
                medication.isHighAlert && "bg-critical hover:bg-critical-hover"
              )}
            >
              <Plus className="w-4 h-4 mr-1" />
              {medication.isPRN ? "Give PRN" : "Administer"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TimeSlotCell({ 
  record, 
  medication,
  onClick 
}: { 
  record?: AdministrationRecord; 
  medication: Medication;
  onClick: () => void;
}) {
  if (!record) {
    return <div className="w-16 h-12 border-r border-border" />;
  }
  
  const config = statusConfig[record.status];
  const StatusIcon = config.icon;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "w-16 h-12 border-r border-border flex items-center justify-center transition-all hover:opacity-80",
            record.status === "pending" && "hover:bg-primary/10",
            record.status === "late" && "animate-pulse"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
            config.color
          )}>
            <StatusIcon className="w-4 h-4" />
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1 text-sm">
          <div className="font-medium">{medication.name} - {medication.dose} {medication.unit}</div>
          <div className="text-muted-foreground">
            Scheduled: {format(record.scheduledTime, "HH:mm")}
          </div>
          <div className="flex items-center gap-1">
            <Badge className={cn("text-xs", config.color)}>{config.label}</Badge>
          </div>
          {record.administeredTime && (
            <div className="text-muted-foreground">
              Given at {format(record.administeredTime, "HH:mm")} by {record.administeredBy}
            </div>
          )}
          {record.reason && (
            <div className="text-muted-foreground">Reason: {record.reason}</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function AdministrationDialog({
  isOpen,
  onClose,
  medication,
  record,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
  record: AdministrationRecord | null;
  onSubmit: (status: AdministrationStatus, data: { dose?: string; notes?: string; reason?: string }) => void;
}) {
  const [status, setStatus] = useState<AdministrationStatus>("given");
  const [dose, setDose] = useState(medication ? `${medication.dose} ${medication.unit}` : "");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    onSubmit(status, { dose, notes, reason });
    setNotes("");
    setReason("");
    onClose();
  };

  if (!medication) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            Administer Medication
          </DialogTitle>
          <DialogDescription>
            Record medication administration for {medication.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Medication Info */}
          <div className={cn(
            "p-3 rounded-lg",
            medication.isHighAlert ? "bg-critical/10 border border-critical/50" : "bg-muted"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">{medication.name}</span>
                <span className="text-muted-foreground ml-2">{medication.genericName}</span>
              </div>
              {medication.isHighAlert && (
                <Badge className="bg-critical text-critical-foreground">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  High Alert
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span>{medication.route}</span>
              <span>•</span>
              <span>{medication.frequency}</span>
              {record && (
                <>
                  <span>•</span>
                  <span>Due: {format(record.scheduledTime, "HH:mm")}</span>
                </>
              )}
            </div>
          </div>

          {/* Dose */}
          <div className="space-y-2">
            <Label>Dose</Label>
            <Input
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="Enter dose"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AdministrationStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="given">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Given
                  </div>
                </SelectItem>
                <SelectItem value="held">
                  <div className="flex items-center gap-2">
                    <PauseCircle className="w-4 h-4 text-warning" />
                    Held
                  </div>
                </SelectItem>
                <SelectItem value="refused">
                  <div className="flex items-center gap-2">
                    <Ban className="w-4 h-4 text-destructive" />
                    Refused
                  </div>
                </SelectItem>
                <SelectItem value="not-given">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                    Not Given
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason (for held/refused) */}
          {(status === "held" || status === "refused" || status === "not-given") && (
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {status === "held" && (
                    <>
                      <SelectItem value="npo">Patient NPO</SelectItem>
                      <SelectItem value="procedure">Procedure scheduled</SelectItem>
                      <SelectItem value="vitals">Vitals outside parameters</SelectItem>
                      <SelectItem value="lab">Awaiting lab results</SelectItem>
                      <SelectItem value="physician">Per physician order</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  )}
                  {status === "refused" && (
                    <>
                      <SelectItem value="patient-refused">Patient refused</SelectItem>
                      <SelectItem value="family-refused">Family refused</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  )}
                  {status === "not-given" && (
                    <>
                      <SelectItem value="unavailable">Medication unavailable</SelectItem>
                      <SelectItem value="discontinued">Order discontinued</SelectItem>
                      <SelectItem value="error">Order error</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            className={cn(medication.isHighAlert && "bg-critical hover:bg-critical-hover")}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export function MedicationAdministrationRecord() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AdministrationRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [medications] = useState(MOCK_MEDICATIONS);
  const [records, setRecords] = useState<AdministrationRecord[]>(() => 
    generateAdministrationRecords(MOCK_MEDICATIONS, new Date())
  );

  const timeSlots = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.genericName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDateChange = (direction: "prev" | "next") => {
    const newDate = direction === "prev" ? subDays(selectedDate, 1) : addDays(selectedDate, 1);
    setSelectedDate(newDate);
    setRecords(generateAdministrationRecords(medications, newDate));
  };

  const handleAdminister = (medication: Medication, record?: AdministrationRecord) => {
    setSelectedMedication(medication);
    setSelectedRecord(record || null);
    setIsDialogOpen(true);
  };

  const handleSubmitAdministration = (
    status: AdministrationStatus, 
    data: { dose?: string; notes?: string; reason?: string }
  ) => {
    if (selectedRecord) {
      setRecords(prev => prev.map(r => 
        r.id === selectedRecord.id 
          ? { 
              ...r, 
              status, 
              administeredTime: status === "given" ? new Date() : undefined,
              administeredBy: status === "given" ? "Nurse Wanjiku" : undefined,
              dose: data.dose,
              notes: data.notes,
              reason: data.reason,
            }
          : r
      ));
    }
  };

  // Stats
  const totalScheduled = records.length;
  const administered = records.filter(r => r.status === "given").length;
  const pending = records.filter(r => r.status === "pending").length;
  const late = records.filter(r => r.status === "late").length;
  const held = records.filter(r => r.status === "held" || r.status === "refused").length;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Pill className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Medication Administration Record</h2>
              <p className="text-sm text-muted-foreground">
                Sarah M. Johnson • MRN-2024-001847
              </p>
            </div>
          </div>
          
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleDateChange("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg min-w-[180px] justify-center">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{format(selectedDate, "EEE, dd MMM yyyy")}</span>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => handleDateChange("next")}
              disabled={isSameDay(selectedDate, new Date())}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 flex-1">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{administered}/{totalScheduled}</p>
              <p className="text-xs text-muted-foreground">Administered</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm">{administered} Given</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary/50" />
                <span className="text-sm">{pending} Pending</span>
              </div>
              {late > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-critical animate-pulse" />
                  <span className="text-sm text-critical">{late} Late</span>
                </div>
              )}
              {held > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-sm">{held} Held/Refused</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medications..."
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 px-4">
          <TabsTrigger
            value="list"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Medication List
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Timeline View
          </TabsTrigger>
          <TabsTrigger
            value="prn"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            PRN Medications
            {medications.filter(m => m.isPRN).length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {medications.filter(m => m.isPRN).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="list" className="p-4 space-y-3 m-0">
            <AnimatePresence mode="popLayout">
              {filteredMedications.filter(m => !m.isPRN).map(medication => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  records={records.filter(r => r.medicationId === medication.id)}
                  onAdminister={handleAdminister}
                />
              ))}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="timeline" className="p-4 m-0">
            <div className="border rounded-lg overflow-hidden">
              {/* Time Header */}
              <div className="flex border-b bg-muted/50">
                <div className="w-48 p-3 font-medium text-sm border-r shrink-0">Medication</div>
                {timeSlots.map(hour => (
                  <div key={hour} className="w-16 p-2 text-center text-sm font-medium border-r">
                    {hour === 24 ? "00:00" : `${hour.toString().padStart(2, "0")}:00`}
                  </div>
                ))}
              </div>

              {/* Medication Rows */}
              {filteredMedications.filter(m => !m.isPRN).map(medication => (
                <div key={medication.id} className="flex border-b last:border-b-0 hover:bg-muted/30">
                  <div className={cn(
                    "w-48 p-3 border-r shrink-0",
                    medication.isHighAlert && "bg-critical/5"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{medication.name}</span>
                      {medication.isHighAlert && (
                        <AlertTriangle className="w-3 h-3 text-critical" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {medication.dose} {medication.unit} {medication.route}
                    </p>
                  </div>
                  {timeSlots.map(hour => {
                    const record = records.find(
                      r => r.medicationId === medication.id && 
                      (new Date(r.scheduledTime).getHours() === hour || 
                       (hour === 24 && new Date(r.scheduledTime).getHours() === 0))
                    );
                    return (
                      <TimeSlotCell
                        key={hour}
                        record={record}
                        medication={medication}
                        onClick={() => record && handleAdminister(medication, record)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="prn" className="p-4 space-y-3 m-0">
            <AnimatePresence mode="popLayout">
              {filteredMedications.filter(m => m.isPRN).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No PRN medications ordered</p>
                </div>
              ) : (
                filteredMedications.filter(m => m.isPRN).map(medication => (
                  <MedicationCard
                    key={medication.id}
                    medication={medication}
                    records={[]}
                    onAdminister={handleAdminister}
                  />
                ))
              )}
            </AnimatePresence>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Administration Dialog */}
      <AdministrationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        medication={selectedMedication}
        record={selectedRecord}
        onSubmit={handleSubmitAdministration}
      />
    </div>
  );
}
