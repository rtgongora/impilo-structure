import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Package,
  Store,
  Clock,
  CheckCircle,
  Send,
  Truck,
  MapPin,
  Timer,
  DollarSign,
  FileText,
  ChevronRight,
  Gavel,
  Award,
  AlertCircle,
  Loader2,
  Building2,
  ShoppingCart,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface FulfillmentRequest {
  id: string;
  request_number: string;
  request_type: string;
  priority: string;
  status: string;
  delivery_required: boolean;
  delivery_city: string | null;
  bidding_deadline: string | null;
  created_at: string;
  patient?: { first_name: string; last_name: string } | null;
  items?: FulfillmentItem[];
}

interface FulfillmentItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_of_measure: string;
}

interface Vendor {
  id: string;
  name: string;
  vendor_type: string;
  city: string | null;
  delivery_available: boolean;
}

interface MyBid {
  id: string;
  request_id: string;
  status: string;
  total_amount: number;
  discount_percent: number;
  submitted_at: string;
  request?: {
    request_number: string;
    status: string;
    priority: string;
    patient?: { first_name: string; last_name: string } | null;
  };
}

const priorityColors: Record<string, string> = {
  stat: "bg-red-600",
  urgent: "bg-orange-500",
  routine: "bg-gray-500",
};

export default function VendorPortal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("open");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<FulfillmentRequest | null>(null);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  
  // Bid form state
  const [bidForm, setBidForm] = useState({
    canFulfillAll: true,
    totalAmount: "",
    discountPercent: "0",
    estimatedReadyMinutes: "60",
    deliveryAvailable: false,
    deliveryFee: "0",
    notes: "",
  });

  // Fetch vendors (for demo - in production, vendor would be linked to user)
  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors-for-portal"],
    queryFn: async () => {
      // Use any cast to avoid deep type inference issue with vendors table
      const result = await (supabase as any)
        .from("vendors")
        .select("id, name, vendor_type, city, delivery_available")
        .eq("is_active", true)
        .order("name");
      if (result.error) throw result.error;
      return result.data as Vendor[];
    },
  });

  // Fetch open fulfillment requests (bidding status)
  const { data: openRequests = [], isLoading: loadingOpen } = useQuery({
    queryKey: ["vendor-open-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fulfillment_requests")
        .select(`
          id,
          request_number,
          request_type,
          priority,
          status,
          delivery_required,
          delivery_city,
          bidding_deadline,
          created_at,
          patient:patients(first_name, last_name)
        `)
        .eq("status", "bidding")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FulfillmentRequest[];
    },
  });

  // Fetch request items when selected
  const { data: requestItems = [] } = useQuery({
    queryKey: ["request-items", selectedRequest?.id],
    queryFn: async () => {
      if (!selectedRequest) return [];
      const { data, error } = await supabase
        .from("fulfillment_request_items")
        .select("id, product_name, quantity, unit_of_measure")
        .eq("request_id", selectedRequest.id);
      if (error) throw error;
      return data as FulfillmentItem[];
    },
    enabled: !!selectedRequest,
  });

  // Fetch my bids (for selected vendor)
  const { data: myBids = [], isLoading: loadingBids } = useQuery({
    queryKey: ["my-vendor-bids", selectedVendorId],
    queryFn: async () => {
      if (!selectedVendorId) return [];
      const { data, error } = await supabase
        .from("vendor_bids")
        .select(`
          id,
          request_id,
          status,
          total_amount,
          discount_percent,
          submitted_at,
          request:fulfillment_requests(
            request_number,
            status,
            priority,
            patient:patients(first_name, last_name)
          )
        `)
        .eq("vendor_id", selectedVendorId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as MyBid[];
    },
    enabled: !!selectedVendorId,
  });

  // Submit bid mutation
  const submitBidMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRequest || !selectedVendorId) throw new Error("Missing data");
      
      // Calculate unit prices based on total
      const unitPrices: Record<string, number> = {};
      const totalQty = requestItems.reduce((sum, item) => sum + item.quantity, 0);
      const pricePerUnit = parseFloat(bidForm.totalAmount) / totalQty;
      requestItems.forEach((item) => {
        unitPrices[item.id] = Math.round(pricePerUnit * 100) / 100;
      });

      const estimatedReady = new Date(Date.now() + parseInt(bidForm.estimatedReadyMinutes) * 60000);

      const { error } = await supabase.from("vendor_bids").insert({
        request_id: selectedRequest.id,
        vendor_id: selectedVendorId,
        status: "submitted",
        can_fulfill_all: bidForm.canFulfillAll,
        unit_prices: unitPrices,
        total_amount: parseFloat(bidForm.totalAmount),
        discount_percent: parseFloat(bidForm.discountPercent),
        estimated_ready_time: estimatedReady.toISOString(),
        delivery_available: bidForm.deliveryAvailable,
        delivery_fee: parseFloat(bidForm.deliveryFee),
        notes: bidForm.notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-vendor-bids"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-open-requests"] });
      setBidDialogOpen(false);
      setSelectedRequest(null);
      resetBidForm();
      toast({ title: "Bid submitted successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error submitting bid", description: error.message, variant: "destructive" });
    },
  });

  const resetBidForm = () => {
    setBidForm({
      canFulfillAll: true,
      totalAmount: "",
      discountPercent: "0",
      estimatedReadyMinutes: "60",
      deliveryAvailable: false,
      deliveryFee: "0",
      notes: "",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(price);
  };

  const filteredRequests = openRequests.filter((req) => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return (
      req.request_number.toLowerCase().includes(lowerSearch) ||
      req.patient?.first_name?.toLowerCase().includes(lowerSearch) ||
      req.patient?.last_name?.toLowerCase().includes(lowerSearch)
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
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Vendor Portal</h1>
                  <p className="text-xs text-muted-foreground">View requests & submit bids</p>
                </div>
              </div>
            </div>
            
            {/* Vendor Selector */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground hidden sm:block">Acting as:</Label>
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        {vendor.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!selectedVendorId ? (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Vendor</h3>
            <p className="text-muted-foreground mb-4">
              Choose which pharmacy/vendor you're representing to view requests and submit bids.
            </p>
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger className="w-[300px] mx-auto">
                <SelectValue placeholder="Select vendor..." />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name} - {vendor.vendor_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <Gavel className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{openRequests.length}</p>
                      <p className="text-xs text-muted-foreground">Open Requests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Send className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {myBids.filter((b) => b.status === "submitted").length}
                      </p>
                      <p className="text-xs text-muted-foreground">Pending Bids</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Award className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {myBids.filter((b) => b.status === "accepted").length}
                      </p>
                      <p className="text-xs text-muted-foreground">Won</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <DollarSign className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {formatPrice(
                          myBids
                            .filter((b) => b.status === "accepted")
                            .reduce((sum, b) => sum + b.total_amount, 0)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Won</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="open">
                  Open Requests
                  {openRequests.length > 0 && (
                    <Badge className="ml-2 bg-yellow-500">{openRequests.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="mybids">My Bids</TabsTrigger>
              </TabsList>

              {/* Open Requests Tab */}
              <TabsContent value="open">
                {loadingOpen ? (
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
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No open requests</h3>
                    <p className="text-muted-foreground">
                      There are no fulfillment requests currently accepting bids.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map((request) => (
                      <Card
                        key={request.id}
                        className="hover:shadow-lg hover:border-primary/50 transition-all"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono font-medium">{request.request_number}</span>
                                <Badge className={`${priorityColors[request.priority]} text-white capitalize`}>
                                  {request.priority}
                                </Badge>
                                <Badge variant="secondary" className="capitalize">
                                  {request.request_type}
                                </Badge>
                                {request.delivery_required && (
                                  <Badge variant="outline">
                                    <Truck className="h-3 w-3 mr-1" />
                                    Delivery to {request.delivery_city}
                                  </Badge>
                                )}
                              </div>

                              {request.patient && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  Patient: {request.patient.first_name} {request.patient.last_name}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Posted {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                                </span>
                                {request.bidding_deadline && (
                                  <span className="flex items-center gap-1 text-orange-600 font-medium">
                                    <Timer className="h-3 w-3" />
                                    Closes {formatDistanceToNow(new Date(request.bidding_deadline), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                            </div>

                            <Button
                              onClick={() => {
                                setSelectedRequest(request);
                                setBidDialogOpen(true);
                              }}
                            >
                              <Gavel className="h-4 w-4 mr-2" />
                              Place Bid
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* My Bids Tab */}
              <TabsContent value="mybids">
                {loadingBids ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="h-16 bg-muted rounded" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : myBids.length === 0 ? (
                  <Card className="p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No bids yet</h3>
                    <p className="text-muted-foreground">
                      You haven't submitted any bids. Check the Open Requests tab to start bidding.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {myBids.map((bid) => (
                      <Card
                        key={bid.id}
                        className={`transition-all ${
                          bid.status === "accepted" ? "border-green-500/50" : ""
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono font-medium">
                                  {bid.request?.request_number}
                                </span>
                                <Badge
                                  className={
                                    bid.status === "accepted"
                                      ? "bg-green-500 text-white"
                                      : bid.status === "rejected"
                                      ? "bg-red-500 text-white"
                                      : "bg-blue-500 text-white"
                                  }
                                >
                                  {bid.status === "accepted"
                                    ? "Won"
                                    : bid.status === "rejected"
                                    ? "Not Selected"
                                    : "Pending"}
                                </Badge>
                                {bid.request?.priority && (
                                  <Badge className={`${priorityColors[bid.request.priority]} text-white capitalize`}>
                                    {bid.request.priority}
                                  </Badge>
                                )}
                              </div>

                              {bid.request?.patient && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  Patient: {bid.request.patient.first_name} {bid.request.patient.last_name}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-lg font-bold text-primary">
                                  {formatPrice(bid.total_amount)}
                                </span>
                                {bid.discount_percent > 0 && (
                                  <Badge variant="outline" className="text-green-600">
                                    {bid.discount_percent}% discount
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  Submitted {formatDistanceToNow(new Date(bid.submitted_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>

                            {bid.status === "accepted" && (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">Won!</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Bid Dialog */}
        <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit Bid</DialogTitle>
              <DialogDescription>
                Place your bid for {selectedRequest?.request_number}
              </DialogDescription>
            </DialogHeader>

            {/* Request Items */}
            {requestItems.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Items Requested</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  {requestItems.map((item) => (
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

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="canFulfillAll"
                  checked={bidForm.canFulfillAll}
                  onCheckedChange={(checked) =>
                    setBidForm({ ...bidForm, canFulfillAll: checked as boolean })
                  }
                />
                <Label htmlFor="canFulfillAll">Can fulfill all items</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount (ZAR) *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={bidForm.totalAmount}
                    onChange={(e) => setBidForm({ ...bidForm, totalAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPercent">Discount %</Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    step="0.5"
                    placeholder="0"
                    value={bidForm.discountPercent}
                    onChange={(e) => setBidForm({ ...bidForm, discountPercent: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedReady">Ready in (minutes)</Label>
                <Select
                  value={bidForm.estimatedReadyMinutes}
                  onValueChange={(v) => setBidForm({ ...bidForm, estimatedReadyMinutes: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="480">Same day</SelectItem>
                    <SelectItem value="1440">Next day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="deliveryAvailable"
                  checked={bidForm.deliveryAvailable}
                  onCheckedChange={(checked) =>
                    setBidForm({ ...bidForm, deliveryAvailable: checked as boolean })
                  }
                />
                <Label htmlFor="deliveryAvailable">Delivery available</Label>
              </div>

              {bidForm.deliveryAvailable && (
                <div className="space-y-2">
                  <Label htmlFor="deliveryFee">Delivery Fee (ZAR)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={bidForm.deliveryFee}
                    onChange={(e) => setBidForm({ ...bidForm, deliveryFee: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information..."
                  value={bidForm.notes}
                  onChange={(e) => setBidForm({ ...bidForm, notes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBidDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => submitBidMutation.mutate()}
                disabled={!bidForm.totalAmount || submitBidMutation.isPending}
              >
                {submitBidMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Bid
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
