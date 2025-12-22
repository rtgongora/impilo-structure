import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  RefreshCw,
  ChevronRight,
  Building2,
  Calendar,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Claim {
  id: string;
  claim_number: string;
  patient_id: string;
  encounter_id: string | null;
  insurance_provider: string;
  policy_number: string | null;
  total_amount: number;
  approved_amount: number | null;
  status: string;
  submitted_at: string | null;
  response_at: string | null;
  denial_reason: string | null;
  notes: string | null;
  created_at: string;
}

export function InsuranceClaims() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewClaimDialog, setShowNewClaimDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['insurance-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insurance_claims')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Claim[];
    }
  });

  const submitClaimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const { error } = await supabase
        .from('insurance_claims')
        .update({ 
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', claimId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims'] });
      toast.success('Claim submitted successfully');
    }
  });

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.insurance_provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-success text-success-foreground";
      case "denied": return "bg-destructive text-destructive-foreground";
      case "pending": 
      case "submitted": return "bg-warning text-warning-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return CheckCircle2;
      case "denied": return XCircle;
      case "pending": return Clock;
      case "submitted": return Send;
      default: return FileText;
    }
  };

  const stats = {
    total: claims.length,
    pending: claims.filter(c => c.status === 'pending' || c.status === 'submitted').length,
    approved: claims.filter(c => c.status === 'approved').length,
    denied: claims.filter(c => c.status === 'denied').length,
    totalAmount: claims.reduce((sum, c) => sum + c.total_amount, 0),
    approvedAmount: claims.reduce((sum, c) => sum + (c.approved_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
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
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved Amount</p>
                <p className="text-2xl font-bold">${stats.approvedAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search claims..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowNewClaimDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Claim
        </Button>
      </div>

      {/* Claims List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Claims</CardTitle>
          <CardDescription>{filteredClaims.length} claims found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No claims found</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredClaims.map(claim => {
                  const StatusIcon = getStatusIcon(claim.status);
                  return (
                    <div
                      key={claim.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{claim.claim_number}</p>
                            <Badge className={getStatusColor(claim.status)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {claim.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {claim.insurance_provider} • {claim.policy_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {format(new Date(claim.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">${claim.total_amount.toLocaleString()}</p>
                          {claim.approved_amount && (
                            <p className="text-sm text-success">
                              Approved: ${claim.approved_amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                        {claim.status === 'draft' && (
                          <Button 
                            size="sm"
                            onClick={() => submitClaimMutation.mutate(claim.id)}
                            disabled={submitClaimMutation.isPending}
                          >
                            Submit
                          </Button>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* New Claim Dialog */}
      <Dialog open={showNewClaimDialog} onOpenChange={setShowNewClaimDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Claim</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Insurance Provider</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="psmas">PSMAS</SelectItem>
                    <SelectItem value="cimas">CIMAS</SelectItem>
                    <SelectItem value="fimas">FIMAS</SelectItem>
                    <SelectItem value="premier">Premier Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Policy Number</Label>
                <Input placeholder="Enter policy number" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Claim Amount</Label>
              <Input type="number" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes about the claim..." />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewClaimDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Claim
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
