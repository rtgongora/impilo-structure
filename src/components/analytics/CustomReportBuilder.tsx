import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import {
  FileBarChart,
  GripVertical,
  Plus,
  X,
  Table,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
  Download,
  Save,
  Play,
  Settings,
  Filter,
  Columns,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataField {
  id: string;
  name: string;
  type: "dimension" | "measure";
  dataType: "string" | "number" | "date";
  category: string;
}

interface ReportConfig {
  name: string;
  chartType: "table" | "bar" | "line" | "pie";
  columns: string[];
  filters: { field: string; operator: string; value: string }[];
  groupBy: string | null;
  sortBy: string | null;
  sortOrder: "asc" | "desc";
}

const AVAILABLE_FIELDS: DataField[] = [
  // Patient dimensions
  { id: "patient_name", name: "Patient Name", type: "dimension", dataType: "string", category: "Patient" },
  { id: "patient_age", name: "Age", type: "measure", dataType: "number", category: "Patient" },
  { id: "patient_gender", name: "Gender", type: "dimension", dataType: "string", category: "Patient" },
  { id: "patient_location", name: "Location", type: "dimension", dataType: "string", category: "Patient" },
  // Encounter dimensions
  { id: "encounter_type", name: "Encounter Type", type: "dimension", dataType: "string", category: "Encounter" },
  { id: "encounter_date", name: "Encounter Date", type: "dimension", dataType: "date", category: "Encounter" },
  { id: "department", name: "Department", type: "dimension", dataType: "string", category: "Encounter" },
  { id: "provider", name: "Provider", type: "dimension", dataType: "string", category: "Encounter" },
  { id: "diagnosis", name: "Primary Diagnosis", type: "dimension", dataType: "string", category: "Encounter" },
  // Measures
  { id: "visit_count", name: "Visit Count", type: "measure", dataType: "number", category: "Metrics" },
  { id: "total_charges", name: "Total Charges", type: "measure", dataType: "number", category: "Metrics" },
  { id: "avg_wait_time", name: "Avg Wait Time", type: "measure", dataType: "number", category: "Metrics" },
  { id: "los_days", name: "Length of Stay", type: "measure", dataType: "number", category: "Metrics" },
];

const MOCK_PREVIEW_DATA = [
  { department: "General Medicine", visit_count: 450, total_charges: 125000, avg_wait_time: 28 },
  { department: "Surgery", visit_count: 120, total_charges: 340000, avg_wait_time: 42 },
  { department: "Pediatrics", visit_count: 280, total_charges: 85000, avg_wait_time: 22 },
  { department: "Obstetrics", visit_count: 95, total_charges: 145000, avg_wait_time: 35 },
  { department: "Emergency", visit_count: 380, total_charges: 210000, avg_wait_time: 15 },
];

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export function CustomReportBuilder() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ReportConfig>({
    name: "Untitled Report",
    chartType: "bar",
    columns: ["department", "visit_count", "total_charges"],
    filters: [],
    groupBy: "department",
    sortBy: "visit_count",
    sortOrder: "desc"
  });
  const [draggedField, setDraggedField] = useState<string | null>(null);

  const handleAddColumn = (fieldId: string) => {
    if (!config.columns.includes(fieldId)) {
      setConfig(prev => ({ ...prev, columns: [...prev.columns, fieldId] }));
    }
  };

  const handleRemoveColumn = (fieldId: string) => {
    setConfig(prev => ({ ...prev, columns: prev.columns.filter(c => c !== fieldId) }));
  };

  const handleAddFilter = () => {
    setConfig(prev => ({
      ...prev,
      filters: [...prev.filters, { field: "department", operator: "equals", value: "" }]
    }));
  };

  const handleRunReport = () => {
    toast({
      title: "Report Generated",
      description: "Your custom report has been generated with mock data",
    });
  };

  const handleSaveReport = () => {
    toast({
      title: "Report Saved",
      description: `"${config.name}" has been saved to your reports`,
    });
  };

  const renderChart = () => {
    switch (config.chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={MOCK_PREVIEW_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              {config.columns.filter(c => AVAILABLE_FIELDS.find(f => f.id === c)?.type === "measure").map((col, idx) => (
                <Bar key={col} dataKey={col} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={MOCK_PREVIEW_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              {config.columns.filter(c => AVAILABLE_FIELDS.find(f => f.id === c)?.type === "measure").map((col, idx) => (
                <Line key={col} type="monotone" dataKey={col} stroke={CHART_COLORS[idx % CHART_COLORS.length]} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={MOCK_PREVIEW_DATA}
                dataKey="visit_count"
                nameKey="department"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {MOCK_PREVIEW_DATA.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case "table":
      default:
        return (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {config.columns.map(col => (
                    <th key={col} className="px-4 py-2 text-left font-medium">
                      {AVAILABLE_FIELDS.find(f => f.id === col)?.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_PREVIEW_DATA.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    {config.columns.map(col => (
                      <td key={col} className="px-4 py-2">
                        {row[col as keyof typeof row]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  const groupedFields = AVAILABLE_FIELDS.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, DataField[]>);

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Left Panel - Field Selector */}
      <div className="col-span-3 border-r">
        <Card className="h-full">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Columns className="h-4 w-4" />
              Available Fields
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {Object.entries(groupedFields).map(([category, fields]) => (
                <div key={category} className="px-4 pb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{category}</p>
                  <div className="space-y-1">
                    {fields.map(field => (
                      <div
                        key={field.id}
                        draggable
                        onDragStart={() => setDraggedField(field.id)}
                        onDragEnd={() => setDraggedField(null)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md text-sm cursor-grab hover:bg-muted transition-colors",
                          config.columns.includes(field.id) && "bg-primary/10"
                        )}
                        onClick={() => handleAddColumn(field.id)}
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                        <span className="flex-1">{field.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {field.type === "measure" ? "#" : "Aa"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Center Panel - Report Canvas */}
      <div className="col-span-6">
        <Card className="h-full">
          <CardHeader className="py-3 border-b">
            <div className="flex items-center justify-between">
              <Input
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0"
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSaveReport}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" onClick={handleRunReport}>
                  <Play className="h-4 w-4 mr-1" />
                  Run Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Selected Columns */}
            <div className="mb-4">
              <Label className="text-xs text-muted-foreground mb-2 block">Selected Columns</Label>
              <div 
                className="min-h-[48px] border-2 border-dashed rounded-lg p-2 flex flex-wrap gap-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => draggedField && handleAddColumn(draggedField)}
              >
                {config.columns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Drag fields here or click to add</p>
                ) : (
                  config.columns.map(col => (
                    <Badge key={col} variant="secondary" className="gap-1">
                      {AVAILABLE_FIELDS.find(f => f.id === col)?.name}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleRemoveColumn(col)}
                      />
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Chart Type Selector */}
            <div className="flex items-center gap-2 mb-4">
              <Label className="text-xs text-muted-foreground">Chart Type:</Label>
              <div className="flex gap-1">
                {[
                  { type: "table", icon: Table },
                  { type: "bar", icon: BarChart3 },
                  { type: "line", icon: LineChartIcon },
                  { type: "pie", icon: PieChartIcon },
                ].map(({ type, icon: Icon }) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={config.chartType === type ? "secondary" : "ghost"}
                    onClick={() => setConfig(prev => ({ ...prev, chartType: type as any }))}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-3">Preview (Mock Data)</p>
              {renderChart()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Configuration */}
      <div className="col-span-3">
        <Card className="h-full">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Group By */}
            <div>
              <Label className="text-xs">Group By</Label>
              <Select 
                value={config.groupBy || ""} 
                onValueChange={(v) => setConfig(prev => ({ ...prev, groupBy: v || null }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {AVAILABLE_FIELDS.filter(f => f.type === "dimension").map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <Label className="text-xs">Sort By</Label>
              <div className="flex gap-2 mt-1">
                <Select 
                  value={config.sortBy || ""} 
                  onValueChange={(v) => setConfig(prev => ({ ...prev, sortBy: v || null }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {config.columns.map(col => (
                      <SelectItem key={col} value={col}>
                        {AVAILABLE_FIELDS.find(f => f.id === col)?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={config.sortOrder} 
                  onValueChange={(v) => setConfig(prev => ({ ...prev, sortOrder: v as "asc" | "desc" }))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Desc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filters */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Filters
                </Label>
                <Button size="sm" variant="ghost" onClick={handleAddFilter}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {config.filters.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No filters applied</p>
                ) : (
                  config.filters.map((filter, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs">
                      <Select 
                        value={filter.field}
                        onValueChange={(v) => {
                          const newFilters = [...config.filters];
                          newFilters[idx].field = v;
                          setConfig(prev => ({ ...prev, filters: newFilters }));
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_FIELDS.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input 
                        placeholder="Value" 
                        className="h-8 text-xs"
                        value={filter.value}
                        onChange={(e) => {
                          const newFilters = [...config.filters];
                          newFilters[idx].value = e.target.value;
                          setConfig(prev => ({ ...prev, filters: newFilters }));
                        }}
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => {
                          setConfig(prev => ({ 
                            ...prev, 
                            filters: prev.filters.filter((_, i) => i !== idx) 
                          }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Export */}
            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
