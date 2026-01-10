import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useLabCriticalAlerts, type LabCriticalAlert } from "@/hooks/lims/useLabCriticalAlerts";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  User,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export function LabCriticalAlertsDashboard() {
  const { alerts, loading, stats, refetch, acknowledgeAlert, escalateAlert, resolveAlert } = useLabCriticalAlerts();
  const [selectedAlert, setSelectedAlert] = useState<LabCriticalAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  const getUrgencyBadge = (urgency: LabCriticalAlert["urgency"]) => {
    switch (urgency) {
      case "critical":
        return <Badge variant="destructive" className="animate-pulse">CRITICAL</Badge>;
      case "urgent":
        return <Badge className="bg-orange-500">URGENT</Badge>;
      case "high":
        return <Badge className="bg-yellow-500">HIGH</Badge>;
    }
  };

  const getStatusBadge = (status: LabCriticalAlert["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "notified":
        return <Badge variant="secondary"><Bell className="h-3 w-3 mr-1" />Notified</Badge>;
      case "acknowledged":
        return <Badge className="bg-blue-500"><CheckCircle2 className="h-3 w-3 mr-1" />Acknowledged</Badge>;
      case "escalated":
        return <Badge className="bg-orange-500"><ArrowUpRight className="h-3 w-3 mr-1" />Escalated</Badge>;
      case "resolved":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</Badge>;
    }
  };

  const getCriticalTypeBadge = (type: LabCriticalAlert["critical_type"]) => {
    switch (type) {
      case "panic":
        return <Badge variant="destructive">PANIC</Badge>;
      case "high":
        return <Badge className="bg-red-400">HIGH</Badge>;
      case "low":
        return <Badge className="bg-blue-500">LOW</Badge>;
      case "abnormal":
        return <Badge className="bg-orange-500">ABNORMAL</Badge>;
    }
  };

  const handleResolve = async () => {
    if (selectedAlert) {
      await resolveAlert(selectedAlert.id, resolutionNotes);
      setResolveDialogOpen(false);
      setResolutionNotes("");
      setSelectedAlert(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.critical}</p>
                <p className="text-xs text-muted-foreground">Critical Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.acknowledged}</p>
                <p className="text-xs text-muted-foreground">Acknowledged</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ArrowUpRight className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.escalated}</p>
                <p className="text-xs text-muted-foreground">Escalated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Active Critical Alerts
            </CardTitle>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading alerts...</p>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No active critical alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => (
                  <Card 
                    key={alert.id} 
                    className={`border-l-4 ${
                      alert.urgency === "critical" ? "border-l-red-500 bg-red-50/50" :
                      alert.urgency === "urgent" ? "border-l-orange-500" : "border-l-yellow-500"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getUrgencyBadge(alert.urgency)}
                            {getCriticalTypeBadge(alert.critical_type)}
                            {getStatusBadge(alert.status)}
                          </div>
                          
                          <h4 className="font-semibold text-lg">{alert.test_name}</h4>
                          <p className="text-2xl font-bold text-red-600 my-1">
                            {alert.result_value}
                          </p>
                          
                          {alert.patient && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>
                                {alert.patient.first_name} {alert.patient.last_name} ({alert.patient.mrn})
                              </span>
                            </div>
                          )}
                          
                          <p className="text-sm mt-2">{alert.alert_message}</p>
                          
                          <p className="text-xs text-muted-foreground mt-2">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          {alert.status === "pending" && (
                            <Button 
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                          
                          {(alert.status === "pending" || alert.status === "acknowledged") && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => escalateAlert(alert.id)}
                            >
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                              Escalate
                            </Button>
                          )}
                          
                          {alert.status !== "resolved" && (
                            <Dialog open={resolveDialogOpen && selectedAlert?.id === alert.id} onOpenChange={(open) => {
                              setResolveDialogOpen(open);
                              if (open) setSelectedAlert(alert);
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="secondary" size="sm">
                                  Resolve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Resolve Critical Alert</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="p-3 bg-accent/50 rounded-lg">
                                    <p className="font-medium">{alert.test_name}</p>
                                    <p className="text-lg font-bold">{alert.result_value}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Resolution Notes</label>
                                    <Textarea
                                      value={resolutionNotes}
                                      onChange={(e) => setResolutionNotes(e.target.value)}
                                      placeholder="Document the clinical response and outcome..."
                                      rows={4}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleResolve}>
                                    Mark as Resolved
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>

                      {alert.acknowledged_at && (
                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                          Acknowledged {format(new Date(alert.acknowledged_at), "dd MMM HH:mm")}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
