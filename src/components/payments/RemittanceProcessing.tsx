import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useRemittanceAdvices } from "@/hooks/useClaimsData";
import { 
  DollarSign,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Upload,
  Eye,
  RefreshCw,
  Building2,
  Calendar,
  ArrowRight,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function RemittanceProcessing() {
  const { remittances, loading, stats, refetch } = useRemittanceAdvices();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedRemittance, setSelectedRemittance] = useState<string | null>(null);

  const getStatusBadge = (isProcessed: boolean) => {
    if (isProcessed) {
      return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />Processed</Badge>;
    }
    return <Badge className="bg-warning text-warning-foreground"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const filteredRemittances = remittances.filter(rem => {
    const matchesSearch = 
      rem.remittance_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rem.payer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "processed" && rem.is_processed) ||
      (statusFilter === "pending" && !rem.is_processed);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total ERAs</p>
                <p className="text-2xl font-bold">{remittances.length}</p>
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
                <p className="text-2xl font-bold">{stats.unprocessed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold">${stats.totalReceived.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold">
                  ${remittances.filter(r => !r.is_processed).reduce((sum, r) => sum + r.payment_amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search remittances..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Import ERA
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Remittance Advice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium">Drop ERA file here</p>
                  <p className="text-sm text-muted-foreground">
                    Supports 835, ERA PDF, or CSV formats
                  </p>
                  <Button variant="outline" className="mt-4">
                    Browse Files
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Or manually enter remittance details
                </p>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payer</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="psmas">PSMAS</SelectItem>
                        <SelectItem value="cimas">CIMAS</SelectItem>
                        <SelectItem value="premier">Premier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Check/EFT Number</Label>
                    <Input placeholder="Reference number" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Amount</Label>
                    <Input type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Date</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                    Cancel
                  </Button>
                  <Button>
                    Import
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Remittances List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Remittance Advices</CardTitle>
          <CardDescription>Electronic Remittance Advice (ERA) and Explanation of Benefits (EOB)</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredRemittances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No remittance advices found</p>
                </div>
              ) : (
                filteredRemittances.map((remittance) => (
                  <Card key={remittance.id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{remittance.remittance_number}</p>
                              {getStatusBadge(remittance.is_processed || false)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {remittance.payer_name}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Payment: {format(new Date(remittance.payment_date), "dd MMM yyyy")}
                              </span>
                              {remittance.check_number && (
                                <span>
                                  Check: {remittance.check_number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-success">
                              ${remittance.payment_amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                            {!remittance.is_processed && (
                              <Button size="sm">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Process
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Claim Summary Preview */}
                      {!remittance.is_processed && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Claims Summary</p>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div className="p-2 bg-muted rounded">
                              <p className="text-muted-foreground">Total Claimed</p>
                              <p className="font-bold">${(remittance.total_claimed || 0).toFixed(2)}</p>
                            </div>
                            <div className="p-2 bg-success/10 rounded">
                              <p className="text-muted-foreground">Approved</p>
                              <p className="font-bold text-success">${(remittance.total_approved || 0).toFixed(2)}</p>
                            </div>
                            <div className="p-2 bg-primary/10 rounded">
                              <p className="text-muted-foreground">Paid</p>
                              <p className="font-bold text-primary">${remittance.payment_amount.toFixed(2)}</p>
                            </div>
                            <div className="p-2 bg-warning/10 rounded">
                              <p className="text-muted-foreground">Adjustments</p>
                              <p className="font-bold text-warning">${(remittance.adjustments || 0).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}