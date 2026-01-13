import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCostRates, useCostEvents, useVisitCostSummaries } from "@/hooks/useCostEngine";
import { 
  Calculator,
  Clock,
  Search,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Activity,
  RefreshCw,
  BarChart3,
  Layers
} from "lucide-react";
import { format } from "date-fns";

export function CostTrackingDashboard() {
  const { rates, loading: ratesLoading, refetch: refetchRates } = useCostRates();
  const { events, loading: eventsLoading, totals, refetch: refetchEvents } = useCostEvents();
  const { summaries, loading: summariesLoading, refetch: refetchSummaries } = useVisitCostSummaries();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const loading = ratesLoading || eventsLoading || summariesLoading;
  const refetch = () => {
    refetchRates();
    refetchEvents();
    refetchSummaries();
  };

  // Stats
  const totalCostEvents = events.length;
  const totalInternalCost = totals.total;
  const avgCostPerEvent = totalCostEvents > 0 ? totalInternalCost / totalCostEvents : 0;

  // Group rates by category
  const ratesByCategory = rates.reduce((acc, rate) => {
    const cat = rate.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(rate);
    return acc;
  }, {} as Record<string, typeof rates>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "staff_time":
        return <Users className="h-4 w-4" />;
      case "consumables":
        return <Package className="h-4 w-4" />;
      case "equipment_depreciation":
        return <Activity className="h-4 w-4" />;
      case "facility_overhead":
        return <Layers className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "staff_time":
        return "bg-primary/10 text-primary";
      case "consumables":
        return "bg-success/10 text-success";
      case "equipment_depreciation":
        return "bg-warning/10 text-warning";
      case "facility_overhead":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredRates = rates.filter(rate => {
    const matchesSearch = 
      rate.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || rate.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.event_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all";
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost Rates</p>
                <p className="text-2xl font-bold">{rates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost Events</p>
                <p className="text-2xl font-bold">{totalCostEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Internal Cost</p>
                <p className="text-2xl font-bold">${totalInternalCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Cost/Event</p>
                <p className="text-2xl font-bold">${avgCostPerEvent.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="events">Cost Events</TabsTrigger>
            <TabsTrigger value="rates">Cost Rates</TabsTrigger>
            <TabsTrigger value="summaries">Visit Summaries</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="staff_time">Staff Time</SelectItem>
              <SelectItem value="consumables">Consumables</SelectItem>
              <SelectItem value="equipment_depreciation">Equipment</SelectItem>
              <SelectItem value="facility_overhead">Overhead</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cost Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Cost Events</CardTitle>
              <CardDescription>TDABC cost accrual events</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead className="text-right">Duration (min)</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : filteredEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No cost events found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium capitalize">{event.event_type.replace("_", " ")}</TableCell>
                          <TableCell className="text-muted-foreground">{event.source_entity_type}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(event.event_timestamp), "dd MMM HH:mm")}
                          </TableCell>
                          <TableCell className="text-right">{event.duration_minutes || "-"}</TableCell>
                          <TableCell className="text-right font-medium">${event.total_internal_cost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Rates Tab */}
        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cost Rate Reference</CardTitle>
              <CardDescription>TDABC cost driver rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-6">
                  {Object.entries(ratesByCategory).map(([category, categoryRates]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={getCategoryColor(category)}>
                          {getCategoryIcon(category)}
                          <span className="ml-1 capitalize">{category.replace("_", " ")}</span>
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ({categoryRates.length} rates)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryRates.map((rate) => (
                          <div
                            key={rate.id}
                            className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium capitalize">{rate.resource_type.replace("_", " ")}</p>
                              <Badge variant="outline">{rate.category}</Badge>
                            </div>
                            <p className="text-2xl font-bold">
                              {rate.currency} {rate.cost_per_unit.toFixed(2)}
                              <span className="text-sm font-normal text-muted-foreground">
                                /{rate.unit_of_measure}
                              </span>
                            </p>
                            {rate.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{rate.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visit Summaries Tab */}
        <TabsContent value="summaries">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visit Cost Summaries</CardTitle>
              <CardDescription>Aggregated costs by visit</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visit ID</TableHead>
                      <TableHead className="text-right">Staff</TableHead>
                      <TableHead className="text-right">Consumables</TableHead>
                      <TableHead className="text-right">Equipment</TableHead>
                      <TableHead className="text-right">Overhead</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summariesLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : summaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No visit summaries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      summaries.map((summary) => (
                        <TableRow key={summary.id}>
                          <TableCell className="font-medium">{summary.visit_id.slice(0, 8)}...</TableCell>
                          <TableCell className="text-right">${(summary.total_staff_cost || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">${(summary.total_consumables_cost || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">${(summary.total_equipment_cost || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">${(summary.total_overhead_cost || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold">${(summary.grand_total_cost || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {summary.last_calculated_at ? format(new Date(summary.last_calculated_at), "dd MMM HH:mm") : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}