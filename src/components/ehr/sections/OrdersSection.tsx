import { useState } from "react";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  FileText,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { MOCK_ORDERS, MOCK_LAB_RESULTS } from "@/data/mockClinicalData";
import type { OrderStatus, OrderPriority } from "@/types/clinical";

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  draft: <FileText className="w-4 h-4 text-muted-foreground" />,
  pending: <Clock className="w-4 h-4 text-warning" />,
  in_progress: <AlertCircle className="w-4 h-4 text-primary" />,
  completed: <CheckCircle2 className="w-4 h-4 text-success" />,
  cancelled: <AlertCircle className="w-4 h-4 text-muted-foreground" />,
};

const priorityColors: Record<OrderPriority, string> = {
  routine: "outline",
  urgent: "secondary",
  stat: "destructive",
};

function OrdersPanel() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = MOCK_ORDERS.filter(order => {
    const matchesType = typeFilter === "all" || order.type === typeFilter;
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const getOrderDetails = (order: typeof MOCK_ORDERS[0]) => {
    switch (order.type) {
      case "lab":
        return (order as any).testPanel;
      case "imaging":
        return `${(order as any).modality.toUpperCase()} - ${(order as any).bodyPart}`;
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

  return (
    <div className="space-y-4">
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
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Dialog>
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
                <Select>
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
                <Input placeholder="Search tests..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select defaultValue="routine">
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
                  <Select>
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
                <Label>Clinical Indication</Label>
                <Textarea placeholder="Reason for order..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Place Order</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map(order => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
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

  return (
    <div className="space-y-4">
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
      </div>

      {Object.entries(groupedResults).map(([orderId, results]) => {
        const order = MOCK_ORDERS.find(o => o.id === orderId);
        const orderDetails = order?.type === 'lab' ? (order as any).testPanel : 'Results';
        
        return (
          <Card key={orderId}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TestTube2 className="w-4 h-4" />
                  {orderDetails}
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  Reported: {format(results[0].reportedAt, "dd MMM yyyy HH:mm")}
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
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map(result => (
                    <TableRow key={result.id} className={result.isAbnormal ? "bg-warning/5" : ""}>
                      <TableCell className="font-medium">{result.testName}</TableCell>
                      <TableCell className={`text-right font-mono ${
                        result.isCritical ? "text-critical font-bold" :
                        result.isAbnormal ? "text-warning font-semibold" : ""
                      }`}>
                        {result.value}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{result.unit}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{result.referenceRange}</TableCell>
                      <TableCell>
                        {result.isAbnormal && (
                          result.isCritical ? (
                            <AlertCircle className="w-4 h-4 text-critical" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-warning" />
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {/* Imaging Results */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Abdominal Ultrasound
            </CardTitle>
            <div className="text-xs text-muted-foreground">
              Reported: 19 Dec 2024 14:30
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">FINDINGS</div>
              <p className="text-sm">
                Gallbladder is distended with wall thickening measuring 5mm (normal &lt;3mm). 
                Multiple gallstones present, largest measuring 12mm. 
                Pericholecystic fluid noted. 
                Common bile duct is not dilated (4mm).
                Liver, spleen, kidneys and pancreas appear normal.
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">IMPRESSION</div>
              <p className="text-sm font-medium">
                Acute cholecystitis with cholelithiasis. No evidence of biliary obstruction.
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              Reported by: Dr. A. Banda, Radiologist
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function OrdersSection() {
  return (
    <Tabs defaultValue="orders" className="space-y-4">
      <TabsList>
        <TabsTrigger value="orders" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Orders
        </TabsTrigger>
        <TabsTrigger value="results" className="flex items-center gap-2">
          <TestTube2 className="w-4 h-4" />
          Results
        </TabsTrigger>
      </TabsList>

      <TabsContent value="orders">
        <OrdersPanel />
      </TabsContent>

      <TabsContent value="results">
        <ResultsPanel />
      </TabsContent>
    </Tabs>
  );
}
