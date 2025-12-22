import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFulfillmentActions } from "@/hooks/useFulfillmentActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Package,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Truck,
  MapPin,
  Star,
  AlertCircle,
  Timer,
  DollarSign,
  FileText,
  ChevronRight,
  Gavel,
  Award,
  Plus,
  Sparkles,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow, addHours } from "date-fns";

type FulfillmentStatus = "draft" | "submitted" | "bidding" | "awarded" | "confirmed" | "processing" | "ready" | "dispatched" | "delivered" | "completed" | "cancelled" | "expired";

interface FulfillmentRequest {
  id: string;
  request_number: string;
  request_type: string;
  patient_id: string | null;
  status: FulfillmentStatus;
  priority: string;
  delivery_required: boolean;
  delivery_city: string | null;
  bidding_deadline: string | null;
  awarded_vendor_id: string | null;
  total_amount: number | null;
  created_at: string;
  patient?: { first_name: string; last_name: string; mrn: string } | null;
  awarded_vendor?: { name: string } | null;
  items?: FulfillmentItem[];
  bids?: VendorBid[];
}

interface FulfillmentItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_of_measure: string;
  product?: { name: string; requires_prescription: boolean } | null;
}

interface VendorBid {
  id: string;
  vendor_id: string;
  status: string;
  can_fulfill_all: boolean;
  total_amount: number;
  discount_percent: number;
  estimated_ready_time: string | null;
  delivery_available: boolean;
  delivery_fee: number;
  submitted_at: string;
  vendor?: { 
    name: string; 
    vendor_type: string; 
    city: string | null; 
    rating: number;
    delivery_available: boolean;
  } | null;
}

const statusColors: Record<FulfillmentStatus, string> = {
  draft: "bg-gray-500",
  submitted: "bg-blue-500",
  bidding: "bg-yellow-500",
  awarded: "bg-purple-500",
  confirmed: "bg-indigo-500",
  processing: "bg-cyan-500",
  ready: "bg-green-500",
  dispatched: "bg-orange-500",
  delivered: "bg-teal-500",
  completed: "bg-emerald-600",
  cancelled: "bg-red-500",
  expired: "bg-gray-600",
};

const priorityColors: Record<string, string> = {
  stat: "bg-red-600",
  urgent: "bg-orange-500",
  routine: "bg-gray-500",
};

