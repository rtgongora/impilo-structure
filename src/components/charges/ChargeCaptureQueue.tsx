import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Check,
  X,
  Clock,
  FileCheck,
  Search,
  Receipt,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useChargeCaptureQueue } from "@/hooks/useChargeCapture";
import { format } from "date-fns";

export function ChargeCaptureQueue() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCharge, setSelectedCharge] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { charges, pendingCharges, approvedCharges, isLoading, reviewCharge, billCharge } = useChargeCaptureQueue(
    activeTab === "all" ? undefined : activeTab
  );

  const filteredCharges = charges.filter(c => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return c.service_name.toLowerCase().includes(search) ||
           c.service_code.toLowerCase().includes(search) ||
           (c.patients?.first_name + ' ' + c.patients?.last_name).toLowerCase().includes(search);
  });

  const handleApprove = (id: string) => {
    reviewCharge.mutate({
      id,
      status: 'approved',
      reviewedBy: 'Current User',
    });
  };

  const handleReject = () => {
    if (!selectedCharge || !rejectReason) return;
    reviewCharge.mutate({
      id: selectedCharge,
      status: 'rejected',
      reviewedBy: 'Current User',
      rejectionReason: rejectReason,
    });
    setSelectedCharge(null);
    setRejectReason("");
  };

  const handleBill = (id: string) => {
    billCharge.mutate(id);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'consumable': return '💊';
      case 'procedure': return '🔧';
      case 'lab': return '🧪';
      case 'imaging': return '📷';
      case 'pharmacy': return '💉';
      default: return '📋';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'reviewed': return <Badge variant="outline"><FileCheck className="h-3 w-3 mr-1" />Reviewed</Badge>;
      case 'approved': return <Badge variant="default" className="bg-green-600"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected': return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'billed': return <Badge variant="outline" className="border-blue-500 text-blue-600"><Receipt className="h-3 w-3 mr-1" />Billed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Charge Capture Queue
            </CardTitle>
            <CardDescription>Review and bill pending charges</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{pendingCharges.length} Pending</Badge>
            <Badge variant="outline" className="border-green-500 text-green-600">
              {approvedCharges.length} Ready to Bill
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search charges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4">
            <TabsList className="w-full">
              <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
              <TabsTrigger value="approved" className="flex-1">Approved</TabsTrigger>
              <TabsTrigger value="billed" className="flex-1">Billed</TabsTrigger>
              <TabsTrigger value="rejected" className="flex-1">Rejected</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredCharges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No charges in this status
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCharges.map((charge) => (
                      <TableRow key={charge.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{getSourceIcon(charge.source_type)}</span>
                            <div>
                              <p className="font-medium">{charge.service_name}</p>
                              <p className="text-xs text-muted-foreground">{charge.service_code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {charge.patients ? (
                            <div>
                              <p className="font-medium">
                                {charge.patients.first_name} {charge.patients.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">{charge.patients.mrn}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{charge.quantity}</TableCell>
                        <TableCell className="text-right">
                          <div>
                            <p className="font-medium">
                              ${(charge.calculated_price || (charge.unit_price * charge.quantity)).toFixed(2)}
                            </p>
                            {charge.calculated_price && charge.calculated_price !== charge.unit_price * charge.quantity && (
                              <p className="text-xs text-muted-foreground line-through">
                                ${(charge.unit_price * charge.quantity).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(charge.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {charge.status === 'pending' && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleApprove(charge.id)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => setSelectedCharge(charge.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {charge.status === 'approved' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleBill(charge.id)}
                                disabled={billCharge.isPending}
                              >
                                Bill
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Reject Dialog */}
      <Dialog open={!!selectedCharge} onOpenChange={() => setSelectedCharge(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Reject Charge
            </DialogTitle>
            <DialogDescription>Provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedCharge(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={!rejectReason || reviewCharge.isPending}
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
