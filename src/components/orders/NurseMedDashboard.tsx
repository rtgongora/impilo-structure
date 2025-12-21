import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Timer,
  Pill,
  User,
  Bed,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, differenceInMinutes, addHours, parseISO, isAfter, isBefore } from "date-fns";

interface MedicationDue {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  ward: string;
  bed: string;
  encounterId: string;
  medicationName: string;
  dosage: string;
  route: string;
  frequency: string;
  nextDueTime: Date;
  status: "overdue" | "due-now" | "upcoming";
  isPrn: boolean;
}

// Helper to calculate next due time based on frequency
const calculateNextDueTime = (startDate: string, frequency: string): Date => {
  const start = parseISO(startDate);
  const now = new Date();
  
  const frequencyHours: Record<string, number> = {
    "Once daily": 24,
    "Twice daily": 12,
    "Three times daily": 8,
    "Four times daily": 6,
    "Every 4 hours": 4,
    "Every 6 hours": 6,
    "Every 8 hours": 8,
    "Every 12 hours": 12,
    "Once weekly": 168,
    "PRN": 0,
  };

  const hours = frequencyHours[frequency] || 8;
  if (hours === 0) return now; // PRN - always "available"

  // Calculate how many doses have passed
  const hoursSinceStart = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
  const dosesPassed = Math.floor(hoursSinceStart / hours);
  
  // Next due time is start + (dosesPassed + 1) * hours
  return addHours(start, (dosesPassed + 1) * hours);
};

export function NurseMedDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  const { data: medications, isLoading, refetch } = useQuery({
    queryKey: ["nurse-med-dashboard"],
    queryFn: async () => {
      // Get active medication orders with patient and encounter info
      const { data: orders, error } = await supabase
        .from("medication_orders")
        .select(`
          id,
          medication_name,
          dosage,
          dosage_unit,
          route,
          frequency,
          is_prn,
          start_date,
          patient_id,
          encounter_id,
          patients!inner (
            id,
            first_name,
            last_name,
            mrn
          ),
          encounters!inner (
            id,
            ward,
            bed,
            status
          )
        `)
        .eq("status", "active")
        .eq("encounters.status", "active");

      if (error) throw error;

      const now = new Date();
      const meds: MedicationDue[] = [];

      for (const order of orders || []) {
        const patient = order.patients as any;
        const encounter = order.encounters as any;
        const nextDue = calculateNextDueTime(order.start_date, order.frequency);
        const minutesUntilDue = differenceInMinutes(nextDue, now);

        let status: "overdue" | "due-now" | "upcoming" = "upcoming";
        if (minutesUntilDue < -30) {
          status = "overdue";
        } else if (minutesUntilDue <= 30) {
          status = "due-now";
        }

        meds.push({
          id: order.id,
          patientId: order.patient_id,
          patientName: `${patient.first_name} ${patient.last_name}`,
          patientMrn: patient.mrn,
          ward: encounter.ward || "Unknown",
          bed: encounter.bed || "Unknown",
          encounterId: order.encounter_id,
          medicationName: order.medication_name,
          dosage: `${order.dosage} ${order.dosage_unit}`,
          route: order.route,
          frequency: order.frequency,
          nextDueTime: nextDue,
          status: order.is_prn ? "upcoming" : status,
          isPrn: order.is_prn || false,
        });
      }

      // Sort by urgency
      return meds.sort((a, b) => {
        const statusOrder = { overdue: 0, "due-now": 1, upcoming: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.nextDueTime.getTime() - b.nextDueTime.getTime();
      });
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const overdueMeds = medications?.filter((m) => m.status === "overdue") || [];
  const dueSoonMeds = medications?.filter((m) => m.status === "due-now") || [];
  const upcomingMeds = medications?.filter((m) => m.status === "upcoming") || [];
  const prnMeds = medications?.filter((m) => m.isPrn) || [];

  const getStatusBadge = (status: string, isPrn: boolean) => {
    if (isPrn) {
      return <Badge variant="outline">PRN</Badge>;
    }
    switch (status) {
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      case "due-now":
        return <Badge className="bg-orange-500 text-white">Due Now</Badge>;
      default:
        return <Badge variant="secondary">Upcoming</Badge>;
    }
  };

  const getTimeDisplay = (dueTime: Date, status: string) => {
    const now = new Date();
    const minutes = differenceInMinutes(dueTime, now);

    if (status === "overdue") {
      return `${Math.abs(minutes)} min overdue`;
    } else if (minutes <= 0) {
      return "Due now";
    } else if (minutes < 60) {
      return `Due in ${minutes} min`;
    } else {
      return format(dueTime, "HH:mm");
    }
  };

  const MedicationCard = ({ med }: { med: MedicationDue }) => (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
        med.status === "overdue"
          ? "border-destructive/50 bg-destructive/5"
          : med.status === "due-now"
          ? "border-orange-500/50 bg-orange-500/5"
          : ""
      }`}
      onClick={() => navigate(`/orders?patient=${med.patientId}`)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" />
          <span className="font-medium">{med.medicationName}</span>
        </div>
        {getStatusBadge(med.status, med.isPrn)}
      </div>
      
      <div className="text-sm text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <User className="h-3 w-3" />
          <span>{med.patientName}</span>
          <span className="text-xs">({med.patientMrn})</span>
        </div>
        <div className="flex items-center gap-2">
          <Bed className="h-3 w-3" />
          <span>{med.ward} • {med.bed}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{med.dosage} {med.route}</span>
          {!med.isPrn && (
            <span className={`flex items-center gap-1 ${
              med.status === "overdue" ? "text-destructive" : 
              med.status === "due-now" ? "text-orange-500" : ""
            }`}>
              <Clock className="h-3 w-3" />
              {getTimeDisplay(med.nextDueTime, med.status)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medication Dashboard
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="p-2 rounded-lg bg-destructive/10 text-center">
            <p className="text-2xl font-bold text-destructive">{overdueMeds.length}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
          <div className="p-2 rounded-lg bg-orange-500/10 text-center">
            <p className="text-2xl font-bold text-orange-500">{dueSoonMeds.length}</p>
            <p className="text-xs text-muted-foreground">Due Now</p>
          </div>
          <div className="p-2 rounded-lg bg-muted text-center">
            <p className="text-2xl font-bold">{upcomingMeds.length}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </TabsTrigger>
            <TabsTrigger value="due" className="text-xs">
              <Timer className="h-3 w-3 mr-1" />
              Due
            </TabsTrigger>
            <TabsTrigger value="prn" className="text-xs">
              PRN
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-3">
            <TabsContent value="all" className="mt-0 space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading medications...
                </div>
              ) : medications?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <p>No pending medications</p>
                </div>
              ) : (
                medications?.map((med) => <MedicationCard key={med.id} med={med} />)
              )}
            </TabsContent>

            <TabsContent value="overdue" className="mt-0 space-y-2">
              {overdueMeds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <p>No overdue medications</p>
                </div>
              ) : (
                overdueMeds.map((med) => <MedicationCard key={med.id} med={med} />)
              )}
            </TabsContent>

            <TabsContent value="due" className="mt-0 space-y-2">
              {dueSoonMeds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No medications due now</p>
                </div>
              ) : (
                dueSoonMeds.map((med) => <MedicationCard key={med.id} med={med} />)
              )}
            </TabsContent>

            <TabsContent value="prn" className="mt-0 space-y-2">
              {prnMeds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No PRN medications</p>
                </div>
              ) : (
                prnMeds.map((med) => <MedicationCard key={med.id} med={med} />)
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}