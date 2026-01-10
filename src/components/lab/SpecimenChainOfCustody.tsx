import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  FlaskConical, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle,
  Search,
  QrCode,
  Printer,
  ArrowRight,
  User,
  MapPin,
  Thermometer
} from "lucide-react";
import { format } from "date-fns";

interface Specimen {
  id: string;
  specimen_id: string;
  lab_order_id: string | null;
  specimen_type: string;
  collected_at: string | null;
  collected_by: string | null;
  collection_site: string | null;
  status: string;
  rejection_reason: string | null;
  storage_location: string | null;
  created_at: string;
}

interface ChainOfCustodyEvent {
  id: string;
  specimen_id: string;
  event_type: string;
  from_location: string | null;
  to_location: string | null;
  from_custodian: string | null;
  to_custodian: string | null;
  temperature_at_event: number | null;
  notes: string | null;
  event_time: string;
  performed_by: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending Collection", color: "bg-muted text-muted-foreground", icon: <Clock className="h-3 w-3" /> },
  collected: { label: "Collected", color: "bg-blue-500/20 text-blue-700", icon: <FlaskConical className="h-3 w-3" /> },
  in_transit: { label: "In Transit", color: "bg-amber-500/20 text-amber-700", icon: <Truck className="h-3 w-3" /> },
  received: { label: "Received", color: "bg-purple-500/20 text-purple-700", icon: <Package className="h-3 w-3" /> },
  processing: { label: "Processing", color: "bg-cyan-500/20 text-cyan-700", icon: <FlaskConical className="h-3 w-3" /> },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Rejected", color: "bg-destructive/20 text-destructive", icon: <XCircle className="h-3 w-3" /> },
};

const eventTypeLabels: Record<string, string> = {
  collected: "Collected",
  transferred: "Transferred",
  received: "Received at Lab",
  processing_started: "Processing Started",
  aliquoted: "Aliquoted",
  stored: "Stored",
  disposed: "Disposed",
  rejected: "Rejected"
};

