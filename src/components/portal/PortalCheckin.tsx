import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  QrCode,
  CheckCircle2,
  MapPin,
  Clock,
  Loader2,
  Smartphone,
  ScanLine,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ValidEntryType = Database["public"]["Enums"]["queue_entry_type"];
type ValidPriority = Database["public"]["Enums"]["queue_priority"];

interface PortalCheckinProps {
  patientId: string;
  healthId?: string;
  onCheckinComplete?: () => void;
}

interface PendingAppointment {
  id: string;
  facility_id: string;
  facility_name: string;
  department: string;
  provider_name: string;
  scheduled_start: string;
  appointment_type: string;
  location?: string;
}

export function PortalCheckin({ patientId, healthId, onCheckinComplete }: PortalCheckinProps) {
  const [checkInMethod, setCheckInMethod] = useState<"qr" | "code">("qr");
  const [facilityCode, setFacilityCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<{ id: string; name: string } | null>(null);
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [checkinDetails, setCheckinDetails] = useState<{
    ticketNumber: string;
    queue: string;
    facility: string;
  } | null>(null);

  // Simulated QR scan - in production would use camera API
  const handleQrScan = async () => {
    setIsLoading(true);
    try {
      // Simulate QR code scan result
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock: Get facility from QR code
      const mockFacilityId = "fac-001";
      const mockFacilityName = "Central Hospital";
      
      setSelectedFacility({ id: mockFacilityId, name: mockFacilityName });
      await fetchPendingAppointments(mockFacilityId);
      setShowServiceSelection(true);
    } catch (error) {
      console.error("QR scan error:", error);
      toast.error("Failed to scan QR code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!facilityCode.trim()) {
      toast.error("Please enter a facility code");
      return;
    }

    setIsLoading(true);
    try {
      // Look up facility by code
      const { data: facility, error }: { data: any; error: any } = await ((supabase as any)
        .from("facilities")
        .select("id, name")
        .eq("code", facilityCode.toUpperCase())
        .maybeSingle());


      if (error || !facility) {
        toast.error("Facility not found. Please check the code.");
        return;
      }

      setSelectedFacility({ id: facility.id, name: facility.name });
      await fetchPendingAppointments(facility.id);
      setShowServiceSelection(true);
    } catch (error) {
      console.error("Code lookup error:", error);
      toast.error("Failed to find facility");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingAppointments = async (facilityId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("appointments")
      .select("id, department, scheduled_start, appointment_type, location")
      .eq("patient_id", patientId)
      .gte("scheduled_start", today)
      .in("status", ["scheduled", "confirmed"])
      .order("scheduled_start");

    // Transform to include facility name
    const appointments: PendingAppointment[] = (data || []).map((apt: any) => ({
      id: apt.id,
      facility_id: selectedFacility?.id || "",
      facility_name: selectedFacility?.name || "Unknown Facility",
      department: apt.department || "General",
      provider_name: "Provider",
      scheduled_start: apt.scheduled_start,
      appointment_type: apt.appointment_type,
      location: apt.location,
    }));

    setPendingAppointments(appointments);
  };

  const performCheckin = async (appointmentId?: string, serviceType?: string) => {
    if (!selectedFacility) return;

    setIsLoading(true);
    try {
      // Generate ticket number
      const ticketNumber = `T${Math.floor(Math.random() * 900) + 100}`;
      
      // First, find a default queue for the facility
      const { data: defaultQueue } = await supabase
        .from("queue_definitions")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!defaultQueue) {
        toast.error("No active queue found. Please contact reception.");
        return;
      }

      // Create queue item with proper types
      const insertData = {
        queue_id: defaultQueue.id,
        patient_id: patientId,
        appointment_id: appointmentId,
        entry_type: (appointmentId ? "appointment" : "walk_in") as ValidEntryType,
        reason_for_visit: serviceType || "General Consultation",
        priority: "routine" as ValidPriority,
        ticket_number: ticketNumber,
        status: "waiting" as Database["public"]["Enums"]["queue_item_status"],
      };

      const { data: queueData, error: queueError } = await supabase
        .from("queue_items")
        .insert(insertData)
        .select()
        .single();

      if (queueError) throw queueError;

      // Send notification
      await supabase.from("client_queue_notifications").insert({
        patient_id: patientId,
        notification_type: "queue_confirmation",
        title: "Check-in Complete",
        message: `You have been checked in at ${selectedFacility.name}. Your ticket number is ${ticketNumber}.`,
        channel: "in_app",
      });

      setCheckinDetails({
        ticketNumber,
        queue: serviceType || "General",
        facility: selectedFacility.name,
      });
      setCheckinSuccess(true);
      toast.success("Check-in successful!");
      onCheckinComplete?.();
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Failed to complete check-in");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkinSuccess && checkinDetails) {
    return (
      <Card className="border-success bg-success/5">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-success mb-2">Checked In!</h2>
          <p className="text-muted-foreground mb-6">
            You're now in the queue at {checkinDetails.facility}
          </p>

          <Card className="max-w-xs mx-auto">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Your Ticket Number</p>
              <p className="text-4xl font-bold font-mono text-primary">
                {checkinDetails.ticketNumber}
              </p>
              <Badge className="mt-2">{checkinDetails.queue}</Badge>
            </CardContent>
          </Card>

          <div className="mt-6 text-sm text-muted-foreground">
            <p>You will be notified when it's your turn.</p>
            <p>Track your status in the Queue Status tab.</p>
          </div>

          <Button 
            className="mt-6" 
            onClick={() => {
              setCheckinSuccess(false);
              setShowServiceSelection(false);
              setSelectedFacility(null);
            }}
          >
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Facility Check-in
          </CardTitle>
          <CardDescription>
            Check in when you arrive at the facility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={checkInMethod} onValueChange={(v) => setCheckInMethod(v as "qr" | "code")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                Scan QR Code
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Enter Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="mt-6">
              <div className="text-center space-y-4">
                <div className="w-48 h-48 mx-auto border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/30">
                  {isLoading ? (
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                  ) : (
                    <ScanLine className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Scan the QR code displayed at the facility entrance
                </p>
                <Button onClick={handleQrScan} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Start Scanning
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="code" className="mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="facilityCode">Facility Code</Label>
                  <Input
                    id="facilityCode"
                    placeholder="Enter facility code (e.g., ZW-HAR-001)"
                    value={facilityCode}
                    onChange={(e) => setFacilityCode(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono tracking-wider"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    The code is usually displayed at the reception desk
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCodeSubmit}
                  disabled={isLoading || !facilityCode.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Service Selection Dialog */}
      <Dialog open={showServiceSelection} onOpenChange={setShowServiceSelection}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {selectedFacility?.name}
            </DialogTitle>
            <DialogDescription>
              Select why you're here today
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {pendingAppointments.length > 0 && (
              <>
                <h4 className="text-sm font-medium">Your Appointments Today</h4>
                <div className="space-y-2">
                  {pendingAppointments.map(apt => (
                    <Card 
                      key={apt.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => performCheckin(apt.id, apt.appointment_type)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{apt.department}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(apt.scheduled_start).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      or walk-in
                    </span>
                  </div>
                </div>
              </>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => performCheckin(undefined, "General Consultation")}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Walk-in / No Appointment
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowServiceSelection(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
