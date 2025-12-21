import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  TestTube2,
  ImageIcon,
  Syringe,
  Pill,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  Search,
  XCircle,
  Eye,
  Printer,
  RefreshCw,
  Activity,
  Minus,
  ChevronRight,
  ShieldAlert,
  ShoppingCart,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { MOCK_ORDERS, MOCK_LAB_RESULTS } from "@/data/mockClinicalData";
import type { OrderStatus, OrderPriority } from "@/types/clinical";
import { usePermissions } from "@/hooks/usePermissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MedicationOrders } from "@/components/clinical/MedicationOrders";
import { OrderEntrySystem } from "@/components/orders/OrderEntrySystem";
import { OrderSetsSystem } from "@/components/ehr/orders/OrderSetsSystem";

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  draft: <FileText className="w-4 h-4 text-muted-foreground" />,
  pending: <Clock className="w-4 h-4 text-warning" />,
  in_progress: <RefreshCw className="w-4 h-4 text-primary animate-spin" />,
  completed: <CheckCircle2 className="w-4 h-4 text-success" />,
  cancelled: <XCircle className="w-4 h-4 text-muted-foreground" />,
};

const priorityColors: Record<OrderPriority, string> = {
  routine: "outline",
  urgent: "secondary",
  stat: "destructive",
};

// Mock imaging results
const MOCK_IMAGING_RESULTS = [
  {
    id: "ir1",
    orderId: "o4",
    modality: "Ultrasound",
    bodyPart: "Abdomen - Hepatobiliary",
    status: "completed",
    findings: "Gallbladder is distended with wall thickening measuring 5mm (normal <3mm). Multiple gallstones present, largest measuring 12mm. Pericholecystic fluid noted. Common bile duct is not dilated (4mm). Liver, spleen, kidneys and pancreas appear normal.",
    impression: "Acute cholecystitis with cholelithiasis. No evidence of biliary obstruction.",
    reportedBy: "Dr. A. Banda, Radiologist",
    reportedAt: new Date("2024-12-19T14:30:00"),
    hasImages: true,
    criticalFindings: ["Acute cholecystitis"],
  },
  {
    id: "ir2",
    orderId: "o5",
    modality: "Chest X-Ray",
    bodyPart: "Chest PA",
    status: "completed",
    findings: "Heart size normal. Lungs are clear. No pleural effusion. No pneumothorax. Bony structures intact.",
    impression: "Normal chest radiograph.",
    reportedBy: "Dr. K. Mwenda, Radiologist",
    reportedAt: new Date("2024-12-20T09:15:00"),
    hasImages: true,
    criticalFindings: [],
  },
];

// Mock procedures
const MOCK_PROCEDURES = [
  {
    id: "proc1",
    name: "Cholecystectomy",
    type: "surgical",
    status: "scheduled",
    scheduledDate: new Date("2024-12-22T08:00:00"),
    surgeon: "Dr. J. Ochieng",
    location: "Theatre 2",
    preOpChecklist: { consent: true, npo: true, ivAccess: true, bloodTyped: true },
    notes: "Laparoscopic approach planned. Convert to open if needed.",
  },
  {
    id: "proc2",
    name: "IV Cannulation",
    type: "bedside",
    status: "completed",
    performedAt: new Date("2024-12-19T09:00:00"),
    performedBy: "Nurse Moyo",
    site: "Right antecubital fossa, 18G",
    notes: "Good flashback, flushed well",
  },
];

// Historical lab values for trending
const MOCK_HISTORICAL_LABS = {
  "White Blood Cell Count": [
    { date: new Date("2024-12-19T12:00:00"), value: 14.2 },
    { date: new Date("2024-12-20T08:00:00"), value: 12.8 },
    { date: new Date("2024-12-21T08:00:00"), value: 10.5 },
  ],
  "Haemoglobin": [
    { date: new Date("2024-12-19T12:00:00"), value: 12.8 },
    { date: new Date("2024-12-20T08:00:00"), value: 12.5 },
    { date: new Date("2024-12-21T08:00:00"), value: 12.6 },
  ],
};

