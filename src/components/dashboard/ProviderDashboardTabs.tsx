import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  ClipboardList,
  Send,
  TestTube2,
  AlertCircle,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ImageIcon,
  Pill,
  Video,
  FileText,
} from "lucide-react";
import type {
  DashboardOrder,
  DashboardReferral,
  DashboardResult,
  AggregateStats,
} from "@/hooks/useDashboardData";

interface ProviderDashboardTabsProps {
  orders: DashboardOrder[];
  referrals: DashboardReferral[];
  results: DashboardResult[];
  stats: AggregateStats;
  loading: boolean;
}

export function ProviderDashboardTabs({
  orders,
  referrals,
  results,
  stats,
  loading,
}: ProviderDashboardTabsProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case "lab":
        return <TestTube2 className="h-4 w-4 text-primary" />;
      case "imaging":
        return <ImageIcon className="h-4 w-4 text-info" />;
      case "medication":
        return <Pill className="h-4 w-4 text-success" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">In Progress</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Completed</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-info/10 text-info border-info/30">Accepted</Badge>;
      case "final":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Final</Badge>;
      case "preliminary":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Preliminary</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "stat":
      case "emergency":
        return <Badge variant="destructive">STAT</Badge>;
      case "urgent":
        return <Badge className="bg-warning text-warning-foreground">Urgent</Badge>;
      default:
        return <Badge variant="secondary">Routine</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "stat":
      case "critical":
        return <Badge variant="destructive">STAT</Badge>;
      case "urgent":
      case "high":
        return <Badge className="bg-warning text-warning-foreground">Urgent</Badge>;
      default:
        return <Badge variant="secondary">Routine</Badge>;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Clinical Overview — All Patients</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <ClipboardList className="h-4 w-4" />
              <span>{stats.pendingOrders} orders</span>
            </div>
            <div className="flex items-center gap-1">
              <Send className="h-4 w-4" />
              <span>{stats.activeReferrals} referrals</span>
            </div>
            <div className="flex items-center gap-1">
              <TestTube2 className="h-4 w-4" />
              <span>{stats.pendingResults} results</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Orders
              {stats.pendingOrders > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {stats.pendingOrders}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Consults & Referrals
              {stats.activeReferrals > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {stats.activeReferrals}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <TestTube2 className="h-4 w-4" />
              Results
              {stats.pendingResults > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {stats.pendingResults}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-0">
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {loading ? (
                  [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending orders for your patients</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => order.encounterId && navigate(`/encounter/${order.encounterId}?section=orders`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getOrderTypeIcon(order.orderType)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{order.orderName}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.patientName} • {order.patientMrn}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getPriorityBadge(order.priority)}
                        {getStatusBadge(order.status)}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {order.orderedAt}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            {orders.length > 0 && (
              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button variant="outline" size="sm" onClick={() => navigate("/orders")}>
                  View All Orders
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="mt-0">
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {loading ? (
                  [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : referrals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active referrals or consults</p>
                  </div>
                ) : (
                  referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {referral.referralType === "teleconsult" ? (
                            <Video className="h-4 w-4 text-info" />
                          ) : (
                            <Send className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{referral.patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {referral.specialty} • {referral.patientMrn}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getUrgencyBadge(referral.urgency)}
                        {getStatusBadge(referral.status)}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {referral.createdAt}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            {referrals.length > 0 && (
              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button variant="outline" size="sm">
                  View All Consults
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="mt-0">
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {loading ? (
                  [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : results.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TestTube2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending results</p>
                  </div>
                ) : (
                  results.map((result) => (
                    <div
                      key={result.id}
                      className={`flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors ${
                        result.isCritical ? "border-destructive/50 bg-destructive/5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${result.isCritical ? "bg-destructive/10" : "bg-muted"}`}>
                          <TestTube2 className={`h-4 w-4 ${result.isCritical ? "text-destructive" : "text-primary"}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{result.testName}</p>
                            {result.isCritical && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Critical
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {result.patientName} • {result.patientMrn}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(result.status)}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {result.reportedAt}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            {results.length > 0 && (
              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button variant="outline" size="sm">
                  View All Results
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
