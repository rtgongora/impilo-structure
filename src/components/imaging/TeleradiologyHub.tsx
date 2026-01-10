import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePACSConsults } from "@/hooks/pacs/usePACSConsults";
import { 
  Send, MessageSquare, UserCheck, XCircle, Clock, 
  CheckCircle, Building2, AlertCircle, Plus
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export function TeleradiologyHub() {
  const {
    consults,
    loading,
    fetchConsults,
    requestConsult,
    acceptConsult,
    declineConsult,
    completeConsult,
  } = usePACSConsults();

  const [activeTab, setActiveTab] = useState("incoming");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedConsult, setSelectedConsult] = useState<any>(null);
  const [responseForm, setResponseForm] = useState({
    findings: "",
    impression: "",
    recommendations: "",
  });

  useEffect(() => {
    fetchConsults();
  }, []);

  const incomingConsults = consults.filter(c => c.status === 'pending' || c.status === 'accepted');
  const myConsults = consults.filter(c => c.status === 'in_progress');
  const completedConsults = consults.filter(c => c.status === 'completed');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-500"><UserCheck className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-500">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'declined':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'stat':
        return <Badge variant="destructive" className="animate-pulse">STAT</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-500">Urgent</Badge>;
      default:
        return <Badge variant="secondary">Routine</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'second_opinion':
        return <Badge variant="outline">Second Opinion</Badge>;
      case 'specialist_review':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Specialist</Badge>;
      case 'teleradiology':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Teleradiology</Badge>;
      case 'urgent_read':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Urgent Read</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleCompleteConsult = async () => {
    if (selectedConsult && responseForm.findings && responseForm.impression) {
      await completeConsult(selectedConsult.id, responseForm);
      setResponseDialogOpen(false);
      setResponseForm({ findings: "", impression: "", recommendations: "" });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Stats Header */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{incomingConsults.length}</p>
                <p className="text-xs text-muted-foreground">Pending Consults</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myConsults.length}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
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
                <p className="text-2xl font-bold">{completedConsults.length}</p>
                <p className="text-xs text-muted-foreground">Completed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {consults.filter(c => c.urgency === 'stat' && c.status !== 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">STAT Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Consult Button */}
      <div className="flex justify-end">
        <Button onClick={() => setRequestDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Request Consult
        </Button>
      </div>

      {/* Consults Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="incoming">
            Incoming ({incomingConsults.length})
          </TabsTrigger>
          <TabsTrigger value="my-consults">
            My Consults ({myConsults.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedConsults.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-4">
          <Card>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Study</TableHead>
                    <TableHead>Clinical Question</TableHead>
                    <TableHead>From Facility</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomingConsults.map((consult) => (
                    <TableRow 
                      key={consult.id}
                      className={consult.urgency === 'stat' ? 'bg-red-50' : ''}
                    >
                      <TableCell>{getUrgencyBadge(consult.urgency)}</TableCell>
                      <TableCell>{getTypeBadge(consult.consult_type)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {consult.study?.accession_number || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {consult.clinical_question || 'No question provided'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span className="text-sm">{consult.requesting_facility_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(consult.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>{getStatusBadge(consult.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {consult.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => acceptConsult(consult.id)}>
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => declineConsult(consult.id, 'Unable to take on at this time')}
                            >
                              Decline
                            </Button>
                          </>
                        )}
                        {consult.status === 'accepted' && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedConsult(consult);
                              setResponseDialogOpen(true);
                            }}
                          >
                            Respond
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {incomingConsults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No incoming consult requests
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="my-consults" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {myConsults.map((consult) => (
              <Card key={consult.id} className={consult.urgency === 'stat' ? 'border-red-300 bg-red-50' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    {getUrgencyBadge(consult.urgency)}
                    {getTypeBadge(consult.consult_type)}
                  </div>
                  <CardTitle className="text-lg">{consult.study?.study_description || 'Study'}</CardTitle>
                  <CardDescription>
                    {consult.study?.modality} • {consult.study?.accession_number}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Clinical Question</p>
                      <p className="text-sm">{consult.clinical_question || 'No question provided'}</p>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>From: {consult.requesting_facility_name || 'Unknown Facility'}</span>
                      <span>Accepted {formatDistanceToNow(new Date(consult.accepted_at || consult.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1" variant="outline">
                        Open Study
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedConsult(consult);
                          setResponseDialogOpen(true);
                        }}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Submit Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {myConsults.length === 0 && (
              <Card className="col-span-2">
                <CardContent className="text-center py-8 text-muted-foreground">
                  No active consults assigned to you
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <Card>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Study</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>TAT</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedConsults.map((consult) => (
                    <TableRow key={consult.id}>
                      <TableCell>{getTypeBadge(consult.consult_type)}</TableCell>
                      <TableCell>{consult.study?.accession_number || 'N/A'}</TableCell>
                      <TableCell>{consult.requesting_facility_name || 'Unknown'}</TableCell>
                      <TableCell>
                        {consult.responded_at && format(new Date(consult.responded_at), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        {consult.turnaround_minutes ? `${consult.turnaround_minutes} min` : '--'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline">View Response</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="mt-4">
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              Consult requests you've sent to other facilities
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Consult Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Radiology Consult</DialogTitle>
            <DialogDescription>
              Request a specialist opinion or teleradiology read for a study
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Study (Accession Number)</label>
              <Input placeholder="Enter accession number" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Consult Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="second_opinion">Second Opinion</SelectItem>
                  <SelectItem value="specialist_review">Specialist Review</SelectItem>
                  <SelectItem value="teleradiology">Teleradiology Read</SelectItem>
                  <SelectItem value="urgent_read">Urgent Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Urgency</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stat">STAT</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="routine">Routine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Clinical Question</label>
              <Textarea placeholder="What specific question or concern do you have about this study?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
            <Button>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Consult Response</DialogTitle>
            <DialogDescription>
              Provide your findings and impression for this consult request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Findings</label>
              <Textarea 
                placeholder="Detailed findings..."
                value={responseForm.findings}
                onChange={(e) => setResponseForm({ ...responseForm, findings: e.target.value })}
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Impression</label>
              <Textarea 
                placeholder="Your diagnostic impression..."
                value={responseForm.impression}
                onChange={(e) => setResponseForm({ ...responseForm, impression: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Recommendations (optional)</label>
              <Textarea 
                placeholder="Any follow-up recommendations..."
                value={responseForm.recommendations}
                onChange={(e) => setResponseForm({ ...responseForm, recommendations: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCompleteConsult}>
              <Send className="w-4 h-4 mr-2" />
              Submit Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
