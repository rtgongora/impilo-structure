import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TestTube,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Beaker,
} from "lucide-react";

interface LabResult {
  id: string;
  testName: string;
  category: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: "normal" | "high" | "low" | "critical";
  orderedAt: Date;
  collectedAt?: Date;
  resultedAt?: Date;
  orderStatus: "ordered" | "collected" | "processing" | "resulted";
  orderedBy: string;
}

const MOCK_RESULTS: LabResult[] = [
  {
    id: "LAB-001",
    testName: "Complete Blood Count",
    category: "Hematology",
    value: "14.2",
    unit: "g/dL",
    referenceRange: "12.0-16.0",
    status: "normal",
    orderedAt: new Date(Date.now() - 86400000),
    collectedAt: new Date(Date.now() - 82800000),
    resultedAt: new Date(Date.now() - 3600000),
    orderStatus: "resulted",
    orderedBy: "Dr. Sarah Moyo",
  },
  {
    id: "LAB-002",
    testName: "Fasting Blood Glucose",
    category: "Chemistry",
    value: "142",
    unit: "mg/dL",
    referenceRange: "70-100",
    status: "high",
    orderedAt: new Date(Date.now() - 172800000),
    collectedAt: new Date(Date.now() - 169200000),
    resultedAt: new Date(Date.now() - 86400000),
    orderStatus: "resulted",
    orderedBy: "Dr. James Ncube",
  },
  {
    id: "LAB-003",
    testName: "Creatinine",
    category: "Chemistry",
    value: "0.8",
    unit: "mg/dL",
    referenceRange: "0.6-1.2",
    status: "normal",
    orderedAt: new Date(Date.now() - 7200000),
    orderStatus: "processing",
    orderedBy: "Dr. Sarah Moyo",
  },
  {
    id: "LAB-004",
    testName: "Potassium",
    category: "Chemistry",
    value: "5.8",
    unit: "mEq/L",
    referenceRange: "3.5-5.0",
    status: "critical",
    orderedAt: new Date(Date.now() - 259200000),
    collectedAt: new Date(Date.now() - 255600000),
    resultedAt: new Date(Date.now() - 172800000),
    orderStatus: "resulted",
    orderedBy: "Dr. James Ncube",
  },
  {
    id: "LAB-005",
    testName: "Urinalysis",
    category: "Urinalysis",
    value: "",
    unit: "",
    referenceRange: "",
    status: "normal",
    orderedAt: new Date(Date.now() - 1800000),
    orderStatus: "collected",
    orderedBy: "Dr. Sarah Moyo",
  },
];

const statusConfig = {
  normal: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: Minus, label: "Normal" },
  high: { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: TrendingUp, label: "High" },
  low: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: TrendingDown, label: "Low" },
  critical: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle, label: "Critical" },
};

const orderStatusConfig = {
  ordered: { color: "bg-muted text-muted-foreground", icon: Clock, label: "Ordered" },
  collected: { color: "bg-blue-500/10 text-blue-500", icon: TestTube, label: "Collected" },
  processing: { color: "bg-amber-500/10 text-amber-500", icon: Beaker, label: "Processing" },
  resulted: { color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle, label: "Resulted" },
};

export function LabResultsSystem() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredResults = MOCK_RESULTS.filter((result) => {
    const matchesSearch =
      result.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && result.orderStatus !== "resulted";
    if (activeTab === "abnormal") return matchesSearch && result.status !== "normal";
    return matchesSearch;
  });

  const pendingCount = MOCK_RESULTS.filter((r) => r.orderStatus !== "resulted").length;
  const abnormalCount = MOCK_RESULTS.filter((r) => r.status !== "normal").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Laboratory Results</h2>
          <p className="text-sm text-muted-foreground">View and track lab orders and results</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Results ({MOCK_RESULTS.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="abnormal" className="text-destructive">
            Abnormal ({abnormalCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredResults.map((result) => {
                const StatusIcon = statusConfig[result.status].icon;
                const OrderIcon = orderStatusConfig[result.orderStatus].icon;

                return (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <TestTube className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{result.testName}</h4>
                              <p className="text-sm text-muted-foreground">{result.category}</p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-4 text-sm">
                            <Badge variant="outline" className={orderStatusConfig[result.orderStatus].color}>
                              <OrderIcon className="h-3 w-3 mr-1" />
                              {orderStatusConfig[result.orderStatus].label}
                            </Badge>

                            {result.orderStatus === "resulted" && (
                              <Badge variant="outline" className={statusConfig[result.status].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[result.status].label}
                              </Badge>
                            )}

                            <span className="text-muted-foreground">
                              Ordered by {result.orderedBy}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          {result.orderStatus === "resulted" && result.value && (
                            <div className="mb-2">
                              <span className={`text-2xl font-bold ${
                                result.status === "critical" ? "text-destructive" :
                                result.status === "high" ? "text-amber-500" :
                                result.status === "low" ? "text-blue-500" : ""
                              }`}>
                                {result.value}
                              </span>
                              <span className="text-sm text-muted-foreground ml-1">{result.unit}</span>
                            </div>
                          )}
                          {result.referenceRange && (
                            <p className="text-xs text-muted-foreground">
                              Ref: {result.referenceRange} {result.unit}
                            </p>
                          )}
                          <Button variant="ghost" size="sm" className="mt-2">
                            <FileText className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
