import { useState } from "react";
import { useFulfillmentActions } from "@/hooks/useFulfillmentActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Package,
  Truck,
  Home,
  XCircle,
  Loader2,
  MapPin,
  Play,
  AlertTriangle,
} from "lucide-react";

interface OrderStatusActionsProps {
  requestId: string;
  currentStatus: string;
  isVendor?: boolean;
  onStatusChange?: () => void;
}

const statusFlow: Record<string, { next: string; label: string; icon: typeof CheckCircle }[]> = {
  awarded: [
    { next: "confirmed", label: "Confirm Order", icon: CheckCircle },
    { next: "cancelled", label: "Decline", icon: XCircle },
  ],
  confirmed: [
    { next: "processing", label: "Start Processing", icon: Play },
    { next: "cancelled", label: "Cancel", icon: XCircle },
  ],
  processing: [
    { next: "ready", label: "Mark Ready", icon: Package },
    { next: "cancelled", label: "Cancel", icon: XCircle },
  ],
  ready: [
    { next: "dispatched", label: "Dispatch for Delivery", icon: Truck },
    { next: "completed", label: "Mark Picked Up", icon: CheckCircle },
  ],
  dispatched: [
    { next: "delivered", label: "Mark Delivered", icon: Home },
  ],
  delivered: [
    { next: "completed", label: "Complete Order", icon: CheckCircle },
  ],
};

export default function OrderStatusActions({
  requestId,
  currentStatus,
  isVendor = false,
  onStatusChange,
}: OrderStatusActionsProps) {
  const {
    confirmOrder,
    startProcessing,
    markReady,
    dispatchOrder,
    markDelivered,
    completeOrder,
    cancelOrder,
  } = useFulfillmentActions();

  const [updating, setUpdating] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [dispatchNotes, setDispatchNotes] = useState("");

  const availableActions = statusFlow[currentStatus] || [];

  const handleAction = async (nextStatus: string) => {
    if (nextStatus === "cancelled") {
      setCancelDialogOpen(true);
      return;
    }

    setUpdating(true);
    let success = false;

    try {
      switch (nextStatus) {
        case "confirmed":
          success = await confirmOrder(requestId);
          break;
        case "processing":
          success = await startProcessing(requestId);
          break;
        case "ready":
          success = await markReady(requestId);
          break;
        case "dispatched":
          success = await dispatchOrder(requestId, dispatchNotes || undefined);
          break;
        case "delivered":
          success = await markDelivered(requestId, deliveryLocation || undefined);
          break;
        case "completed":
          success = await completeOrder(requestId);
          break;
      }

      if (success && onStatusChange) {
        onStatusChange();
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    setUpdating(true);
    try {
      const success = await cancelOrder(requestId, cancelReason || undefined);
      if (success) {
        setCancelDialogOpen(false);
        setCancelReason("");
        if (onStatusChange) onStatusChange();
      }
    } finally {
      setUpdating(false);
    }
  };

  if (availableActions.length === 0) {
    return null;
  }

  // Check if status allows actions (vendor vs staff)
  const canAct = isVendor || ["awarded", "confirmed", "processing", "ready", "dispatched", "delivered"].includes(currentStatus);

  if (!canAct) return null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Actions</CardTitle>
          <CardDescription>Update the order status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Special input for dispatch */}
          {currentStatus === "ready" && (
            <div className="space-y-2">
              <Label htmlFor="dispatchNotes" className="text-sm">
                Dispatch Notes (optional)
              </Label>
              <Textarea
                id="dispatchNotes"
                placeholder="e.g., Driver name, vehicle details..."
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                className="h-16"
              />
            </div>
          )}

          {/* Special input for delivery location */}
          {currentStatus === "dispatched" && (
            <div className="space-y-2">
              <Label htmlFor="deliveryLocation" className="text-sm flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Delivery Location (optional)
              </Label>
              <Input
                id="deliveryLocation"
                placeholder="e.g., Front door, Reception desk..."
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => {
              const Icon = action.icon;
              const isCancel = action.next === "cancelled";

              return (
                <Button
                  key={action.next}
                  variant={isCancel ? "outline" : "default"}
                  size="sm"
                  disabled={updating}
                  onClick={() => handleAction(action.next)}
                  className={isCancel ? "text-destructive border-destructive hover:bg-destructive/10" : ""}
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4 mr-2" />
                  )}
                  {action.label}
                </Button>
              );
            })}
          </div>

          {/* Status hints */}
          <Separator />
          <div className="text-xs text-muted-foreground">
            {currentStatus === "awarded" && "Confirm to accept this order and begin preparation."}
            {currentStatus === "confirmed" && "Start processing when you begin preparing the order."}
            {currentStatus === "processing" && "Mark as ready when the order is prepared for pickup."}
            {currentStatus === "ready" && "Dispatch for delivery or mark as picked up by patient."}
            {currentStatus === "dispatched" && "Mark as delivered once the patient receives the order."}
            {currentStatus === "delivered" && "Complete the order to finalize."}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please provide a reason for cancellation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Cancellation Reason</Label>
              <Textarea
                id="cancelReason"
                placeholder="e.g., Items out of stock, patient requested cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={updating || !cancelReason.trim()}
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
