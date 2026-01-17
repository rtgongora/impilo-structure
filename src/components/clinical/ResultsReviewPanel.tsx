/**
 * Results Review Panel
 * Lab/Imaging result acknowledgment workflow
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FlaskConical,
  ImageIcon,
  Loader2,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useResultAcknowledgments, type ResultAcknowledgment, type ResultInput } from "@/hooks/useResultAcknowledgments";

interface ResultsReviewPanelProps {
  patientId: string;
  reviewerId: string;
  reviewerName?: string;
}

// Mock pending results that need acknowledgment (in real implementation, these would come from lab/imaging orders)
interface PendingResult {
  id: string;
  result_type: 'laboratory' | 'imaging' | 'pathology';
  result_table: string;
  name: string;
  date: string;
  summary?: string;
  is_critical: boolean;
  is_abnormal: boolean;
}

export function ResultsReviewPanel({
  patientId,
  reviewerId,
  reviewerName,
}: ResultsReviewPanelProps) {
  const [selectedResult, setSelectedResult] = useState<PendingResult | null>(null);
  const [isAcknowledgeOpen, setIsAcknowledgeOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState("");

  const {
    acknowledgments,
    criticalResults,
    isLoading,
    acknowledgeResult,
  } = useResultAcknowledgments({ patientId });

  // In a real implementation, this would fetch from lab_orders, imaging_orders tables
  const [pendingResults] = useState<PendingResult[]>([]);

  const handleOpenAcknowledge = (result: PendingResult) => {
    setSelectedResult(result);
    setActionNotes("");
    setFollowUpRequired(false);
    setFollowUpNotes("");
    setIsAcknowledgeOpen(true);
  };

  const handleAcknowledge = async () => {
    if (!selectedResult) return;

    const input: ResultInput = {
      patient_id: patientId,
      result_id: selectedResult.id,
      result_table: selectedResult.result_table,
      result_type: selectedResult.result_type,
      acknowledgment_type: 'reviewed',
      acknowledged_by: reviewerId,
      is_critical: selectedResult.is_critical,
      action_notes: actionNotes || undefined,
      follow_up_required: followUpRequired,
      follow_up_notes: followUpNotes || undefined,
    };

    await acknowledgeResult.mutateAsync(input);
    setIsAcknowledgeOpen(false);
    setSelectedResult(null);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "laboratory": return <FlaskConical className="h-4 w-4" />;
      case "imaging": return <ImageIcon className="h-4 w-4" />;
      default: return <FileCheck className="h-4 w-4" />;
    }
  };

  const AcknowledgmentCard = ({ ack }: { ack: ResultAcknowledgment }) => (
    <div className={`p-4 border rounded-lg ${ack.is_critical ? "border-critical/50 bg-critical/5" : "border-border"}`}>
      <div className="flex items-center gap-2 mb-2">
        {getResultIcon(ack.result_type)}
        <span className="font-medium capitalize">{ack.result_type} Result</span>
        {ack.is_critical && (
          <Badge variant="destructive" className="text-xs">Critical</Badge>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {format(new Date(ack.acknowledged_at), "MMM d, yyyy HH:mm")}
        </span>
        <span className="flex items-center gap-1 text-success">
          <CheckCircle2 className="h-3 w-3" />
          Acknowledged
        </span>
      </div>
      {ack.action_notes && (
        <p className="text-sm text-muted-foreground mt-2">{ack.action_notes}</p>
      )}
      {ack.follow_up_required && (
        <div className="mt-2 text-xs text-warning flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Follow-up required{ack.follow_up_notes && `: ${ack.follow_up_notes}`}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={criticalResults.length > 0 ? "border-critical/50 bg-critical/5" : ""}>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${criticalResults.length > 0 ? "text-critical" : "text-muted-foreground"}`}>
              {criticalResults.length}
            </div>
            <div className="text-xs text-muted-foreground">Critical Results</div>
          </CardContent>
        </Card>
        <Card className={pendingResults.length > 0 ? "border-warning/50 bg-warning/5" : ""}>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${pendingResults.length > 0 ? "text-warning" : "text-muted-foreground"}`}>
              {pendingResults.length}
            </div>
            <div className="text-xs text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{acknowledgments.length}</div>
            <div className="text-xs text-muted-foreground">Acknowledged</div>
          </CardContent>
        </Card>
      </div>

      {/* Results Tabs */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Results Review</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="relative">
                Pending
                {pendingResults.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs justify-center">
                    {pendingResults.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3">
                  {pendingResults.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
                      <p>No pending results to review</p>
                    </div>
                  ) : (
                    pendingResults.map((result) => (
                      <div
                        key={result.id}
                        className={`p-4 border rounded-lg ${
                          result.is_critical 
                            ? "border-critical/50 bg-critical/5" 
                            : result.is_abnormal 
                              ? "border-warning/50 bg-warning/5" 
                              : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getResultIcon(result.result_type)}
                              <span className="font-medium">{result.name}</span>
                              {result.is_critical && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Critical
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="capitalize">{result.result_type}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(result.date), "MMM d, yyyy HH:mm")}
                              </span>
                            </div>
                            {result.summary && (
                              <p className="text-sm text-muted-foreground mt-2">{result.summary}</p>
                            )}
                          </div>
                          <Button size="sm" onClick={() => handleOpenAcknowledge(result)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Acknowledge
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="acknowledged">
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3">
                  {acknowledgments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No acknowledged results</p>
                    </div>
                  ) : (
                    acknowledgments.map((ack) => (
                      <AcknowledgmentCard key={ack.id} ack={ack} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Acknowledge Dialog */}
      <Dialog open={isAcknowledgeOpen} onOpenChange={setIsAcknowledgeOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Acknowledge Result
            </DialogTitle>
          </DialogHeader>
          
          {selectedResult && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{selectedResult.name}</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(selectedResult.date), "MMM d, yyyy HH:mm")}
                </div>
                {selectedResult.summary && (
                  <div className="text-sm mt-2">{selectedResult.summary}</div>
                )}
              </div>

              <div>
                <Label>Action Notes (optional)</Label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Add notes about actions taken..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="followUp"
                  checked={followUpRequired}
                  onCheckedChange={(checked) => setFollowUpRequired(checked === true)}
                />
                <Label htmlFor="followUp" className="cursor-pointer">
                  Follow-up required
                </Label>
              </div>

              {followUpRequired && (
                <div>
                  <Label>Follow-up Notes</Label>
                  <Textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="Describe required follow-up actions..."
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcknowledgeOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAcknowledge} 
              disabled={acknowledgeResult.isPending}
            >
              {acknowledgeResult.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
