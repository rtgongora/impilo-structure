import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClaims, useRemittanceAdvices } from "@/hooks/useClaimsData";
import { useChargeSheets } from "@/hooks/useBillingData";
import { 
  FileText,
  DollarSign,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Send,
  Building2,
  Calendar,
  RefreshCw,
  Eye,
  Gavel,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const PAYERS = [
  { id: "psmas", name: "PSMAS", code: "PSMAS" },
  { id: "cimas", name: "CIMAS", code: "CIMAS" },
  { id: "fimas", name: "FIMAS", code: "FIMAS" },
  { id: "premier", name: "Premier Service Medical Aid", code: "PREMIER" },
  { id: "cellmed", name: "CellMed Health", code: "CELLMED" },
  { id: "govt", name: "Government Medical Scheme", code: "GOVT" },
];

export function ClaimsManagement() {
  const { claims, loading: claimsLoading, createClaim, submitClaim, refetch } = useClaims();
  const { remittances, loading: remittancesLoading } = useRemittanceAdvices();
  const { chargeSheets } = useChargeSheets();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewClaimDialog, setShowNewClaimDialog] = useState(false);
  const [selectedCharges, setSelectedCharges] = useState<string[]>([]);
  
  // New Claim Form
  const [claimForm, setClaimForm] = useState({
    payerId: "",
    memberId: "",
    groupNumber: "",
    authNumber: "",
    notes: ""
  });

  const loading = claimsLoading || remittancesLoading;

  // Stats
  const stats = {
    total: claims.length,
    draft: claims.filter(c => c.status === "draft").length,
    submitted: claims.filter(c => c.status === "submitted" || c.status === "processing" || c.status === "acknowledged").length,
    approved: claims.filter(c => c.status === "approved" || c.status === "paid" || c.status === "partially_approved").length,
    denied: claims.filter(c => c.status === "denied").length,
    totalClaimed: claims.reduce((sum, c) => sum + c.total_claimed, 0),
    totalApproved: claims.reduce((sum, c) => sum + (c.total_approved || 0), 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
      case "paid":
      case "partially_approved":
        return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />{status}</Badge>;
      case "submitted":
      case "processing":
      case "acknowledged":
        return <Badge className="bg-warning text-warning-foreground"><Clock className="h-3 w-3 mr-1" />{status}</Badge>;
      case "denied":
      case "written_off":
        return <Badge className="bg-destructive text-destructive-foreground"><XCircle className="h-3 w-3 mr-1" />{status}</Badge>;
      case "draft":
        return <Badge variant="secondary"><FileText className="h-3 w-3 mr-1" />{status}</Badge>;
      case "appealed":
        return <Badge className="bg-primary text-primary-foreground"><Gavel className="h-3 w-3 mr-1" />{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const eligibleCharges = chargeSheets.filter(c => 
    c.status === "pending" || c.status === "billed"
  );

  const handleCreateClaim = async () => {
    if (!claimForm.payerId || selectedCharges.length === 0) {
      toast.error("Select payer and charges");
      return;
    }

    const payer = PAYERS.find(p => p.id === claimForm.payerId);
    const selected = chargeSheets.filter(c => selectedCharges.includes(c.id));
    const totalAmount = selected.reduce((sum, c) => sum + c.net_amount, 0);
    const firstCharge = selected[0];

    try {
      await createClaim({
        patient_id: firstCharge.patient_id,
        visit_id: firstCharge.visit_id,
        payer_name: payer?.name || "",
        claim_type: "insurance",
        total_claimed: totalAmount,
        member_id: claimForm.memberId || undefined,
        group_number: claimForm.groupNumber || undefined,
        notes: claimForm.notes || undefined,
      });
      toast.success("Claim created successfully");
      setShowNewClaimDialog(false);
      setSelectedCharges([]);
      setClaimForm({
        payerId: "",
        memberId: "",
        groupNumber: "",
        authNumber: "",
        notes: ""
      });
    } catch (err) {
      toast.error("Failed to create claim");
    }
  };

  const handleSubmitClaim = async (claimId: string) => {
    const success = await submitClaim(claimId);
    if (success) {
      toast.success("Claim submitted successfully");
    } else {
      toast.error("Failed to submit claim");
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.payer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Claims</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-2xl font-bold">{stats.submitted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">${stats.totalApproved.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Denied</p>
                <p className="text-2xl font-bold">{stats.denied}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="claims" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="remittances">Remittance Advices</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={showNewClaimDialog} onOpenChange={setShowNewClaimDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Claim
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Insurance Claim</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payer *</Label>
                      <Select 
                        value={claimForm.payerId}
                        onValueChange={(v) => setClaimForm(p => ({ ...p, payerId: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payer" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYERS.map((payer) => (
                            <SelectItem key={payer.id} value={payer.id}>
                              {payer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Member ID</Label>
                      <Input
                        value={claimForm.memberId}
                        onChange={(e) => setClaimForm(p => ({ ...p, memberId: e.target.value }))}
                        placeholder="Policy/Member number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Group Number</Label>
                      <Input
                        value={claimForm.groupNumber}
                        onChange={(e) => setClaimForm(p => ({ ...p, groupNumber: e.target.value }))}
                        placeholder="Employer group"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Authorization Number</Label>
                      <Input
                        value={claimForm.authNumber}
                        onChange={(e) => setClaimForm(p => ({ ...p, authNumber: e.target.value }))}
                        placeholder="Pre-auth reference"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Charges to Claim</Label>
                    <ScrollArea className="h-48 border rounded-lg p-2">
                      {eligibleCharges.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground">No eligible charges</p>
                      ) : (
                        <div className="space-y-2">
                          {eligibleCharges.map((charge) => (
                            <div
                              key={charge.id}
                              className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                                selectedCharges.includes(charge.id) ? "bg-primary/10 border-primary" : "hover:bg-muted"
                              }`}
                              onClick={() => {
                                if (selectedCharges.includes(charge.id)) {
                                  setSelectedCharges(selectedCharges.filter(id => id !== charge.id));
                                } else {
                                  setSelectedCharges([...selectedCharges, charge.id]);
                                }
                              }}
                            >
                              <div>
                                <p className="font-medium">{charge.service_name}</p>
                                <p className="text-sm text-muted-foreground">{charge.service_code}</p>
                              </div>
                              <p className="font-bold">${charge.net_amount.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    {selectedCharges.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {selectedCharges.length} charges selected • Total: $
                        {chargeSheets
                          .filter(c => selectedCharges.includes(c.id))
                          .reduce((sum, c) => sum + c.net_amount, 0)
                          .toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={claimForm.notes}
                      onChange={(e) => setClaimForm(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Additional claim notes..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewClaimDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateClaim} disabled={!claimForm.payerId || selectedCharges.length === 0}>
                      Create Claim
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Claims Tab */}
        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search claims..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredClaims.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No claims found</p>
                    </div>
                  ) : (
                    filteredClaims.map((claim) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{claim.claim_number}</p>
                              {getStatusBadge(claim.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {claim.payer_name} • {claim.member_id || "No member ID"}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(claim.created_at || ""), "dd MMM yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-lg font-bold">${claim.total_claimed.toFixed(2)}</p>
                            {claim.total_approved !== null && claim.total_approved > 0 && (
                              <p className="text-sm text-success">
                                Approved: ${claim.total_approved.toFixed(2)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {claim.status === "draft" && (
                              <Button size="sm" onClick={() => handleSubmitClaim(claim.id)}>
                                <Send className="h-4 w-4 mr-1" />
                                Submit
                              </Button>
                            )}
                            {claim.status === "denied" && (
                              <Button variant="outline" size="sm">
                                <Gavel className="h-4 w-4 mr-1" />
                                Appeal
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Remittances Tab */}
        <TabsContent value="remittances">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Remittance Advices</CardTitle>
              <CardDescription>Electronic Remittance Advice (ERA) and payment postings</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {remittances.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No remittance advices found</p>
                    </div>
                  ) : (
                    remittances.map((remittance) => (
                      <div
                        key={remittance.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <p className="font-medium">{remittance.remittance_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {remittance.payer_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-bold text-success">${remittance.payment_amount.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(remittance.payment_date), "dd MMM yyyy")}
                            </p>
                          </div>
                          {remittance.is_processed ? (
                            <Badge className="bg-success text-success-foreground">Processed</Badge>
                          ) : (
                            <Badge className="bg-warning text-warning-foreground">Pending</Badge>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}