export function SpecimenChainOfCustody() {
  const { toast } = useToast();
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null);
  const [chainEvents, setChainEvents] = useState<ChainOfCustodyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [eventForm, setEventForm] = useState({
    event_type: "received",
    to_location: "",
    to_custodian: "",
    temperature_at_event: "",
    notes: ""
  });

  useEffect(() => {
    fetchSpecimens();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedSpecimen) {
      fetchChainOfCustody(selectedSpecimen.id);
    }
  }, [selectedSpecimen]);

  const fetchSpecimens = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("specimens")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSpecimens(data || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchChainOfCustody = async (specimenId: string) => {
    try {
      const { data, error } = await supabase
        .from("lab_workflow_events")
        .select("*")
        .eq("entity_type", "specimen")
        .eq("entity_id", specimenId)
        .order("event_time", { ascending: true });

      if (error) throw error;
      
      // Map workflow events to chain of custody format
      const events: ChainOfCustodyEvent[] = (data || []).map(e => ({
        id: e.id,
        specimen_id: specimenId,
        event_type: e.event_type,
        from_location: e.from_status,
        to_location: e.to_status,
        from_custodian: null,
        to_custodian: e.performed_by,
        temperature_at_event: null,
        notes: e.notes,
        event_time: e.created_at,
        performed_by: e.performed_by
      }));
      
      setChainEvents(events);
    } catch (err: any) {
      console.error("Error fetching chain of custody:", err);
    }
  };

  const recordEvent = async () => {
    if (!selectedSpecimen) return;

    try {
      // Record the workflow event
      const { error: eventError } = await supabase
        .from("lab_workflow_events")
        .insert({
          entity_type: "specimen",
          entity_id: selectedSpecimen.id,
          event_type: eventForm.event_type,
          from_status: selectedSpecimen.status,
          to_status: eventForm.event_type === "received" ? "received" : 
                     eventForm.event_type === "processing_started" ? "processing" :
                     eventForm.event_type === "rejected" ? "rejected" : selectedSpecimen.status,
          notes: eventForm.notes || null,
          performed_by: null // Would be auth.uid() in production
        });

      if (eventError) throw eventError;

      // Update specimen status
      const newStatus = eventForm.event_type === "received" ? "received" :
                       eventForm.event_type === "processing_started" ? "processing" :
                       eventForm.event_type === "rejected" ? "rejected" :
                       eventForm.event_type === "collected" ? "collected" :
                       eventForm.event_type === "transferred" ? "in_transit" : selectedSpecimen.status;

      const { error: updateError } = await supabase
        .from("specimens")
        .update({ 
          status: newStatus,
          storage_location: eventForm.to_location || null
        })
        .eq("id", selectedSpecimen.id);

      if (updateError) throw updateError;

      toast({ title: "Event Recorded", description: "Chain of custody updated" });
      setShowEventDialog(false);
      setEventForm({ event_type: "received", to_location: "", to_custodian: "", temperature_at_event: "", notes: "" });
      fetchSpecimens();
      fetchChainOfCustody(selectedSpecimen.id);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filteredSpecimens = specimens.filter(s => 
    s.specimen_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.specimen_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant="outline" className={`${config.color} gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Specimen List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Specimens
          </CardTitle>
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search specimens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : filteredSpecimens.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No specimens found</div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredSpecimens.map(specimen => (
                  <div
                    key={specimen.id}
                    onClick={() => setSelectedSpecimen(specimen)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSpecimen?.id === specimen.id 
                        ? "bg-primary/10 border border-primary/30" 
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm font-medium">{specimen.specimen_id}</span>
                      {getStatusBadge(specimen.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {specimen.specimen_type}
                    </div>
                    {specimen.collected_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Collected: {format(new Date(specimen.collected_at), "MMM d, HH:mm")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chain of Custody Timeline */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Chain of Custody</CardTitle>
            {selectedSpecimen && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <QrCode className="h-3.5 w-3.5" />
                  Print Label
                </Button>
                <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <ArrowRight className="h-3.5 w-3.5" />
                      Record Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Chain of Custody Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Event Type</Label>
                        <Select value={eventForm.event_type} onValueChange={v => setEventForm(f => ({ ...f, event_type: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="collected">Collected</SelectItem>
                            <SelectItem value="transferred">Transferred</SelectItem>
                            <SelectItem value="received">Received at Lab</SelectItem>
                            <SelectItem value="processing_started">Processing Started</SelectItem>
                            <SelectItem value="aliquoted">Aliquoted</SelectItem>
                            <SelectItem value="stored">Stored</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            placeholder="e.g., Main Lab, Freezer A-3"
                            value={eventForm.to_location}
                            onChange={e => setEventForm(f => ({ ...f, to_location: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Received By</Label>
                          <Input
                            placeholder="Name or ID"
                            value={eventForm.to_custodian}
                            onChange={e => setEventForm(f => ({ ...f, to_custodian: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Temperature (°C)</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 4"
                          value={eventForm.temperature_at_event}
                          onChange={e => setEventForm(f => ({ ...f, temperature_at_event: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          placeholder="Additional notes..."
                          value={eventForm.notes}
                          onChange={e => setEventForm(f => ({ ...f, notes: e.target.value }))}
                        />
                      </div>

                      <Button onClick={recordEvent} className="w-full">Record Event</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedSpecimen ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Select a specimen to view chain of custody
            </div>
          ) : (
            <div className="space-y-4">
              {/* Specimen Summary */}
              <div className="p-4 rounded-lg bg-muted/50 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Specimen ID</div>
                  <div className="font-mono font-medium">{selectedSpecimen.specimen_id}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Type</div>
                  <div className="font-medium">{selectedSpecimen.specimen_type}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Current Status</div>
                  <div className="mt-1">{getStatusBadge(selectedSpecimen.status)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div className="font-medium">{selectedSpecimen.storage_location || "—"}</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                
                {chainEvents.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No chain of custody events recorded
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chainEvents.map((event, index) => (
                      <div key={event.id} className="relative">
                        <div className={`absolute -left-4 w-4 h-4 rounded-full border-2 ${
                          index === chainEvents.length - 1 
                            ? "bg-primary border-primary" 
                            : "bg-background border-muted-foreground"
                        }`} />
                        <div className="ml-4 p-3 rounded-lg bg-card border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              {eventTypeLabels[event.event_type] || event.event_type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.event_time), "MMM d, yyyy HH:mm")}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {event.to_location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.to_location}
                              </span>
                            )}
                            {event.to_custodian && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {event.to_custodian}
                              </span>
                            )}
                            {event.temperature_at_event !== null && (
                              <span className="flex items-center gap-1">
                                <Thermometer className="h-3 w-3" />
                                {event.temperature_at_event}°C
                              </span>
                            )}
                          </div>
                          {event.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
