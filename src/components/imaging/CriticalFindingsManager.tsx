import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePACSCriticalFindings, CriticalFinding } from "@/hooks/pacs/usePACSCriticalFindings";
import { 
  AlertTriangle, Phone, MessageSquare, User, 
  CheckCircle, Clock, ArrowUpCircle, Bell
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export function CriticalFindingsManager() {
  const {
    findings,
    pendingCount,
    loading,
    fetchFindings,
    recordNotification,
    confirmNotification,
    escalateFinding,
  } = usePACSCriticalFindings();

  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<CriticalFinding | null>(null);
  const [notifyForm, setNotifyForm] = useState({
    notified_to: "",
    notification_method: "phone" as 'phone' | 'page' | 'in_person' | 'secure_message',
  });
  const [confirmDetails, setConfirmDetails] = useState("");

  useEffect(() => {
    fetchFindings();
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="animate-pulse"><AlertTriangle className="w-3 h-3 mr-1" />Critical</Badge>;
      case 'significant':
        return <Badge className="bg-orange-500"><AlertTriangle className="w-3 h-3 mr-1" />Significant</Badge>;
      case 'unexpected':
        return <Badge className="bg-yellow-500"><Bell className="w-3 h-3 mr-1" />Unexpected</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-red-50 text-red-700 animate-pulse"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'notifying':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Phone className="w-3 h-3 mr-1" />Notifying</Badge>;
      case 'notified':
        return <Badge className="bg-blue-500"><MessageSquare className="w-3 h-3 mr-1" />Notified</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'escalated':
        return <Badge className="bg-purple-500"><ArrowUpCircle className="w-3 h-3 mr-1" />Escalated</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingFindings = findings.filter(f => f.status === 'pending' || f.status === 'notifying');
  const notifiedFindings = findings.filter(f => f.status === 'notified');
  const confirmedFindings = findings.filter(f => f.status === 'confirmed' || f.status === 'escalated');

  const handleRecordNotification = async () => {
    if (selectedFinding && notifyForm.notified_to) {
      await recordNotification(selectedFinding.id, notifyForm);
      setNotifyDialogOpen(false);
      setNotifyForm({ notified_to: "", notification_method: "phone" });
    }
  };

  const handleConfirmNotification = async () => {
    if (selectedFinding && confirmDetails) {
      await confirmNotification(selectedFinding.id, confirmDetails);
      setConfirmDialogOpen(false);
      setConfirmDetails("");
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Alert Banner */}
      {pendingCount > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full animate-pulse">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">
                  {pendingCount} Critical Finding{pendingCount > 1 ? 's' : ''} Require Notification
                </h3>
                <p className="text-sm text-red-600">
                  Please notify the ordering physician immediately and document the communication.
                </p>
              </div>
              <Button variant="destructive">
                View Pending
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className={pendingCount > 0 ? 'border-red-300' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${pendingCount > 0 ? 'bg-red-100' : 'bg-muted'}`}>
                <Clock className={`w-5 h-5 ${pendingCount > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingFindings.length}</p>
                <p className="text-xs text-muted-foreground">Pending Notification</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifiedFindings.length}</p>
                <p className="text-xs text-muted-foreground">Awaiting Confirmation</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{confirmedFindings.length}</p>
                <p className="text-xs text-muted-foreground">Confirmed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ArrowUpCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {findings.filter(f => f.status === 'escalated').length}
                </p>
                <p className="text-xs text-muted-foreground">Escalated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Pending Notifications
          </CardTitle>
          <CardDescription>
            Critical findings requiring immediate physician notification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {pendingFindings.map((finding) => (
                <Card key={finding.id} className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(finding.severity)}
                          {getStatusBadge(finding.status)}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(finding.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="font-medium">{finding.finding_description}</p>
                        <div className="text-sm text-muted-foreground">
                          Study: {finding.study?.accession_number || 'N/A'} • 
                          {finding.study?.modality} • 
                          {finding.study?.study_description}
                        </div>
                        {finding.notification_attempts > 0 && (
                          <p className="text-xs text-orange-600">
                            {finding.notification_attempts} previous attempt(s)
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedFinding(finding);
                            setNotifyDialogOpen(true);
                          }}
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          Record Notification
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => escalateFinding(finding.id, 'supervisor')}
                        >
                          <ArrowUpCircle className="w-3 h-3 mr-1" />
                          Escalate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pendingFindings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No pending critical findings</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Awaiting Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Awaiting Confirmation
          </CardTitle>
          <CardDescription>
            Notifications sent but not yet confirmed by recipient
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {notifiedFindings.map((finding) => (
                <div key={finding.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getSeverityBadge(finding.severity)}
                      <span className="text-sm font-medium">{finding.finding_description}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Notified: {finding.notified_to} via {finding.notification_method} • 
                      {finding.first_notified_at && format(new Date(finding.first_notified_at), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedFinding(finding);
                      setConfirmDialogOpen(true);
                    }}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Confirm
                  </Button>
                </div>
              ))}
              {notifiedFindings.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">
                  No notifications awaiting confirmation
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Record Notification Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Critical Finding Notification</DialogTitle>
            <DialogDescription>
              Document that you have notified the appropriate physician about this critical finding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="font-medium text-red-800">{selectedFinding?.finding_description}</p>
              <p className="text-sm text-red-600 mt-1">
                Study: {selectedFinding?.study?.accession_number}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Who was notified?</label>
              <Input
                placeholder="Name of physician or provider"
                value={notifyForm.notified_to}
                onChange={(e) => setNotifyForm({ ...notifyForm, notified_to: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Method</label>
              <Select
                value={notifyForm.notification_method}
                onValueChange={(v: any) => setNotifyForm({ ...notifyForm, notification_method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="page">Pager</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                  <SelectItem value="secure_message">Secure Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordNotification}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Record Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Notification Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Notification Receipt</DialogTitle>
            <DialogDescription>
              Document confirmation that the physician received and acknowledged this critical finding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-800">{selectedFinding?.finding_description}</p>
              <p className="text-sm text-blue-600 mt-1">
                Notified: {selectedFinding?.notified_to} via {selectedFinding?.notification_method}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmation Details</label>
              <Textarea
                placeholder="Document how confirmation was received (e.g., 'Dr. Smith acknowledged by phone at 14:32, will review case immediately')"
                value={confirmDetails}
                onChange={(e) => setConfirmDetails(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmNotification} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
