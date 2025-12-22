import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Send,
  Gavel,
  Award,
  CheckCircle,
  Package,
  Truck,
  Home,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface TrackingEvent {
  id: string;
  status: string;
  notes: string | null;
  location: string | null;
  created_at: string;
}

interface OrderTrackingTimelineProps {
  requestId: string;
  currentStatus?: string;
}

const statusConfig: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  draft: { icon: FileText, color: "text-gray-500", label: "Draft" },
  submitted: { icon: Send, color: "text-blue-500", label: "Submitted" },
  bidding: { icon: Gavel, color: "text-yellow-500", label: "Bidding Open" },
  awarded: { icon: Award, color: "text-purple-500", label: "Vendor Awarded" },
  confirmed: { icon: CheckCircle, color: "text-indigo-500", label: "Confirmed" },
  processing: { icon: Package, color: "text-cyan-500", label: "Processing" },
  ready: { icon: Package, color: "text-green-500", label: "Ready for Pickup" },
  dispatched: { icon: Truck, color: "text-orange-500", label: "Dispatched" },
  delivered: { icon: Home, color: "text-teal-500", label: "Delivered" },
  completed: { icon: CheckCircle, color: "text-emerald-600", label: "Completed" },
  cancelled: { icon: XCircle, color: "text-red-500", label: "Cancelled" },
  expired: { icon: AlertCircle, color: "text-gray-600", label: "Expired" },
};

const statusOrder = [
  "draft",
  "submitted",
  "bidding",
  "awarded",
  "confirmed",
  "processing",
  "ready",
  "dispatched",
  "delivered",
  "completed",
];

export default function OrderTrackingTimeline({ requestId, currentStatus }: OrderTrackingTimelineProps) {
  const { data: trackingEvents = [], isLoading } = useQuery({
    queryKey: ["fulfillment-tracking", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fulfillment_tracking")
        .select("id, status, notes, location, created_at")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TrackingEvent[];
    },
    enabled: !!requestId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-8 w-8 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get current status index for progress display
  const currentStatusIndex = statusOrder.indexOf(currentStatus || "draft");
  const isCancelled = currentStatus === "cancelled" || currentStatus === "expired";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Order Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {["bidding", "awarded", "processing", "ready", "delivered"].map((step, index) => {
              const stepIndex = statusOrder.indexOf(step);
              const isCompleted = currentStatusIndex >= stepIndex && !isCancelled;
              const isCurrent = currentStatus === step;
              const config = statusConfig[step];
              const Icon = config.icon;

              return (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                        ? "border-primary text-primary"
                        : "border-muted-foreground/30 text-muted-foreground/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`text-xs mt-1 text-center ${
                      isCompleted || isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {config.label}
                  </span>
                  {index < 4 && (
                    <div
                      className={`absolute h-0.5 w-full top-4 left-1/2 ${
                        currentStatusIndex > stepIndex ? "bg-primary" : "bg-muted"
                      }`}
                      style={{ display: "none" }} // Progress line hidden for simplicity
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Timeline Events */}
        <div className="space-y-4">
          {trackingEvents.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No tracking events yet
            </div>
          ) : (
            trackingEvents.map((event, index) => {
              const config = statusConfig[event.status] || statusConfig.draft;
              const Icon = config.icon;
              const isLast = index === trackingEvents.length - 1;

              return (
                <div key={event.id} className="flex gap-4 relative">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-muted" />
                  )}

                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center bg-background border-2 z-10 ${
                      isLast ? "border-primary" : "border-muted"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{config.label}</span>
                      {isLast && (
                        <Badge variant="outline" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    {event.notes && (
                      <p className="text-sm text-muted-foreground mb-1">{event.notes}</p>
                    )}
                    {event.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>📍</span> {event.location}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(event.created_at), "MMM d, yyyy 'at' HH:mm")} •{" "}
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
