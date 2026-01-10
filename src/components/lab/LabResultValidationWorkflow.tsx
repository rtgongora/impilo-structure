import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useLabOrders, useLabResults } from "@/hooks/useLabData";
import { useLabResultValidation, type ResultValidationData } from "@/hooks/lims/useLabResultValidation";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FlaskConical,
  Clock,
  Send,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

export function LabResultValidationWorkflow() {
  const { orders, loading: ordersLoading, refetch } = useLabOrders();
  const { results, loading: resultsLoading } = useLabResults();
  const { enterResult, technicalValidate, clinicalValidate, releaseResult, batchReleaseResults, processing } = useLabResultValidation();
  
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "validated" | "released">("pending");
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [resultData, setResultData] = useState<ResultValidationData>({
    result_value: "",
    result_unit: "",
    is_abnormal: false,
    is_critical: false,
    notes: "",
  });

  const loading = ordersLoading || resultsLoading;

  const pendingResults = results.filter(r => r.status === "pending" || r.status === "resulted");
  const validatedResults = results.filter(r => r.status === "verified");
  const releasedResults = results.filter(r => r.status === "completed");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "resulted":
        return <Badge className="bg-blue-500"><FlaskConical className="h-3 w-3 mr-1" />Resulted</Badge>;
      case "verified":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
      case "completed":
        return <Badge className="bg-purple-500"><Send className="h-3 w-3 mr-1" />Released</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleEnterResult = async () => {
    if (!selectedResult) return;
    const success = await enterResult(selectedResult.id, resultData);
    if (success) {
      setEntryDialogOpen(false);
      setResultData({ result_value: "", result_unit: "", is_abnormal: false, is_critical: false, notes: "" });
      refetch();
    }
  };

  const handleBatchRelease = async () => {
    if (selectedResults.length === 0) return;
    await batchReleaseResults(selectedResults);
    setSelectedResults([]);
    refetch();
  };

  const toggleSelectResult = (id: string) => {
    setSelectedResults(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const selectAllValidated = () => {
    setSelectedResults(validatedResults.map(r => r.id));
  };

  const currentResults = activeTab === "pending" ? pendingResults : 
                         activeTab === "validated" ? validatedResults : releasedResults;

  return (
    <div className="space-y-6">
      {/* Workflow Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${activeTab === "pending" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingResults.length}</p>
                <p className="text-xs text-muted-foreground">Awaiting Entry/Validation</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${activeTab === "validated" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setActiveTab("validated")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{validatedResults.length}</p>
                <p className="text-xs text-muted-foreground">Ready for Release</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${activeTab === "released" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setActiveTab("released")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Send className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{releasedResults.length}</p>
                <p className="text-xs text-muted-foreground">Released Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{results.filter(r => r.is_critical).length}</p>
                <p className="text-xs text-muted-foreground">Critical Values</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {activeTab === "pending" ? "Pending Results" : 
             activeTab === "validated" ? "Validated Results" : "Released Results"}
          </h2>
          <Badge variant="outline">{currentResults.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "validated" && selectedResults.length > 0 && (
            <Button onClick={handleBatchRelease} disabled={processing}>
              <Send className="h-4 w-4 mr-2" />
              Release Selected ({selectedResults.length})
            </Button>
          )}
          {activeTab === "validated" && (
            <Button variant="outline" onClick={selectAllValidated}>
              Select All
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Results Table */}
      <Card>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                {activeTab === "validated" && <TableHead className="w-12"></TableHead>}
                <TableHead>Test</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading results...
                  </TableCell>
                </TableRow>
              ) : currentResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No results in this category
                  </TableCell>
                </TableRow>
              ) : (
                currentResults.map(result => (
                  <TableRow 
                    key={result.id}
                    className={result.is_critical ? "bg-red-50" : result.is_abnormal ? "bg-orange-50" : ""}
                  >
                    {activeTab === "validated" && (
                      <TableCell>
                        <Checkbox
                          checked={selectedResults.includes(result.id)}
                          onCheckedChange={() => toggleSelectResult(result.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <p className="font-medium">{result.test_name}</p>
                        <p className="text-xs text-muted-foreground">{result.test_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${
                        result.is_critical ? "text-red-600" : 
                        result.is_abnormal ? "text-orange-600" : ""
                      }`}>
                        {result.result_value || "—"}
                      </span>
                      <span className="text-muted-foreground ml-1">{result.result_unit}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {result.reference_range || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(result.status)}</TableCell>
                    <TableCell>
                      {result.is_critical && (
                        <Badge variant="destructive" className="animate-pulse">CRIT</Badge>
                      )}
                      {result.is_abnormal && !result.is_critical && (
                        <Badge className="bg-orange-500">ABN</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {result.performed_at 
                        ? format(new Date(result.performed_at), "dd MMM HH:mm")
                        : "—"
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {result.status === "pending" && (
                          <Dialog open={entryDialogOpen && selectedResult?.id === result.id} onOpenChange={(open) => {
                            setEntryDialogOpen(open);
                            if (open) {
                              setSelectedResult(result);
                              setResultData({
                                result_value: "",
                                result_unit: result.result_unit || "",
                                is_abnormal: false,
                                is_critical: false,
                                notes: "",
                              });
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                Enter Result
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Enter Result: {result.test_name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Result Value *</Label>
                                    <Input
                                      value={resultData.result_value}
                                      onChange={(e) => setResultData({...resultData, result_value: e.target.value})}
                                      placeholder="Enter value..."
                                    />
                                  </div>
                                  <div>
                                    <Label>Unit</Label>
                                    <Input
                                      value={resultData.result_unit}
                                      onChange={(e) => setResultData({...resultData, result_unit: e.target.value})}
                                      placeholder="e.g., mg/dL"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="abnormal"
                                      checked={resultData.is_abnormal}
                                      onCheckedChange={(c) => setResultData({...resultData, is_abnormal: !!c})}
                                    />
                                    <Label htmlFor="abnormal">Abnormal</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="critical"
                                      checked={resultData.is_critical}
                                      onCheckedChange={(c) => setResultData({...resultData, is_critical: !!c, is_abnormal: !!c || resultData.is_abnormal})}
                                    />
                                    <Label htmlFor="critical" className="text-red-600 font-medium">
                                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                                      Critical
                                    </Label>
                                  </div>
                                </div>
                                <div>
                                  <Label>Notes</Label>
                                  <Textarea
                                    value={resultData.notes}
                                    onChange={(e) => setResultData({...resultData, notes: e.target.value})}
                                    placeholder="Additional comments..."
                                    rows={2}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEntryDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleEnterResult}
                                  disabled={!resultData.result_value || processing}
                                >
                                  Save Result
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        {result.status === "resulted" && (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => technicalValidate(result.id, true)}
                              disabled={processing}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => technicalValidate(result.id, false, "Rejected for retest")}
                              disabled={processing}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                        {result.status === "verified" && (
                          <Button 
                            size="sm"
                            onClick={() => releaseResult(result.id)}
                            disabled={processing}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Release
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
}
