import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLabOrders, useLabResults } from "@/hooks/useLabData";
import { useLabCriticalAlerts } from "@/hooks/lims/useLabCriticalAlerts";
import { LabOrderEntryForm } from "./LabOrderEntryForm";
import { LabAnalyzerDashboard } from "./LabAnalyzerDashboard";
import { LabCriticalAlertsDashboard } from "./LabCriticalAlertsDashboard";
import { LabResultValidationWorkflow } from "./LabResultValidationWorkflow";
import { SpecimenChainOfCustody } from "./SpecimenChainOfCustody";
import {
  FlaskConical,
  TestTube,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Activity,
  Bell,
  ClipboardCheck,
  Package,
} from "lucide-react";

export function LIMSIntegration() {
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useLabOrders();
  const { results, loading: resultsLoading } = useLabResults();
  const { stats: alertStats } = useLabCriticalAlerts();
  const loading = ordersLoading || resultsLoading;

  const stats = {
    pending: orders.filter(o => o.status === "pending").length,
    inProgress: orders.filter(o => o.status === "in_progress").length,
    completed: orders.filter(o => o.status === "completed").length,
    critical: results.filter(r => r.is_critical).length,
  };

  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laboratory Information System</h1>
          <p className="text-muted-foreground">Orders, specimens, results, QC & analyzer management</p>
        </div>
        <div className="flex items-center gap-2">
          {alertStats.pending > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <Bell className="h-3 w-3 mr-1" />
              {alertStats.pending} Critical
            </Badge>
          )}
          <Button variant="outline" onClick={() => refetchOrders()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
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
              {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.pending}</p>}
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
              {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.inProgress}</p>}
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
              {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.completed}</p>}
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
              {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.critical}</p>}
              <p className="text-xs text-muted-foreground">Critical Results</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="orders" className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Order Entry
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center gap-1">
            <ClipboardCheck className="h-4 w-4" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="analyzers" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Analyzers & QC
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            Critical Alerts
            {alertStats.pending > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {alertStats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="specimens" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            Specimens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <LabOrderEntryForm
            patientId=""
            patientName="Select Patient"
            onOrderCreated={() => refetchOrders()}
          />
        </TabsContent>

        <TabsContent value="validation" className="mt-6">
          <LabResultValidationWorkflow />
        </TabsContent>

        <TabsContent value="analyzers" className="mt-6">
          <LabAnalyzerDashboard />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <LabCriticalAlertsDashboard />
        </TabsContent>

        <TabsContent value="specimens" className="mt-6">
          <SpecimenChainOfCustody />
        </TabsContent>
      </Tabs>
    </div>
  );
}
