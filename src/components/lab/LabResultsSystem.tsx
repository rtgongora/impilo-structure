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
  Loader2,
} from "lucide-react";
import { useLabResults, LabResult } from "@/hooks/useLabData";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
  normal: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: Minus, label: "Normal" },
  high: { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: TrendingUp, label: "High" },
  low: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: TrendingDown, label: "Low" },
  critical: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle, label: "Critical" },
};

const orderStatusConfig = {
  pending: { color: "bg-muted text-muted-foreground", icon: Clock, label: "Pending" },
  collected: { color: "bg-blue-500/10 text-blue-500", icon: TestTube, label: "Collected" },
  processing: { color: "bg-amber-500/10 text-amber-500", icon: Beaker, label: "Processing" },
  resulted: { color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle, label: "Resulted" },
  completed: { color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle, label: "Completed" },
};

interface LabResultsSystemProps {
  encounterId?: string;
}

export function LabResultsSystem({ encounterId }: LabResultsSystemProps) {
  const { results, loading } = useLabResults(encounterId);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const getResultStatus = (result: LabResult): keyof typeof statusConfig => {
    if (result.is_critical) return "critical";
    if (result.is_abnormal) return "high"; // simplified - could be high or low
    return "normal";
  };

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (result.category || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && result.status !== "completed";
    if (activeTab === "abnormal") return matchesSearch && (result.is_abnormal || result.is_critical);
    return matchesSearch;
  });

  const pendingCount = results.filter((r) => r.status !== "completed").length;
  const abnormalCount = results.filter((r) => r.is_abnormal || r.is_critical).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

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
          <TabsTrigger value="all">All Results ({results.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="abnormal" className="text-destructive">
            Abnormal ({abnormalCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredResults.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TestTube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No lab results found</p>
                </div>
              ) : (
                filteredResults.map((result) => {
                  const resultStatus = getResultStatus(result);
                  const StatusIcon = statusConfig[resultStatus].icon;
                  const orderStatus = orderStatusConfig[result.status as keyof typeof orderStatusConfig] || orderStatusConfig.pending;
                  const OrderIcon = orderStatus.icon;

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
                                <h4 className="font-medium">{result.test_name}</h4>
                                <p className="text-sm text-muted-foreground">{result.category || "General"}</p>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-4 text-sm">
                              <Badge variant="outline" className={orderStatus.color}>
                                <OrderIcon className="h-3 w-3 mr-1" />
                                {orderStatus.label}
                              </Badge>

                              {result.status === "completed" && result.result_value && (
                                <Badge variant="outline" className={statusConfig[resultStatus].color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[resultStatus].label}
                                </Badge>
                              )}

                              {result.test_code && (
                                <span className="text-muted-foreground">
                                  Code: {result.test_code}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            {result.result_value && (
                              <div className="mb-2">
                                <span className={`text-2xl font-bold ${
                                  result.is_critical ? "text-destructive" :
                                  result.is_abnormal ? "text-amber-500" : ""
                                }`}>
                                  {result.result_value}
                                </span>
                                <span className="text-sm text-muted-foreground ml-1">{result.result_unit}</span>
                              </div>
                            )}
                            {result.reference_range && (
                              <p className="text-xs text-muted-foreground">
                                Ref: {result.reference_range} {result.result_unit}
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
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
