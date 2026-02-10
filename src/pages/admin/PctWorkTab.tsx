import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import * as pct from "@/lib/kernel/pct/pctClient";
import {
  PlayCircle, StopCircle, Search, UserPlus, ArrowRight,
  Phone, ListChecks, Stethoscope, BedDouble, LogOut,
  Activity, Clock
} from "lucide-react";

export default function PctWorkTab() {
  const { toast } = useToast();
  const [tab, setTab] = useState("shift");

  // Shift state
  const [facilityId, setFacilityId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [dutyMode, setDutyMode] = useState("CLINICAL");
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Sorting state
  const [searchCpid, setSearchCpid] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [triageAcuity, setTriageAcuity] = useState("GREEN");
  const [newCpid, setNewCpid] = useState("");

  // Queue state
  const [queues, setQueues] = useState<any[]>([]);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [calledItem, setCalledItem] = useState<any>(null);

  const handleStartShift = async () => {
    setLoading(true);
    try {
      localStorage.setItem("pct_facility_id", facilityId);
      localStorage.setItem("pct_workspace_id", workspaceId);
      const data = await pct.startWork(facilityId, workspaceId, dutyMode);
      setSession(data);
      toast({ title: "Shift started", description: `Session ${data.session_id?.slice(0, 8)}` });
      // Load queues
      const q = await pct.getQueues(facilityId, workspaceId);
      setQueues(q.queues || []);
    } catch (e: any) {
      toast({ title: "Error", description: e?.error?.message || "Failed to start shift", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleEndShift = async () => {
    if (!session) return;
    try {
      await pct.endWork(session.session_id);
      setSession(null);
      toast({ title: "Shift ended" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.error?.message || "Failed", variant: "destructive" });
    }
  };

  const handleSearch = async () => {
    try {
      const data = await pct.searchPatients(searchCpid || undefined);
      if (data.status === "RESOLUTION_REQUIRED") {
        toast({ title: "Resolution required", description: "Redirect to TSHEPO/VITO for identity resolution" });
        return;
      }
      setSearchResults(data.results || []);
    } catch (e: any) {
      toast({ title: "Error", description: e?.error?.message || "Search failed", variant: "destructive" });
    }
  };

  const handleStartJourney = async () => {
    try {
      const data = await pct.startJourney(newCpid, facilityId);
      toast({ title: "Journey started", description: `ID: ${data.journey_id}` });
      setSearchResults(prev => [data, ...prev]);
    } catch (e: any) {
      toast({ title: "Error", description: e?.error?.message || "Failed", variant: "destructive" });
    }
  };

  const handleTriage = async (journeyId: string) => {
    try {
      await pct.triageJourney(journeyId, triageAcuity);
      toast({ title: "Triage recorded", description: `Acuity: ${triageAcuity}` });
    } catch (e: any) {
      toast({ title: "Error", description: e?.error?.message || "Failed", variant: "destructive" });
    }
  };

  const handleCallNext = async () => {
    if (!selectedQueue) return;
    try {
      const data = await pct.callNext(selectedQueue);
      setCalledItem(data);
      toast({ title: data ? `Called: ${data.ticket_number}` : "Queue empty" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.error?.message || "Failed", variant: "destructive" });
    }
  };

  const acuityColor = (a: string) => {
    const map: Record<string, string> = { RED: "destructive", ORANGE: "secondary", YELLOW: "outline", GREEN: "default", BLUE: "secondary" };
    return (map[a] || "default") as "destructive" | "secondary" | "outline" | "default";
  };

  return (
    <AppLayout title="PCT Work Tab">
      <div className="flex-1 p-4 space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Activity className="h-5 w-5" /> PCT Work Tab</h1>
            <p className="text-sm text-muted-foreground">Patient Care Tracker — Frontline Operations</p>
          </div>
          {session && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" /> On Shift: {session.session_id?.slice(0, 8)}
            </Badge>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="shift"><PlayCircle className="h-3.5 w-3.5 mr-1" />Shift</TabsTrigger>
            <TabsTrigger value="sorting"><Search className="h-3.5 w-3.5 mr-1" />Sorting</TabsTrigger>
            <TabsTrigger value="queue"><ListChecks className="h-3.5 w-3.5 mr-1" />Queue</TabsTrigger>
          </TabsList>

          <TabsContent value="shift" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PlayCircle className="h-5 w-5" /> Start Shift</CardTitle>
                <CardDescription>Select facility and workspace to begin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input placeholder="Facility ID" value={facilityId} onChange={e => setFacilityId(e.target.value)} />
                  <Input placeholder="Workspace ID" value={workspaceId} onChange={e => setWorkspaceId(e.target.value)} />
                  <Select value={dutyMode} onValueChange={setDutyMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLINICAL">Clinical</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="VIRTUAL">Virtual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleStartShift} disabled={loading || !!session || !facilityId}>
                    <PlayCircle className="h-4 w-4 mr-1" /> Start Shift
                  </Button>
                  {session && (
                    <Button variant="destructive" onClick={handleEndShift}>
                      <StopCircle className="h-4 w-4 mr-1" /> End Shift
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sorting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Patient Search</CardTitle>
                <CardDescription>Search by CPID or start a new journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Enter CPID..." value={searchCpid} onChange={e => setSearchCpid(e.target.value)} className="flex-1" />
                  <Button onClick={handleSearch}><Search className="h-4 w-4 mr-1" /> Search</Button>
                </div>
                <div className="flex gap-2 items-center">
                  <Input placeholder="New patient CPID..." value={newCpid} onChange={e => setNewCpid(e.target.value)} className="flex-1" />
                  <Button variant="outline" onClick={handleStartJourney} disabled={!newCpid}>
                    <UserPlus className="h-4 w-4 mr-1" /> New Journey
                  </Button>
                </div>
              </CardContent>
            </Card>

            {searchResults.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Journeys</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {searchResults.map((j: any) => (
                      <div key={j.journey_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{j.journey_id?.slice(0, 12)}...</p>
                          <p className="text-xs text-muted-foreground">CPID: {j.patient_cpid} • State: {j.state}</p>
                        </div>
                        <div className="flex gap-1">
                          <Select value={triageAcuity} onValueChange={setTriageAcuity}>
                            <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["RED", "ORANGE", "YELLOW", "GREEN", "BLUE"].map(a => (
                                <SelectItem key={a} value={a}>{a}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant={acuityColor(triageAcuity)} onClick={() => handleTriage(j.journey_id)}>
                            Triage
                          </Button>
                          <Button size="sm" variant="outline" onClick={async () => {
                            if (selectedQueue) {
                              await pct.enqueue(selectedQueue, j.journey_id);
                              toast({ title: "Enqueued" });
                            } else {
                              toast({ title: "Select a queue first", variant: "destructive" });
                            }
                          }}>
                            <ArrowRight className="h-3 w-3" /> Queue
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> Queue Operations</CardTitle>
                <CardDescription>Call next patient, manage queue items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Select value={selectedQueue} onValueChange={setSelectedQueue}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select queue..." /></SelectTrigger>
                    <SelectContent>
                      {queues.map((q: any) => (
                        <SelectItem key={q.queue_id} value={q.queue_id}>{q.name} ({q.type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => pct.getQueues(facilityId).then(d => setQueues(d.queues || []))}>Refresh</Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCallNext} disabled={!selectedQueue} className="flex-1">
                    <Phone className="h-4 w-4 mr-1" /> Call Next
                  </Button>
                </div>
                {calledItem && (
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                    <p className="font-bold text-lg">🔔 {calledItem.ticket_number || "No ticket"}</p>
                    <p className="text-sm text-muted-foreground">Journey: {calledItem.journey_id}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" onClick={() => pct.updateQueueItemStatus(calledItem.item_id, "IN_SERVICE").then(() => toast({ title: "In Service" }))}>
                        <Stethoscope className="h-3 w-3 mr-1" /> Start Service
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => pct.updateQueueItemStatus(calledItem.item_id, "NO_SHOW").then(() => { toast({ title: "No Show" }); setCalledItem(null); })}>
                        No Show
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => pct.updateQueueItemStatus(calledItem.item_id, "COMPLETED").then(() => { toast({ title: "Completed" }); setCalledItem(null); })}>
                        Complete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
