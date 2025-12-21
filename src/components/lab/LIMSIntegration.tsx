import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLabOrders, useLabResults } from "@/hooks/useLabData";
import {
  Search,
  FlaskConical,
  TestTube,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Plus,
  Barcode,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Printer
} from "lucide-react";
import { format } from "date-fns";

// Mock analyzers (these would come from a separate integration)
const mockAnalyzers = [
  { id: "AN001", name: "Chemistry Analyzer 1", type: "Cobas c702", status: "running", queue: 12, uptime: 99.5 },
  { id: "AN002", name: "Hematology Analyzer", type: "Sysmex XN-1000", status: "running", queue: 8, uptime: 98.2 },
  { id: "AN003", name: "Immunoassay Analyzer", type: "Cobas e801", status: "maintenance", queue: 0, uptime: 95.0 },
  { id: "AN004", name: "Urinalysis System", type: "Siemens Atlas", status: "running", queue: 3, uptime: 99.1 },
  { id: "AN005", name: "Blood Gas Analyzer", type: "ABL90 FLEX", status: "running", queue: 2, uptime: 97.8 },
];

const qcData = [
  { level: "Level 1", value: 4.2, mean: 4.0, sd: 0.2, status: "pass" },
  { level: "Level 2", value: 8.1, mean: 8.0, sd: 0.3, status: "pass" },
  { level: "Level 3", value: 15.8, mean: 15.5, sd: 0.5, status: "warning" },
];

export function LIMSIntegration() {
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useLabOrders();
  const { results, loading: resultsLoading } = useLabResults();
  const loading = ordersLoading || resultsLoading;
  const refetch = refetchOrders;
  
  // Calculate stats from data
  const stats = {
    pending: orders.filter(o => o.status === "pending").length,
    inProgress: orders.filter(o => o.status === "in_progress").length,
    completed: orders.filter(o => o.status === "completed").length,
    critical: results.filter(r => r.is_critical).length
  };
  
  const [activeTab, setActiveTab] = useState("orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "in_progress":
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "stat":
        return <Badge variant="destructive">STAT</Badge>;
      case "urgent":
        return <Badge className="bg-orange-500">URGENT</Badge>;
      case "routine":
        return <Badge variant="outline">Routine</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getResultFlag = (isAbnormal: boolean | null, isCritical: boolean | null) => {
    if (isCritical) {
      return <Badge variant="destructive" className="animate-pulse">CRIT</Badge>;
    }
    if (isAbnormal) {
      return <Badge className="bg-orange-500">ABN</Badge>;
    }
    return null;
  };

  const getTrendIcon = (isAbnormal: boolean | null, isCritical: boolean | null) => {
    if (isCritical || isAbnormal) return <TrendingUp className="w-4 h-4 text-orange-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getAnalyzerStatus = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-500"><Activity className="w-3 h-3 mr-1" />Running</Badge>;
      case "maintenance":
        return <Badge className="bg-orange-500"><AlertTriangle className="w-3 h-3 mr-1" />Maintenance</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patient?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patient?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patient?.mrn?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laboratory Information System</h1>
          <p className="text-muted-foreground">Manage lab orders, results, and QC</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Barcode className="w-4 h-4 mr-2" />
            Scan Sample
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TestTube className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{stats.pending}</p>
              )}
              <p className="text-xs text-muted-foreground">Pending Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FlaskConical className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              )}
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{stats.completed}</p>
              )}
              <p className="text-xs text-muted-foreground">Completed Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{stats.critical}</p>
              )}
              <p className="text-xs text-muted-foreground">Critical Results</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="orders">Lab Orders</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="analyzers">Analyzers</TabsTrigger>
          <TabsTrigger value="qc">Quality Control</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="stat">STAT</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No lab orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {order.patient?.first_name} {order.patient?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{order.patient?.mrn}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.department || "—"}</TableCell>
                      <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(order.ordered_at), "dd MMM HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Barcode className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Results</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Reference Range</TableHead>
                  <TableHead>Flag</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No lab results found
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((result) => (
                    <TableRow key={result.id} className={result.is_critical ? "bg-red-50" : ""}>
                      <TableCell className="font-medium">{result.test_name}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${result.is_critical ? "text-red-600" : result.is_abnormal ? "text-orange-600" : ""}`}>
                          {result.result_value || "—"}
                        </span>
                        <span className="text-muted-foreground ml-1">{result.result_unit}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{result.reference_range || "—"}</TableCell>
                      <TableCell>{getResultFlag(result.is_abnormal, result.is_critical)}</TableCell>
                      <TableCell>{getTrendIcon(result.is_abnormal, result.is_critical)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {result.performed_at ? format(new Date(result.performed_at), "dd MMM HH:mm") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="analyzers" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {mockAnalyzers.map((analyzer) => (
              <Card key={analyzer.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{analyzer.name}</CardTitle>
                    {getAnalyzerStatus(analyzer.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span>{analyzer.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Queue</span>
                      <span>{analyzer.queue} samples</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Uptime</span>
                        <span>{analyzer.uptime}%</span>
                      </div>
                      <Progress value={analyzer.uptime} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="qc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quality Control Results</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Mean</TableHead>
                  <TableHead>SD</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qcData.map((qc, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{qc.level}</TableCell>
                    <TableCell>{qc.value}</TableCell>
                    <TableCell>{qc.mean}</TableCell>
                    <TableCell>{qc.sd}</TableCell>
                    <TableCell>
                      <Badge className={qc.status === "pass" ? "bg-green-500" : "bg-orange-500"}>
                        {qc.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
