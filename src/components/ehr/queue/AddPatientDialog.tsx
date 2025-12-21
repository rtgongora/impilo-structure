import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (patient: {
    name: string;
    age: number;
    gender: string;
    chiefComplaint: string;
    triageLevel: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
  }) => void;
  queueType: 'opd' | 'casualty';
}

export function AddPatientDialog({ open, onOpenChange, onAdd, queueType }: AddPatientDialogProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("M");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [triageLevel, setTriageLevel] = useState<'red' | 'orange' | 'yellow' | 'green' | 'blue'>(
    queueType === 'casualty' ? 'yellow' : 'green'
  );

  const handleSubmit = () => {
    if (name && age && chiefComplaint) {
      onAdd({
        name,
        age: parseInt(age),
        gender,
        chiefComplaint,
        triageLevel,
      });
      // Reset form
      setName("");
      setAge("");
      setGender("M");
      setChiefComplaint("");
      setTriageLevel(queueType === 'casualty' ? 'yellow' : 'green');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Patient to {queueType === 'opd' ? 'OPD' : 'Casualty'} Queue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Patient Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
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
                <RadioGroupItem value="red" id="red" className="border-red-500 text-red-500" />
                <Label htmlFor="red" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Immediate (Resuscitation)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="orange" id="orange" className="border-orange-500 text-orange-500" />
                <Label htmlFor="orange" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500" />
                  Very Urgent (&lt;10 min)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yellow" id="yellow" className="border-yellow-500 text-yellow-500" />
                <Label htmlFor="yellow" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  Urgent (&lt;60 min)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="green" id="green" className="border-green-500 text-green-500" />
                <Label htmlFor="green" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  Standard (&lt;120 min)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blue" id="blue" className="border-blue-500 text-blue-500" />
                <Label htmlFor="blue" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  Non-Urgent (&lt;240 min)
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
