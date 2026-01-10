import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FlaskConical,
  Scan,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MapPin,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface PortalOrdersResultsProps {
  patientId: string;
}

interface PatientOrder {
  id: string;
  order_type: "lab" | "imaging" | "procedure";
  order_name: string;
  ordered_at: string;
  status: "pending" | "scheduled" | "in_progress" | "completed" | "cancelled";
  location?: string;
  instructions?: string;
  scheduled_for?: string;
  result_available: boolean;
  result_released: boolean;
}

interface PatientResult {
  id: string;
  type: "lab" | "imaging" | "procedure";
  name: string;
  result_date: string;
  status: "normal" | "abnormal" | "critical" | "pending_review";
  summary?: string;
  is_released: boolean;
  requires_review: boolean;
  result_data?: Record<string, any>;
}

export function PortalOrdersResults({ patientId }: PortalOrdersResultsProps) {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState<PatientOrder[]>([]);
  const [results, setResults] = useState<PatientResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<PatientResult | null>(null);

  useEffect(() => {
    fetchOrdersAndResults();
  }, [patientId]);

  const fetchOrdersAndResults = async () => {
    setLoading(true);
    try {
      // Fetch lab orders
      const { data: labOrders } = await supabase
        .from("lab_orders")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(20);

      // Transform to unified format
      const transformedOrders: PatientOrder[] = (labOrders || []).map((o: any) => ({
        id: o.id,
        order_type: "lab" as const,
        order_name: o.test_code || "Lab Test",
        ordered_at: o.created_at,
        status: mapLabStatus(o.status),
        instructions: o.collection_instructions || undefined,
        result_available: o.status === "completed",
        result_released: false,
      }));

      setOrders(transformedOrders.sort((a, b) => 
        new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime()
      ));

      // Fetch results
      const { data: labResults }: { data: any[] | null } = await (supabase
        .from("lab_results")
        .select("id, test_name, result_value, unit, reference_range, result_status, created_at, patient_id, verified")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(20) as any);

      const transformedResults: PatientResult[] = (labResults || []).map((r: any) => ({
        id: r.id,
        type: "lab" as const,
        name: r.test_name || "Lab Result",
        result_date: r.created_at,
        status: mapResultStatus(r.result_status),
        summary: r.result_value ? `${r.result_value} ${r.unit || ""}` : undefined,
        is_released: true,
        requires_review: r.result_status === "critical",
        result_data: { value: r.result_value, unit: r.unit, range: r.reference_range },
      }));

      setResults(transformedResults);
    } catch (error) {
      console.error("Error fetching orders/results:", error);
    } finally {
      setLoading(false);
    }
  };

  const mapLabStatus = (status: string): PatientOrder["status"] => {
    switch (status) {
      case "ordered": return "pending";
      case "collected": return "in_progress";
      case "in_progress": return "in_progress";
      case "completed": return "completed";
      case "cancelled": return "cancelled";
      default: return "pending";
    }
  };

  const mapImagingStatus = (status: string): PatientOrder["status"] => {
    switch (status) {
      case "requested": return "pending";
      case "scheduled": return "scheduled";
      case "in_progress": return "in_progress";
      case "completed": return "completed";
      case "reported": return "completed";
      case "cancelled": return "cancelled";
      default: return "pending";
    }
  };

  const mapResultStatus = (flag: string | null): PatientResult["status"] => {
    switch (flag) {
      case "normal": return "normal";
      case "abnormal": return "abnormal";
      case "critical": return "critical";
      default: return "pending_review";
    }
  };

  const getStatusBadge = (status: PatientOrder["status"]) => {
    const configs: Record<PatientOrder["status"], { variant: "outline" | "secondary" | "default" | "destructive"; label: string; icon: any; className?: string }> = {
      pending: { variant: "outline", label: "Pending", icon: Clock },
      scheduled: { variant: "secondary", label: "Scheduled", icon: Calendar },
      in_progress: { variant: "default", label: "In Progress", icon: Loader2 },
      completed: { variant: "outline", label: "Complete", icon: CheckCircle2, className: "border-success text-success" },
      cancelled: { variant: "destructive", label: "Cancelled", icon: AlertCircle },
    };
    const config = configs[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={config.className || ""}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getResultBadge = (status: PatientResult["status"]) => {
    switch (status) {
      case "normal":
        return <Badge className="bg-success text-success-foreground">Normal</Badge>;
      case "abnormal":
        return <Badge className="bg-warning text-warning-foreground">Abnormal</Badge>;
      case "critical":
        return <Badge className="bg-destructive text-destructive-foreground">Critical</Badge>;
      default:
        return <Badge variant="secondary">Pending Review</Badge>;
    }
  };

  const getOrderIcon = (type: PatientOrder["order_type"]) => {
    switch (type) {
      case "lab": return FlaskConical;
      case "imaging": return Scan;
      default: return FileText;
    }
  };

  const pendingOrders = orders.filter(o => !o.result_available);
  const completedOrders = orders.filter(o => o.result_available);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Orders & Results</h2>
          <p className="text-sm text-muted-foreground">
            Track your lab tests, imaging, and view results
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrdersAndResults}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Orders
            {pendingOrders.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingOrders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Results
            {results.length > 0 && (
              <Badge variant="secondary" className="ml-1">{results.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending Orders Tab */}
        <TabsContent value="orders" className="mt-4">
          {pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
                <h3 className="font-medium text-lg mb-2">No Pending Orders</h3>
                <p className="text-muted-foreground">
                  All your orders have been completed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map(order => {
                const Icon = getOrderIcon(order.order_type);
                return (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{order.order_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Ordered {formatDistanceToNow(new Date(order.ordered_at), { addSuffix: true })}
                            </p>
                            {order.location && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                {order.location}
                              </div>
                            )}
                            {order.instructions && (
                              <Alert className="mt-2 py-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  {order.instructions}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          {order.status === "scheduled" && order.scheduled_for && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(order.scheduled_for), "MMM d, h:mm a")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Progress indicator */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Order Progress</span>
                          <span>{getProgressPercent(order.status)}%</span>
                        </div>
                        <Progress value={getProgressPercent(order.status)} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="mt-4">
          {results.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No Results Yet</h3>
                <p className="text-muted-foreground">
                  Your results will appear here once they are released.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {results.map(result => (
                  <Card 
                    key={result.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedResult(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            {result.type === "lab" ? (
                              <FlaskConical className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Scan className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{result.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(result.result_date), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getResultBadge(result.status)}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      {result.summary && (
                        <div className="mt-3 p-2 bg-muted rounded text-sm">
                          Result: <span className="font-medium">{result.summary}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Result Detail Dialog */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedResult?.type === "lab" ? (
                <FlaskConical className="h-5 w-5" />
              ) : (
                <Scan className="h-5 w-5" />
              )}
              {selectedResult?.name}
            </DialogTitle>
            <DialogDescription>
              Result from {selectedResult && format(new Date(selectedResult.result_date), "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>

          {selectedResult && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Status</span>
                {getResultBadge(selectedResult.status)}
              </div>

              {selectedResult.result_data && (
                <div className="space-y-3">
                  <div className="flex justify-between p-3 border rounded">
                    <span>Value</span>
                    <span className="font-mono font-medium">
                      {selectedResult.result_data.value} {selectedResult.result_data.unit}
                    </span>
                  </div>
                  {selectedResult.result_data.range && (
                    <div className="flex justify-between p-3 border rounded">
                      <span>Reference Range</span>
                      <span className="text-muted-foreground">
                        {selectedResult.result_data.range}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {selectedResult.status === "abnormal" || selectedResult.status === "critical" ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Attention Required</AlertTitle>
                  <AlertDescription>
                    This result is outside the normal range. Please discuss with your healthcare provider.
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Follow-up
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getProgressPercent(status: PatientOrder["status"]): number {
  switch (status) {
    case "pending": return 25;
    case "scheduled": return 40;
    case "in_progress": return 70;
    case "completed": return 100;
    case "cancelled": return 0;
    default: return 0;
  }
}
