import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  FlaskConical,
  TestTube,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Printer,
  Eye,
  Plus,
  Barcode,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Beaker,
  Microscope,
  Pipette,
  ThermometerSun,
  Droplet
} from "lucide-react";

// Mock lab orders
const mockLabOrders = [
  {
    id: "LAB001",
    patientName: "Sarah M. Johnson",
    patientId: "MRN-2024-001847",
    orderDate: "2024-12-20 08:30",
    orderingProvider: "Dr. James Mwangi",
    tests: ["CBC", "BMP", "LFT"],
    priority: "stat",
    status: "in_progress",
    department: "Chemistry",
    collectedAt: "2024-12-20 09:15"
  },
  {
    id: "LAB002",
    patientName: "James K. Ochieng",
    patientId: "MRN-2024-001832",
    orderDate: "2024-12-20 07:45",
    orderingProvider: "Dr. Sarah Kimani",
    tests: ["Urinalysis", "Culture"],
    priority: "routine",
    status: "pending_collection",
    department: "Microbiology",
    collectedAt: null
  },
  {
    id: "LAB003",
    patientName: "Mary W. Njeri",
    patientId: "MRN-2024-001856",
    orderDate: "2024-12-20 06:00",
    orderingProvider: "Dr. Peter Kamau",
    tests: ["Troponin", "D-Dimer", "BNP"],
    priority: "stat",
    status: "completed",
    department: "Chemistry",
    collectedAt: "2024-12-20 06:15"
  },
  {
    id: "LAB004",
    patientName: "Peter M. Kamau",
    patientId: "MRN-2024-001801",
    orderDate: "2024-12-19 14:30",
    orderingProvider: "Dr. Grace Wanjiku",
    tests: ["HbA1c", "Lipid Panel"],
    priority: "routine",
    status: "completed",
    department: "Chemistry",
    collectedAt: "2024-12-19 15:00"
  },
];

// Mock lab results
const mockResults = [
  {
    id: "RES001",
    orderId: "LAB003",
    patientName: "Mary W. Njeri",
    test: "Troponin I",
    value: "0.85",
    unit: "ng/mL",
    refRange: "< 0.04",
    status: "critical_high",
    flag: "H",
    resultTime: "2024-12-20 07:30",
    verifiedBy: "Dr. Lab Tech"
  },
  {
    id: "RES002",
    orderId: "LAB003",
    patientName: "Mary W. Njeri",
    test: "D-Dimer",
    value: "2.5",
    unit: "mg/L FEU",
    refRange: "< 0.5",
    status: "high",
    flag: "H",
    resultTime: "2024-12-20 07:45",
    verifiedBy: "Dr. Lab Tech"
  },
  {
    id: "RES003",
    orderId: "LAB004",
    patientName: "Peter M. Kamau",
    test: "HbA1c",
    value: "7.2",
    unit: "%",
    refRange: "4.0 - 5.6",
    status: "high",
    flag: "H",
    resultTime: "2024-12-19 16:30",
    verifiedBy: "Dr. Lab Tech"
  },
  {
    id: "RES004",
    orderId: "LAB004",
    patientName: "Peter M. Kamau",
    test: "Total Cholesterol",
    value: "185",
    unit: "mg/dL",
    refRange: "< 200",
    status: "normal",
    flag: null,
    resultTime: "2024-12-19 16:30",
    verifiedBy: "Dr. Lab Tech"
  },
  {
    id: "RES005",
    orderId: "LAB004",
    patientName: "Peter M. Kamau",
    test: "LDL Cholesterol",
    value: "125",
    unit: "mg/dL",
    refRange: "< 100",
    status: "high",
    flag: "H",
    resultTime: "2024-12-19 16:30",
    verifiedBy: "Dr. Lab Tech"
  },
];

// Mock analyzers
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
  const [activeTab, setActiveTab] = useState("orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_collection":
        return <Badge variant="outline" className="bg-yellow-50"><Clock className="w-3 h-3 mr-1" />Pending Collection</Badge>;
      case "in_progress":
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case "critical":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Critical</Badge>;
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

  const getResultFlag = (status: string, flag: string | null) => {
    if (status === "critical_high" || status === "critical_low") {
      return <Badge variant="destructive" className="animate-pulse">{flag}!</Badge>;
    }
    if (status === "high") {
      return <Badge className="bg-orange-500">{flag}</Badge>;
    }
    if (status === "low") {
      return <Badge className="bg-blue-500">{flag}</Badge>;
    }
    return null;
  };

  const getTrendIcon = (status: string) => {
    if (status.includes("high")) return <TrendingUp className="w-4 h-4 text-orange-500" />;
    if (status.includes("low")) return <TrendingDown className="w-4 h-4 text-blue-500" />;
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

  const filteredOrders = mockLabOrders.filter(order => {
    const matchesSearch = order.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
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
              <p className="text-2xl font-bold">48</p>
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
              <p className="text-2xl font-bold">23</p>
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
              <p className="text-2xl font-bold">156</p>
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
              <p className="text-2xl font-bold">3</p>
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
                <SelectItem value="pending_collection">Pending</SelectItem>
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
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Orders Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.patientName}</p>
                        <p className="text-xs text-muted-foreground">{order.patientId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {order.tests.map((test, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{test}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.department}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{order.orderDate}</TableCell>
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
                ))}
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
                  <TableHead>Patient</TableHead>
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
                {mockResults.map((result) => (
                  <TableRow key={result.id} className={result.status.includes("critical") ? "bg-red-50" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{result.patientName}</p>
                        <p className="text-xs text-muted-foreground">{result.orderId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{result.test}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${result.status.includes("critical") ? "text-red-600" : result.status !== "normal" ? "text-orange-600" : ""}`}>
                        {result.value}
                      </span>
                      <span className="text-muted-foreground ml-1">{result.unit}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{result.refRange}</TableCell>
                    <TableCell>{getResultFlag(result.status, result.flag)}</TableCell>
                    <TableCell>{getTrendIcon(result.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{result.resultTime}</TableCell>
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
                ))}
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
                    <CardTitle className="text-lg">{analyzer.name}</CardTitle>
                    {getAnalyzerStatus(analyzer.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{analyzer.type}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{analyzer.queue}</p>
                      <p className="text-xs text-muted-foreground">In Queue</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{analyzer.uptime}%</p>
                      <p className="text-xs text-muted-foreground">Uptime</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">24</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                  </div>
                  <Progress value={analyzer.queue * 5} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Queue Capacity</span>
                    <span>{analyzer.queue}/20</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="qc" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">QC Results - Chemistry Analyzer 1</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Control Level</TableHead>
                      <TableHead>Measured Value</TableHead>
                      <TableHead>Target Mean</TableHead>
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
                        <TableCell>±{qc.sd}</TableCell>
                        <TableCell>
                          <Badge className={qc.status === "pass" ? "bg-green-500" : "bg-yellow-500"}>
                            {qc.status === "pass" ? "Pass" : "Warning"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">QC Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall Status</span>
                  <Badge className="bg-green-500">Pass</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Run</span>
                  <span className="text-sm text-muted-foreground">08:00 AM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Next Run</span>
                  <span className="text-sm text-muted-foreground">12:00 PM</span>
                </div>
                <Button className="w-full">
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Run QC Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
