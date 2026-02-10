import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import * as pct from "@/lib/kernel/pct/pctClient";
import {
  Gauge, AlertTriangle, BedDouble, LogOut,
  Activity, RefreshCw, Clock, Users
} from "lucide-react";

export default function PctControlTower() {
  const { toast } = useToast();
  const [facilityId, setFacilityId] = useState(localStorage.getItem("pct_facility_id") || "");
  const [data, setData] = useState<any>(null);
  const [bottlenecks, setBottlenecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!facilityId) return;
    setLoading(true);
    try {
      const [ct, bn] = await Promise.all([
        pct.getControlTower(facilityId),
        pct.getBottlenecks(facilityId),
      ]);
      setData(ct);
      setBottlenecks(bn.bottlenecks || []);
    } catch (e: any) {
      toast({ title: "Error", description: e?.error?.message || "Failed to load", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <AppLayout title="PCT Control Tower">
      <div className="flex-1 p-4 space-y-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Gauge className="h-5 w-5" /> PCT Control Tower</h1>
            <p className="text-sm text-muted-foreground">Facility-wide operational oversight</p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Facility ID" value={facilityId} onChange={e => setFacilityId(e.target.value)} className="w-48" />
            <Button onClick={refresh} disabled={loading || !facilityId}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        {data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{data.queues?.reduce((s: number, q: any) => s + (q.waiting || 0), 0) || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Waiting</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-1 text-green-500" />
                  <p className="text-2xl font-bold">{data.queues?.reduce((s: number, q: any) => s + (q.in_service || 0), 0) || 0}</p>
                  <p className="text-xs text-muted-foreground">In Service</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <BedDouble className="h-8 w-8 mx-auto mb-1 text-blue-500" />
                  <p className="text-2xl font-bold">{data.admissions?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Admitted</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <LogOut className="h-8 w-8 mx-auto mb-1 text-orange-500" />
                  <p className="text-2xl font-bold">{data.pending_discharges?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Pending Discharge</p>
                </CardContent>
              </Card>
            </div>

            {/* Queue Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>Queue Heatmap by Workspace</CardTitle>
                <CardDescription>Real-time queue load across service points</CardDescription>
              </CardHeader>
              <CardContent>
                {data.queues?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.queues.map((q: any) => {
                      const load = (q.waiting || 0) + (q.in_service || 0);
                      const severity = load > 10 ? "destructive" : load > 5 ? "secondary" : "outline";
                      return (
                        <div key={q.queue_id} className="p-3 border rounded-lg space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{q.name}</span>
                            <Badge variant={severity as any}>{q.type}</Badge>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>⏳ {q.waiting || 0} waiting</span>
                            <span>📞 {q.called || 0} called</span>
                            <span>🩺 {q.in_service || 0} active</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No active queues</p>
                )}
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" /> Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.alerts?.length > 0 ? (
                  <div className="space-y-2">
                    {data.alerts.map((a: any) => (
                      <div key={a.alert_id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant={a.severity === "CRITICAL" ? "destructive" : "secondary"}>{a.severity}</Badge>
                          <span className="text-sm">{a.rule_code}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No open alerts</p>
                )}
              </CardContent>
            </Card>

            {/* Bottlenecks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-500" /> Bottlenecks ({bottlenecks.length})
                </CardTitle>
                <CardDescription>Items waiting &gt; 20 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                {bottlenecks.length > 0 ? (
                  <div className="space-y-2">
                    {bottlenecks.slice(0, 20).map((b: any) => (
                      <div key={b.item_id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="text-sm font-medium">{b.ticket_number || b.item_id?.slice(0, 8)}</span>
                          <span className="text-xs text-muted-foreground ml-2">Journey: {b.journey_id?.slice(0, 10)}</span>
                        </div>
                        <Badge variant="destructive">{b.wait_minutes} min</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No bottlenecks detected</p>
                )}
              </CardContent>
            </Card>

            {/* Discharge Blockers */}
            {data.pending_discharges?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogOut className="h-5 w-5" /> Discharge Blockers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.pending_discharges.map((d: any) => (
                      <div key={d.case_id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="text-sm font-medium">Case {d.case_id?.slice(0, 8)}</span>
                          <span className="text-xs text-muted-foreground ml-2">Journey: {d.journey_id?.slice(0, 10)}</span>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant={d.status === "BLOCKED" ? "destructive" : "secondary"}>{d.status}</Badge>
                          {((d.blockers_json as any[]) || []).map((b: any, i: number) => (
                            <Badge key={i} variant="outline">{b.type || b}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!data && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Gauge className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Enter a Facility ID and click Refresh to load the control tower</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
