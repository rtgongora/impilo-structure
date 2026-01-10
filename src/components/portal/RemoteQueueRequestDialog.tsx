import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, MapPin, Send } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Facility {
  id: string;
  name: string;
}

interface RemoteQueueRequestDialogProps {
  patientId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const SERVICE_TYPES = [
  { value: "opd_consultation", label: "OPD Consultation" },
  { value: "lab_sample_collection", label: "Lab Sample Collection" },
  { value: "imaging", label: "Imaging / Radiology" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "anc_clinic", label: "ANC Clinic" },
  { value: "hiv_clinic", label: "HIV Clinic" },
  { value: "ncd_clinic", label: "NCD Clinic" },
  { value: "specialist_clinic", label: "Specialist Clinic" },
  { value: "dialysis", label: "Dialysis" },
  { value: "telecare", label: "Telecare / Virtual Consult" },
];

export function RemoteQueueRequestDialog({
  patientId,
  onSuccess,
  trigger,
}: RemoteQueueRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  
  const [facilityId, setFacilityId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [requestedDate, setRequestedDate] = useState<Date>();
  const [reason, setReason] = useState("");

  useEffect(() => {
    const fetchFacilities = async () => {
      const { data } = await supabase
        .from("facilities")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      setFacilities(data || []);
    };
    fetchFacilities();
  }, []);

  const handleSubmit = async () => {
    if (!facilityId || !serviceType || !requestedDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("client_queue_requests").insert({
        patient_id: patientId,
        facility_id: facilityId,
        service_type: serviceType,
        requested_date: format(requestedDate, "yyyy-MM-dd"),
        reason_for_visit: reason || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Queue request submitted successfully", {
        description: "You will be notified once your request is reviewed.",
      });
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFacilityId("");
    setServiceType("");
    setRequestedDate(undefined);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Request Queue Entry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Queue Entry</DialogTitle>
          <DialogDescription>
            Submit a request to join a queue before your visit. Subject to facility availability
            and approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Facility Selection */}
          <div className="space-y-2">
            <Label htmlFor="facility">
              Facility <span className="text-destructive">*</span>
            </Label>
            <Select value={facilityId} onValueChange={setFacilityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select facility" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {f.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="service">
              Service Type <span className="text-destructive">*</span>
            </Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Requested Date */}
          <div className="space-y-2">
            <Label>
              Preferred Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !requestedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {requestedDate ? format(requestedDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={requestedDate}
                  onSelect={setRequestedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Textarea
              id="reason"
              placeholder="Briefly describe your reason for visit (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