export default function PrescriptionFulfillment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<FulfillmentRequest | null>(null);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string>("");
  
  // Fulfillment actions hook
  const { 
    convertPrescriptionToFulfillment, 
    submitForBidding, 
    generateDemoBids, 
    converting, 
    generatingBids 
  } = useFulfillmentActions();

  // Fetch fulfillment requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["fulfillment-requests", activeTab],
    queryFn: async () => {
      let query = supabase
        .from("fulfillment_requests")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn),
          awarded_vendor:vendors!fulfillment_requests_awarded_vendor_id_fkey(name)
        `)
        .order("created_at", { ascending: false });

      if (activeTab === "active") {
        query = query.in("status", ["draft", "submitted", "bidding", "awarded", "confirmed", "processing", "ready"]);
      } else if (activeTab === "completed") {
        query = query.in("status", ["delivered", "completed"]);
      } else if (activeTab === "cancelled") {
        query = query.in("status", ["cancelled", "expired"]);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as FulfillmentRequest[];
    },
  });

  // Fetch active prescriptions for conversion dialog
  const { data: prescriptions = [] } = useQuery({
    queryKey: ["active-prescriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          id,
          prescription_number,
          patient_id,
          encounter_id,
          patient:patients(first_name, last_name, mrn)
        `)
        .in("status", ["active", "pending"])
        .order("prescribed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as {
        id: string;
        prescription_number: string;
        patient_id: string;
        encounter_id: string | null;
        patient: { first_name: string; last_name: string; mrn: string } | null;
      }[];
    },
  });

  // Fetch bids for selected request
  const { data: bids = [] } = useQuery({
    queryKey: ["vendor-bids", selectedRequest?.id],
    queryFn: async () => {
      if (!selectedRequest) return [];
      const { data, error } = await supabase
        .from("vendor_bids")
        .select(`
          *,
          vendor:vendors(name, vendor_type, city, rating, delivery_available)
        `)
        .eq("request_id", selectedRequest.id)
        .order("total_amount", { ascending: true });
      if (error) throw error;
      return data as VendorBid[];
    },
    enabled: !!selectedRequest,
  });

  // Fetch items for selected request
  const { data: items = [] } = useQuery({
    queryKey: ["fulfillment-items", selectedRequest?.id],
    queryFn: async () => {
      if (!selectedRequest) return [];
      const { data, error } = await supabase
        .from("fulfillment_request_items")
        .select(`
          *,
          product:products(name, requires_prescription)
        `)
        .eq("request_id", selectedRequest.id);
      if (error) throw error;
      return data as FulfillmentItem[];
    },
    enabled: !!selectedRequest,
  });

  // Submit for bidding mutation
  const submitForBiddingMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const biddingDeadline = addHours(new Date(), 2); // 2 hour bidding window
      const { error } = await supabase
        .from("fulfillment_requests")
        .update({ 
          status: "bidding" as FulfillmentStatus,
          bidding_deadline: biddingDeadline.toISOString()
        })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-requests"] });
      toast({ title: "Request submitted for bidding" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Award bid mutation
  const awardBidMutation = useMutation({
    mutationFn: async ({ requestId, bidId, vendorId, amount }: { requestId: string; bidId: string; vendorId: string; amount: number }) => {
      // Update bid status
      await supabase
        .from("vendor_bids")
        .update({ status: "accepted" })
        .eq("id", bidId);
      
      // Update request
      const { error } = await supabase
        .from("fulfillment_requests")
        .update({ 
          status: "awarded" as FulfillmentStatus,
          awarded_vendor_id: vendorId,
          awarded_at: new Date().toISOString(),
          total_amount: amount
        })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-bids"] });
      setBidDialogOpen(false);
      setSelectedRequest(null);
      toast({ title: "Bid awarded successfully" });
    },
    onError: (error) => {
      toast({ title: "Error awarding bid", description: error.message, variant: "destructive" });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(price);
  };

  const filteredRequests = requests.filter((req) => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return (
      req.request_number.toLowerCase().includes(lowerSearch) ||
      req.patient?.first_name?.toLowerCase().includes(lowerSearch) ||
      req.patient?.last_name?.toLowerCase().includes(lowerSearch) ||
      req.patient?.mrn?.toLowerCase().includes(lowerSearch)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Prescription Fulfillment</h1>
                <p className="text-xs text-muted-foreground">Manage e-prescription bidding & fulfillment</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setConvertDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Gavel className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {requests.filter((r) => r.status === "bidding").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Active Bidding</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Award className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {requests.filter((r) => r.status === "awarded").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Awaiting Confirmation</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <Package className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {requests.filter((r) => ["processing", "ready"].includes(r.status)).length}
                  </p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {requests.filter((r) => r.status === "completed").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by request number, patient name or MRN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active Requests</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled/Expired</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-16 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No requests found</h3>
                <p className="text-muted-foreground">
                  {activeTab === "active" 
                    ? "No active fulfillment requests" 
                    : `No ${activeTab} requests`}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <Card
                    key={request.id}
                    className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
                    onClick={() => {
                      setSelectedRequest(request);
                      if (request.status === "bidding") {
                        setBidDialogOpen(true);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono font-medium">{request.request_number}</span>
                            <Badge className={`${statusColors[request.status]} text-white capitalize`}>
                              {request.status.replace("_", " ")}
                            </Badge>
                            <Badge className={`${priorityColors[request.priority]} text-white capitalize`}>
                              {request.priority}
                            </Badge>
                            {request.delivery_required && (
                              <Badge variant="outline" className="text-xs">
                                <Truck className="h-3 w-3 mr-1" />
                                Delivery
                              </Badge>
                            )}
                          </div>
                          
                          {request.patient && (
                            <p className="text-sm mb-1">
                              <span className="text-muted-foreground">Patient:</span>{" "}
                              {request.patient.first_name} {request.patient.last_name} ({request.patient.mrn})
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </span>
                            {request.bidding_deadline && request.status === "bidding" && (
                              <span className="flex items-center gap-1 text-yellow-600">
                                <Timer className="h-3 w-3" />
                                Bidding ends {formatDistanceToNow(new Date(request.bidding_deadline), { addSuffix: true })}
                              </span>
                            )}
                            {request.awarded_vendor && (
                              <span className="flex items-center gap-1 text-green-600">
                                <Store className="h-3 w-3" />
                                {request.awarded_vendor.name}
                              </span>
                            )}
                            {request.total_amount && (
                              <span className="flex items-center gap-1 font-medium text-primary">
                                <DollarSign className="h-3 w-3" />
                                {formatPrice(request.total_amount)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {request.status === "draft" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={generatingBids}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const success = await generateDemoBids(request.id);
                                  if (success) {
                                    queryClient.invalidateQueries({ queryKey: ["fulfillment-requests"] });
                                  }
                                }}
                              >
                                {generatingBids ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Sparkles className="h-4 w-4 mr-2" />
                                )}
                                Generate Bids
                              </Button>
                              <Button
                                size="sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const success = await submitForBidding(request.id);
                                  if (success) {
                                    queryClient.invalidateQueries({ queryKey: ["fulfillment-requests"] });
                                  }
                                }}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Open Bidding
                              </Button>
                            </>
                          )}
                          {request.status === "bidding" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={generatingBids}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const success = await generateDemoBids(request.id);
                                  if (success) {
                                    queryClient.invalidateQueries({ queryKey: ["vendor-bids", request.id] });
                                  }
                                }}
                              >
                                {generatingBids ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Sparkles className="h-4 w-4 mr-2" />
                                )}
                                Add Demo Bids
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRequest(request);
                                  setBidDialogOpen(true);
                                }}
                              >
                                <Gavel className="h-4 w-4 mr-2" />
                                View Bids
                              </Button>
                            </>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Bid Selection Dialog */}
        <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Vendor</DialogTitle>
              <DialogDescription>
                Compare bids from vendors and select the best option for {selectedRequest?.request_number}
              </DialogDescription>
            </DialogHeader>

            {/* Request Items */}
            {items.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Items Requested</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>{item.product_name}</span>
                      <span className="text-muted-foreground">
                        {item.quantity} {item.unit_of_measure}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Vendor Bids */}
            <ScrollArea className="max-h-[400px]">
              {bids.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No bids received yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bids.map((bid, index) => (
                    <Card
                      key={bid.id}
                      className={`transition-all ${bid.status === "accepted" ? "border-green-500" : "hover:border-primary/50"}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {index === 0 && (
                                <Badge className="bg-green-500 text-white text-xs">Best Price</Badge>
                              )}
                              <span className="font-medium">{bid.vendor?.name}</span>
                              <Badge variant="secondary" className="capitalize text-xs">
                                {bid.vendor?.vendor_type}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm mb-2">
                              <span className="text-2xl font-bold text-primary">
                                {formatPrice(bid.total_amount)}
                              </span>
                              {bid.discount_percent > 0 && (
                                <Badge variant="outline" className="text-green-600">
                                  {bid.discount_percent}% off
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {bid.vendor?.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {bid.vendor.city}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {bid.vendor?.rating?.toFixed(1)}
                              </span>
                              {bid.delivery_available && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Truck className="h-3 w-3" />
                                  Delivery (+{formatPrice(bid.delivery_fee)})
                                </span>
                              )}
                              {bid.estimated_ready_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Ready {format(new Date(bid.estimated_ready_time), "HH:mm")}
                                </span>
                              )}
                            </div>

                            {!bid.can_fulfill_all && (
                              <Badge variant="outline" className="mt-2 text-orange-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Partial fulfillment only
                              </Badge>
                            )}
                          </div>

                          <Button
                            onClick={() => {
                              if (selectedRequest) {
                                awardBidMutation.mutate({
                                  requestId: selectedRequest.id,
                                  bidId: bid.id,
                                  vendorId: bid.vendor_id,
                                  amount: bid.total_amount,
                                });
                              }
                            }}
                            disabled={bid.status === "accepted" || awardBidMutation.isPending}
                          >
                            {bid.status === "accepted" ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Awarded
                              </>
                            ) : (
                              <>
                                <Award className="h-4 w-4 mr-2" />
                                Award
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBidDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Convert Prescription Dialog */}
        <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Convert Prescription to Fulfillment Request</DialogTitle>
              <DialogDescription>
                Select an active prescription to create a fulfillment request for vendor bidding.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Prescription</Label>
                <Select value={selectedPrescriptionId} onValueChange={setSelectedPrescriptionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a prescription..." />
                  </SelectTrigger>
                  <SelectContent>
                    {prescriptions.map((rx) => (
                      <SelectItem key={rx.id} value={rx.id}>
                        <div className="flex flex-col">
                          <span className="font-mono">{rx.prescription_number}</span>
                          {rx.patient && (
                            <span className="text-xs text-muted-foreground">
                              {rx.patient.first_name} {rx.patient.last_name} ({rx.patient.mrn})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {prescriptions.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p>No active prescriptions found.</p>
                  <p className="text-sm">Create a prescription in the Pharmacy module first.</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!selectedPrescriptionId || converting}
                onClick={async () => {
                  const prescription = prescriptions.find(p => p.id === selectedPrescriptionId);
                  if (!prescription) return;
                  
                  const result = await convertPrescriptionToFulfillment({
                    prescriptionId: prescription.id,
                    patientId: prescription.patient_id,
                    encounterId: prescription.encounter_id || undefined,
                    priority: "routine",
                  });
                  
                  if (result) {
                    setConvertDialogOpen(false);
                    setSelectedPrescriptionId("");
                    queryClient.invalidateQueries({ queryKey: ["fulfillment-requests"] });
                  }
                }}
              >
                {converting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
