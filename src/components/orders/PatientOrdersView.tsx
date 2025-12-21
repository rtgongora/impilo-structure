import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pill,
  TestTube,
  Stethoscope,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClinicalOrder {
  id: string;
  order_type: string;
  order_name: string;
  category: string | null;
  quantity: number;
  priority: string;
  status: string;
  ordered_at: string;
  details: Record<string, unknown> | null;
}

interface PatientOrdersViewProps {
  patientId: string;
  encounterId?: string;
}

const typeConfig: Record<string, { icon: typeof Pill; color: string }> = {
  medication: { icon: Pill, color: "bg-blue-500/10 text-blue-500" },
  lab: { icon: TestTube, color: "bg-purple-500/10 text-purple-500" },
  imaging: { icon: Stethoscope, color: "bg-amber-500/10 text-amber-500" },
  procedure: { icon: Zap, color: "bg-emerald-500/10 text-emerald-500" },
  consult: { icon: Stethoscope, color: "bg-pink-500/10 text-pink-500" },
  nursing: { icon: Zap, color: "bg-cyan-500/10 text-cyan-500" },
};

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: "bg-amber-500/10 text-amber-500", icon: Clock },
  active: { color: "bg-blue-500/10 text-blue-500", icon: Clock },
  completed: { color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle },
  cancelled: { color: "bg-destructive/10 text-destructive", icon: XCircle },
  discontinued: { color: "bg-muted text-muted-foreground", icon: XCircle },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  routine: { color: "bg-muted text-muted-foreground", label: "Routine" },
  urgent: { color: "bg-amber-500/10 text-amber-500", label: "Urgent" },
  stat: { color: "bg-destructive/10 text-destructive", label: "STAT" },
};

export function PatientOrdersView({ patientId, encounterId }: PatientOrdersViewProps) {
  const [orders, setOrders] = useState<ClinicalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("clinical_orders")
        .select("*")
        .eq("patient_id", patientId)
        .order("ordered_at", { ascending: false });

      if (encounterId) {
        query = query.eq("encounter_id", encounterId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders((data as ClinicalOrder[]) || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [patientId, encounterId]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
      } else if (newStatus === "cancelled") {
        updates.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("clinical_orders")
        .update(updates)
        .eq("id", orderId);

      if (error) throw error;
      toast.success(`Order ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return ["pending", "active"].includes(order.status);
    return order.order_type === activeTab;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Patient Orders</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({orders.filter((o) => ["pending", "active"].includes(o.status)).length})
            </TabsTrigger>
            <TabsTrigger value="medication">Meds</TabsTrigger>
            <TabsTrigger value="lab">Labs</TabsTrigger>
            <TabsTrigger value="imaging">Imaging</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No orders found</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredOrders.map((order) => {
                    const typeInfo = typeConfig[order.order_type] || typeConfig.procedure;
                    const TypeIcon = typeInfo.icon;
                    const statusInfo = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = statusInfo.icon;
                    const priorityInfo = priorityConfig[order.priority] || priorityConfig.routine;

                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{order.order_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{order.category}</span>
                              <span>•</span>
                              <span>Qty: {order.quantity}</span>
                              <span>•</span>
                              <span>{new Date(order.ordered_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={priorityInfo.color}>
                            {priorityInfo.label}
                          </Badge>
                          <Badge variant="outline" className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {order.status}
                          </Badge>

                          {order.status === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => updateOrderStatus(order.id, "completed")}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-destructive"
                                onClick={() => updateOrderStatus(order.id, "cancelled")}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