function OrdersPanel({ canOrder = true }: { canOrder?: boolean }) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    type: "lab",
    testPanel: "",
    priority: "routine" as OrderPriority,
    specimen: "",
    clinicalIndication: "",
  });

  const filteredOrders = orders.filter(order => {
    const matchesType = typeFilter === "all" || order.type === typeFilter;
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const getOrderDetails = (order: typeof MOCK_ORDERS[0]) => {
    switch (order.type) {
      case "lab":
        return (order as any).testPanel;
      case "imaging":
        return `${(order as any).modality?.toUpperCase() || 'IMAGING'} - ${(order as any).bodyPart || 'N/A'}`;
      default:
        return order.clinicalIndication;
    }
  };

  const getOrderIcon = (type: string) => {
    switch (type) {
      case "lab": return <TestTube2 className="w-4 h-4" />;
      case "imaging": return <ImageIcon className="w-4 h-4" />;
      case "procedure": return <Syringe className="w-4 h-4" />;
      case "medication": return <Pill className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleCancelOrder = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' as OrderStatus } : o));
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;

  return (
    <div className="space-y-4">
      {/* Order Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-3 flex items-center gap-3">
            <Clock className="w-8 h-8 text-warning" />
            <div>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{inProgressCount}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-3 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-success" />
            <div>
              <div className="text-2xl font-bold">{orders.filter(o => o.status === 'completed').length}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Activity className="w-8 h-8 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{orders.length}</div>
              <div className="text-xs text-muted-foreground">Total Orders</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Order type" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="lab">Laboratory</SelectItem>
            <SelectItem value="imaging">Imaging</SelectItem>
            <SelectItem value="procedure">Procedure</SelectItem>
            <SelectItem value="medication">Medication</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        {canOrder && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-background max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select 
                  value={newOrder.type}
                  onValueChange={(v) => setNewOrder({ ...newOrder, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="lab">Laboratory Test</SelectItem>
                    <SelectItem value="imaging">Imaging Study</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Test / Study</Label>
                <Input 
                  placeholder="Search tests..."
                  value={newOrder.testPanel}
                  onChange={(e) => setNewOrder({ ...newOrder, testPanel: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select 
                    value={newOrder.priority}
                    onValueChange={(v) => setNewOrder({ ...newOrder, priority: v as OrderPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="stat">STAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Specimen Type</Label>
                  <Select 
                    value={newOrder.specimen}
                    onValueChange={(v) => setNewOrder({ ...newOrder, specimen: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="blood">Blood</SelectItem>
                      <SelectItem value="urine">Urine</SelectItem>
                      <SelectItem value="stool">Stool</SelectItem>
                      <SelectItem value="csf">CSF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Clinical Indication *</Label>
                <Textarea 
                  placeholder="Reason for order..."
                  value={newOrder.clinicalIndication}
                  onChange={(e) => setNewOrder({ ...newOrder, clinicalIndication: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                if (newOrder.testPanel && newOrder.clinicalIndication) {
                  setOrders(prev => [...prev, {
                    id: `o${Date.now()}`,
                    type: newOrder.type as any,
                    testPanel: newOrder.testPanel,
                    status: 'pending' as OrderStatus,
                    priority: newOrder.priority,
                    orderedBy: "Current User",
                    orderedAt: new Date(),
                    clinicalIndication: newOrder.clinicalIndication,
                  } as any]);
                  setNewOrder({ type: "lab", testPanel: "", priority: "routine", specimen: "", clinicalIndication: "" });
                  setIsAddOpen(false);
                }
              }}>Place Order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ordered By</TableHead>
                <TableHead>Date/Time</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map(order => (
                <TableRow key={order.id} className="group cursor-pointer hover:bg-muted/50">
                  <TableCell>{getOrderIcon(order.type)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{getOrderDetails(order)}</div>
                    <div className="text-xs text-muted-foreground">{order.clinicalIndication}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={priorityColors[order.priority] as "outline" | "secondary" | "destructive"}>
                      {order.priority.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {statusIcons[order.status]}
                      <span className="capitalize">{order.status.replace("_", " ")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{order.orderedBy}</TableCell>
                  <TableCell className="text-sm">
                    {format(order.orderedAt, "dd MMM HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {order.status === 'completed' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="w-3 h-3" />
                        </Button>
                      )}
                      {order.status === 'pending' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultsPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [resultType, setResultType] = useState<string>("all");
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const filteredResults = MOCK_LAB_RESULTS.filter(result =>
    result.testName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group results by order
  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.orderId]) {
      acc[result.orderId] = [];
    }
    acc[result.orderId].push(result);
    return acc;
  }, {} as Record<string, typeof MOCK_LAB_RESULTS>);

  const getTrendIcon = (testName: string) => {
    const history = MOCK_HISTORICAL_LABS[testName as keyof typeof MOCK_HISTORICAL_LABS];
    if (!history || history.length < 2) return null;
    const latest = history[history.length - 1].value;
    const previous = history[history.length - 2].value;
    if (latest > previous) return <TrendingUp className="w-3 h-3 text-warning" />;
    if (latest < previous) return <TrendingDown className="w-3 h-3 text-success" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const abnormalCount = filteredResults.filter(r => r.isAbnormal).length;
  const criticalCount = filteredResults.filter(r => r.isCritical).length;

  return (
    <div className="space-y-4">
      {/* Results Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{filteredResults.length}</div>
            <div className="text-xs text-muted-foreground">Total Results</div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-warning">{abnormalCount}</div>
            <div className="text-xs text-muted-foreground">Abnormal</div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{MOCK_IMAGING_RESULTS.length}</div>
            <div className="text-xs text-muted-foreground">Imaging</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={resultType} onValueChange={setResultType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="lab">Lab Only</SelectItem>
            <SelectItem value="imaging">Imaging Only</SelectItem>
            <SelectItem value="abnormal">Abnormal Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lab Results */}
      {(resultType === "all" || resultType === "lab" || resultType === "abnormal") && 
        Object.entries(groupedResults).map(([orderId, results]) => {
          const order = MOCK_ORDERS.find(o => o.id === orderId);
          const orderDetails = order?.type === 'lab' ? (order as any).testPanel : 'Results';
          
          if (resultType === "abnormal" && !results.some(r => r.isAbnormal)) return null;
          
          return (
            <Card key={orderId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TestTube2 className="w-4 h-4" />
                    {orderDetails}
                    {results.some(r => r.isCritical) && (
                      <Badge variant="destructive">Critical Values</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      Reported: {format(results[0].reportedAt, "dd MMM yyyy HH:mm")}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Printer className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead className="text-right">Result</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Reference Range</TableHead>
                      <TableHead className="w-16">Trend</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map(result => (
                      <TableRow 
                        key={result.id} 
                        className={`cursor-pointer ${result.isAbnormal ? "bg-warning/5" : ""} ${result.isCritical ? "bg-destructive/5" : ""}`}
                        onClick={() => setSelectedTest(selectedTest === result.id ? null : result.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {result.testName}
                            {selectedTest === result.id && <ChevronRight className="w-3 h-3 rotate-90" />}
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-mono ${
                          result.isCritical ? "text-destructive font-bold" :
                          result.isAbnormal ? "text-warning font-semibold" : ""
                        }`}>
                          {result.value}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{result.unit}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{result.referenceRange}</TableCell>
                        <TableCell>{getTrendIcon(result.testName)}</TableCell>
                        <TableCell>
                          {result.isAbnormal && (
                            result.isCritical ? (
                              <AlertCircle className="w-4 h-4 text-destructive" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-warning" />
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Historical Trend View */}
                {selectedTest && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-3">Historical Values</h4>
                    <div className="flex items-end gap-2 h-24">
                      {MOCK_HISTORICAL_LABS[filteredResults.find(r => r.id === selectedTest)?.testName as keyof typeof MOCK_HISTORICAL_LABS]?.map((point, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-primary rounded-t"
                            style={{ height: `${(point.value / 20) * 100}%` }}
                          />
                          <div className="text-xs text-muted-foreground mt-1">{format(point.date, "dd/MM")}</div>
                          <div className="text-xs font-mono">{point.value}</div>
                        </div>
                      )) || <div className="text-sm text-muted-foreground">No historical data available</div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      }

      {/* Imaging Results */}
      {(resultType === "all" || resultType === "imaging") && MOCK_IMAGING_RESULTS.map(imaging => (
        <Card key={imaging.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {imaging.modality} - {imaging.bodyPart}
                {imaging.criticalFindings.length > 0 && (
                  <Badge variant="destructive">Critical Finding</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">
                  Reported: {format(imaging.reportedAt, "dd MMM yyyy HH:mm")}
                </div>
                {imaging.hasImages && (
                  <Button variant="outline" size="sm">
                    <Eye className="w-3 h-3 mr-1" />
                    View Images
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">FINDINGS</div>
                <p className="text-sm">{imaging.findings}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">IMPRESSION</div>
                <p className="text-sm font-medium">{imaging.impression}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Reported by: {imaging.reportedBy}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProceduresPanel() {
  const [procedures, setProcedures] = useState(MOCK_PROCEDURES);
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">PROCEDURES</h3>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Procedure
        </Button>
      </div>

      <div className="space-y-3">
        {procedures.map(proc => (
          <Card key={proc.id} className={proc.status === 'scheduled' ? 'border-primary/50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    proc.status === 'scheduled' ? 'bg-primary/10' : 
                    proc.status === 'completed' ? 'bg-success/10' : 'bg-muted'
                  }`}>
                    <Syringe className={`w-5 h-5 ${
                      proc.status === 'scheduled' ? 'text-primary' : 
                      proc.status === 'completed' ? 'text-success' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{proc.name}</span>
                      <Badge variant={proc.status === 'scheduled' ? 'default' : 'outline'} className="capitalize">
                        {proc.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{proc.type}</Badge>
                    </div>
                    
                    {proc.status === 'scheduled' && (
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-primary font-medium">
                          {format(proc.scheduledDate!, "EEE dd MMM, HH:mm")}
                        </span>
                        <span className="text-muted-foreground">{proc.location}</span>
                        <span className="text-muted-foreground">{proc.surgeon}</span>
                      </div>
                    )}

                    {proc.status === 'completed' && (
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Performed: {format(proc.performedAt!, "dd MMM HH:mm")}</span>
                        <span>By: {proc.performedBy}</span>
                        {proc.site && <span>Site: {proc.site}</span>}
                      </div>
                    )}

                    {proc.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{proc.notes}</p>
                    )}

                    {/* Pre-op Checklist */}
                    {proc.preOpChecklist && proc.status === 'scheduled' && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Pre-Op Checklist</div>
                        <div className="grid grid-cols-4 gap-2">
                          {Object.entries(proc.preOpChecklist).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-1">
                              {value ? (
                                <CheckCircle2 className="w-3 h-3 text-success" />
                              ) : (
                                <XCircle className="w-3 h-3 text-destructive" />
                              )}
                              <span className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            </div>
                          ))}
                        </div>
                        <Progress value={Object.values(proc.preOpChecklist).filter(Boolean).length / Object.keys(proc.preOpChecklist).length * 100} className="mt-2 h-1" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {proc.status === 'scheduled' && (
                    <>
                      <Button variant="outline" size="sm">Reschedule</Button>
                      <Button size="sm">Pre-Op Note</Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function OrdersSection() {
  const { hasPermission, role } = usePermissions();
  
  const canViewResults = hasPermission('view_lab_results');
  const canOrderLabs = hasPermission('order_labs');

  if (!canViewResults) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto my-8">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Access Restricted</AlertTitle>
        <AlertDescription>
          You don't have permission to view orders and results. This feature is available to clinical staff only.
        </AlertDescription>
      </Alert>
    );
  }

  const { encounterId } = useParams<{ encounterId?: string }>();

  return (
    <Tabs defaultValue="order-entry" className="space-y-4">
      <TabsList className="flex-wrap">
        <TabsTrigger value="order-entry" className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Order Entry
        </TabsTrigger>
        <TabsTrigger value="order-sets" className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Order Sets
        </TabsTrigger>
        <TabsTrigger value="orders" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Active Orders
        </TabsTrigger>
        <TabsTrigger value="medications" className="flex items-center gap-2">
          <Pill className="w-4 h-4" />
          Medications
        </TabsTrigger>
        <TabsTrigger value="results" className="flex items-center gap-2">
          <TestTube2 className="w-4 h-4" />
          Results
        </TabsTrigger>
        <TabsTrigger value="procedures" className="flex items-center gap-2">
          <Syringe className="w-4 h-4" />
          Procedures
        </TabsTrigger>
      </TabsList>

      <TabsContent value="order-entry">
        {encounterId ? (
          <OrderEntrySystem patientId="" encounterId={encounterId} />
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Select a patient encounter to place orders
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="order-sets">
        <OrderSetsSystem />
      </TabsContent>

      <TabsContent value="orders">
        <OrdersPanel canOrder={canOrderLabs} />
      </TabsContent>

      <TabsContent value="medications">
        {encounterId ? (
          <MedicationOrders encounterId={encounterId} />
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Select a patient encounter to manage medication orders
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="results">
        <ResultsPanel />
      </TabsContent>

      <TabsContent value="procedures">
        <ProceduresPanel />
      </TabsContent>
    </Tabs>
  );
}
