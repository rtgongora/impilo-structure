import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Stethoscope, Clock, ArrowRightLeft, LogOut } from "lucide-react";
import type { BedData } from "./BedCard";

interface BedActionDialogProps {
  bed: BedData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (bedId: string, action: 'admit' | 'discharge' | 'transfer' | 'reserve' | 'maintenance' | 'clean' | 'available') => void;
}

export function BedActionDialog({ bed, open, onOpenChange, onAction }: BedActionDialogProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [patientName, setPatientName] = useState('');
  const [mrn, setMrn] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [acuity, setAcuity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [reservedFor, setReservedFor] = useState('');

  if (!bed) return null;

  const handleAdmit = () => {
    onAction(bed.id, 'admit');
    onOpenChange(false);
    resetForm();
  };

  const handleDischarge = () => {
    onAction(bed.id, 'discharge');
    onOpenChange(false);
  };

  const handleTransfer = () => {
    onAction(bed.id, 'transfer');
    onOpenChange(false);
  };

  const resetForm = () => {
    setPatientName('');
    setMrn('');
    setDiagnosis('');
    setAcuity('medium');
    setReservedFor('');
    setActiveTab('info');
  };

  const daysAdmitted = bed.patient 
    ? Math.floor((new Date().getTime() - bed.patient.admissionDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Bed {bed.bedNumber}
            <Badge variant="outline">{bed.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        {bed.status === 'occupied' && bed.patient ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <span className="font-semibold">{bed.patient.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">MRN:</span> {bed.patient.mrn}
                </div>
                <div>
                  <span className="text-muted-foreground">Acuity:</span>{' '}
                  <Badge variant="outline">{bed.patient.acuityLevel}</Badge>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Diagnosis:</span> {bed.patient.diagnosis}
                </div>
                <div>
                  <span className="text-muted-foreground">Attending:</span> {bed.patient.attendingPhysician}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>{daysAdmitted} days admitted</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleTransfer} className="flex-1">
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                Transfer
              </Button>
              <Button variant="destructive" onClick={handleDischarge} className="flex-1">
                <LogOut className="h-4 w-4 mr-1" />
                Discharge
              </Button>
            </DialogFooter>
          </div>
        ) : bed.status === 'available' ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admit">Admit Patient</TabsTrigger>
              <TabsTrigger value="reserve">Reserve Bed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="admit" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input id="patientName" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="mrn">MRN</Label>
                  <Input id="mrn" value={mrn} onChange={(e) => setMrn(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <Textarea id="diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} />
                </div>
                <div>
                  <Label>Acuity Level</Label>
                  <Select value={acuity} onValueChange={(v) => setAcuity(v as typeof acuity)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdmit}>Admit Patient</Button>
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="reserve" className="space-y-4">
              <div>
                <Label htmlFor="reservedFor">Reserved For</Label>
                <Input id="reservedFor" value={reservedFor} onChange={(e) => setReservedFor(e.target.value)} placeholder="Patient name or reason" />
              </div>
              <DialogFooter>
                <Button onClick={() => { onAction(bed.id, 'reserve'); onOpenChange(false); }}>Reserve Bed</Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {bed.status === 'reserved' && `Reserved for: ${bed.reservedFor || 'Unknown'}`}
              {bed.status === 'maintenance' && 'Bed is under maintenance'}
              {bed.status === 'cleaning' && 'Bed is being cleaned'}
            </p>
            <DialogFooter>
              <Button onClick={() => { onAction(bed.id, 'available'); onOpenChange(false); }}>
                Mark as Available
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
