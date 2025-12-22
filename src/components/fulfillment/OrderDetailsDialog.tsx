import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import OrderTrackingTimeline from "./OrderTrackingTimeline";
import OrderStatusActions from "./OrderStatusActions";
import {
  Package,
  User,
  Truck,
  MapPin,
  Clock,
  DollarSign,
  Store,
  FileText,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | null;
  isVendor?: boolean;
}

interface RequestDetails {
  id: string;
  request_number: string;
  request_type: string;
  priority: string;
  status: string;
  delivery_required: boolean;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_province: string | null;
  total_amount: number | null;
  bidding_deadline: string | null;
  created_at: string;
  notes: string | null;
  patient: { first_name: string; last_name: string; mrn: string } | null;
  awarded_vendor: { name: string; city: string | null } | null;
  items: { id: string; product_name: string; quantity: number; unit_of_measure: string }[];
}

const statusColors: Record<string, string> = {
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

export default function OrderDetailsDialog({
  open,
  onOpenChange,
  requestId,
  isVendor = false,
}: OrderDetailsDialogProps) {
  const queryClient = useQueryClient();

  const { data: request, isLoading } = useQuery({
    queryKey: ["fulfillment-request-details", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      
      const { data, error } = await supabase
        .from("fulfillment_requests")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn),
          awarded_vendor:vendors!fulfillment_requests_awarded_vendor_id_fkey(name, city)
        `)
        .eq("id", requestId)
        .single();
      
      if (error) throw error;

      // Fetch items
      const { data: items } = await supabase
        .from("fulfillment_request_items")
        .select("id, product_name, quantity, unit_of_measure")
        .eq("request_id", requestId);

      return { ...data, items: items || [] } as RequestDetails;
    },
    enabled: !!requestId && open,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(price);
  };

  const handleStatusChange = () => {
    queryClient.invalidateQueries({ queryKey: ["fulfillment-request-details", requestId] });
    queryClient.invalidateQueries({ queryKey: ["fulfillment-tracking", requestId] });
    queryClient.invalidateQueries({ queryKey: ["fulfillment-requests"] });
    queryClient.invalidateQueries({ queryKey: ["vendor-open-requests"] });
    queryClient.invalidateQueries({ queryKey: ["my-vendor-bids"] });
  };

  if (!requestId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details
          </DialogTitle>
          <DialogDescription>
            {request?.request_number || "Loading..."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-20 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
              <div className="h-48 bg-muted rounded" />
            </div>
          ) : request ? (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${statusColors[request.status]} text-white capitalize`}>
                      {request.status.replace("_", " ")}
                    </Badge>
                    <Badge className={`${priorityColors[request.priority]} text-white capitalize`}>
                      {request.priority}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {request.request_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                  </p>
                </div>
                {request.total_amount && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(request.total_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Patient & Vendor Info */}
              <div className="grid grid-cols-2 gap-4">
                {/* Patient */}
                {request.patient && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Patient</span>
                    </div>
                    <p className="font-medium">
                      {request.patient.first_name} {request.patient.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{request.patient.mrn}</p>
                  </div>
                )}

                {/* Vendor */}
                {request.awarded_vendor && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Vendor</span>
                    </div>
                    <p className="font-medium">{request.awarded_vendor.name}</p>
                    {request.awarded_vendor.city && (
                      <p className="text-sm text-muted-foreground">{request.awarded_vendor.city}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery Info */}
              {request.delivery_required && (
                <div className="bg-orange-500/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Delivery Required</span>
                  </div>
                  {request.delivery_address && (
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {request.delivery_address}
                      {request.delivery_city && `, ${request.delivery_city}`}
                      {request.delivery_province && `, ${request.delivery_province}`}
                    </p>
                  )}
                </div>
              )}

              {/* Items */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Items ({request.items.length})
                </h4>
                <div className="bg-muted/50 rounded-lg divide-y divide-border">
                  {request.items.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                      <span className="font-medium">{item.product_name}</span>
                      <span className="text-muted-foreground">
                        {item.quantity} {item.unit_of_measure}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {request.notes && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">{request.notes}</p>
                </div>
              )}

              <Separator />

              {/* Status Actions */}
              <OrderStatusActions
                requestId={request.id}
                currentStatus={request.status}
                isVendor={isVendor}
                onStatusChange={handleStatusChange}
              />

              {/* Timeline */}
              <OrderTrackingTimeline
                requestId={request.id}
                currentStatus={request.status}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Order not found
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
