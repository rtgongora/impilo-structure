import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { VisitType } from "@/components/queue/SecureQueueCard";

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (patient: {
    name: string;
    mrn?: string;
    age: number;
    gender: string;
    chiefComplaint: string;
    triageLevel: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
    visitType: VisitType;
    appointmentTime?: string;
  }) => void;
  queueType: 'opd' | 'casualty' | 'inpatient';
}

export function AddPatientDialog({ open, onOpenChange, onAdd, queueType }: AddPatientDialogProps) {
  const [name, setName] = useState("");
  const [mrn, setMrn] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("M");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [visitType, setVisitType] = useState<VisitType>('in-person');
  const [appointmentTime, setAppointmentTime] = useState("");
  const [triageLevel, setTriageLevel] = useState<'red' | 'orange' | 'yellow' | 'green' | 'blue'>(
    queueType === 'casualty' ? 'yellow' : queueType === 'inpatient' ? 'green' : 'green'
  );

  const handleSubmit = () => {
    if (name && age && chiefComplaint) {
      onAdd({
        name,
        mrn: mrn || undefined,
        age: parseInt(age),
        gender,
        chiefComplaint,
        triageLevel,
        visitType,
        appointmentTime: appointmentTime || undefined,
      });
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setName("");
    setMrn("");
    setAge("");
    setGender("M");
    setChiefComplaint("");
    setVisitType('in-person');
    setAppointmentTime("");
    setTriageLevel(queueType === 'casualty' ? 'yellow' : queueType === 'inpatient' ? 'green' : 'green');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Patient to Queue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="name">Patient Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <Label htmlFor="mrn">MRN (Optional)</Label>
            <Input id="mrn" value={mrn} onChange={(e) => setMrn(e.target.value)} placeholder="MRN-XXXX-XXX" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Years" />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="O">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visit Type */}
          <div>
            <Label>Visit Type</Label>
            <Select value={visitType} onValueChange={(v) => setVisitType(v as VisitType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-person">In Person</SelectItem>
                <SelectItem value="virtual">Virtual / Teleconsult</SelectItem>
                <SelectItem value="appointment">Booked Appointment</SelectItem>
                <SelectItem value="consultation">Consultation Request</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(visitType === 'appointment' || visitType === 'virtual') && (
            <div>
              <Label htmlFor="appointmentTime">Appointment Time</Label>
              <Input 
                id="appointmentTime" 
                value={appointmentTime} 
                onChange={(e) => setAppointmentTime(e.target.value)} 
                placeholder="e.g., 10:30 AM" 
              />
            </div>
          )}

          <div>
            <Label htmlFor="complaint">Chief Complaint</Label>
            <Textarea 
              id="complaint" 
              value={chiefComplaint} 
              onChange={(e) => setChiefComplaint(e.target.value)} 
              placeholder="Primary reason for visit"
              rows={2}
            />
          </div>
          <div>
            <Label className="mb-2 block">Triage Level</Label>
            <RadioGroup value={triageLevel} onValueChange={(v) => setTriageLevel(v as typeof triageLevel)} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="red" id="red" className="border-[hsl(var(--critical))] text-[hsl(var(--critical))]" />
                <Label htmlFor="red" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[hsl(var(--critical))]" />
                  Immediate (Resuscitation)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="orange" id="orange" className="border-orange-500 text-orange-500" />
                <Label htmlFor="orange" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500" />
                  Emergency (&lt;10 min)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yellow" id="yellow" className="border-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
                <Label htmlFor="yellow" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[hsl(var(--warning))]" />
                  Urgent (&lt;60 min)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="green" id="green" className="border-[hsl(var(--success))] text-[hsl(var(--success))]" />
                <Label htmlFor="green" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[hsl(var(--success))]" />
                  Standard (&lt;120 min)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blue" id="blue" className="border-[hsl(var(--primary))] text-[hsl(var(--primary))]" />
                <Label htmlFor="blue" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[hsl(var(--primary))]" />
                  Routine (&lt;240 min)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Add to Queue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
