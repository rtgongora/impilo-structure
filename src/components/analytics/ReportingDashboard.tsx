import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Bed,
  Calendar,
  DollarSign,
  Activity,
  Clock,
  FileText,
  Download,
  RefreshCw,
  Filter,
  ChevronUp,
  ChevronDown,
  Stethoscope,
  Syringe,
  Building2,
  HeartPulse
} from "lucide-react";

// Mock data for charts
const patientVisitsData = [
  { month: "Jan", outpatient: 1420, inpatient: 320, emergency: 180 },
  { month: "Feb", outpatient: 1380, inpatient: 290, emergency: 210 },
  { month: "Mar", outpatient: 1650, inpatient: 340, emergency: 190 },
  { month: "Apr", outpatient: 1520, inpatient: 310, emergency: 220 },
  { month: "May", outpatient: 1780, inpatient: 380, emergency: 175 },
  { month: "Jun", outpatient: 1620, inpatient: 350, emergency: 195 },
  { month: "Jul", outpatient: 1890, inpatient: 410, emergency: 230 },
  { month: "Aug", outpatient: 1750, inpatient: 390, emergency: 215 },
  { month: "Sep", outpatient: 1680, inpatient: 360, emergency: 200 },
  { month: "Oct", outpatient: 1920, inpatient: 420, emergency: 245 },
  { month: "Nov", outpatient: 1850, inpatient: 400, emergency: 225 },
  { month: "Dec", outpatient: 1560, inpatient: 340, emergency: 180 },
];

const revenueData = [
  { month: "Jan", revenue: 245000, collections: 198000, outstanding: 47000 },
  { month: "Feb", revenue: 238000, collections: 210000, outstanding: 75000 },
  { month: "Mar", revenue: 289000, collections: 245000, outstanding: 119000 },
  { month: "Apr", revenue: 265000, collections: 230000, outstanding: 154000 },
  { month: "May", revenue: 312000, collections: 280000, outstanding: 186000 },
  { month: "Jun", revenue: 298000, collections: 265000, outstanding: 219000 },
];

const departmentData = [
  { name: "General Medicine", value: 35, color: "#3B82F6" },
  { name: "Surgery", value: 20, color: "#10B981" },
  { name: "Pediatrics", value: 15, color: "#F59E0B" },
  { name: "Obstetrics", value: 12, color: "#EC4899" },
  { name: "Emergency", value: 10, color: "#EF4444" },
  { name: "Others", value: 8, color: "#6B7280" },
];

const bedOccupancyData = [
  { ward: "General Ward", total: 40, occupied: 32, available: 8 },
  { ward: "ICU", total: 12, occupied: 10, available: 2 },
  { ward: "Maternity", total: 20, occupied: 14, available: 6 },
  { ward: "Pediatric", total: 15, occupied: 9, available: 6 },
  { ward: "Surgery", total: 25, occupied: 20, available: 5 },
];

const diagnosisData = [
  { name: "Malaria", count: 456, trend: "down", change: -12 },
  { name: "Hypertension", count: 389, trend: "up", change: 8 },
  { name: "Diabetes", count: 312, trend: "up", change: 15 },
  { name: "Respiratory Infections", count: 287, trend: "down", change: -5 },
  { name: "Trauma", count: 234, trend: "stable", change: 2 },
  { name: "GI Disorders", count: 198, trend: "up", change: 10 },
];

const waitTimeData = [
  { hour: "8AM", avg: 15 },
  { hour: "9AM", avg: 25 },
  { hour: "10AM", avg: 35 },
  { hour: "11AM", avg: 42 },
  { hour: "12PM", avg: 28 },
  { hour: "1PM", avg: 20 },
  { hour: "2PM", avg: 32 },
  { hour: "3PM", avg: 38 },
  { hour: "4PM", avg: 25 },
  { hour: "5PM", avg: 18 },
];

export function ReportingDashboard() {
  const [dateRange, setDateRange] = useState("month");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const kpiCards = [
    { 
      title: "Total Patients", 
      value: "12,847", 
      change: "+12%", 
      trend: "up", 
      icon: Users,
      color: "bg-blue-500"
    },
    { 
      title: "Bed Occupancy", 
      value: "78%", 
      change: "+5%", 
      trend: "up", 
      icon: Bed,
      color: "bg-purple-500"
    },
    { 
      title: "Avg Wait Time", 
      value: "28 min", 
      change: "-15%", 
      trend: "down", 
      icon: Clock,
      color: "bg-orange-500"
    },
    { 
      title: "Revenue MTD", 
      value: "$312K", 
      change: "+18%", 
      trend: "up", 
      icon: DollarSign,
      color: "bg-green-500"
    },
    { 
      title: "Appointments Today", 
      value: "156", 
      change: "+8%", 
      trend: "up", 
      icon: Calendar,
      color: "bg-cyan-500"
    },
    { 
      title: "Surgeries MTD", 
      value: "89", 
      change: "+22%", 
      trend: "up", 
      icon: Stethoscope,
      color: "bg-red-500"
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Analytics & Reports</h1>
              <p className="text-sm text-muted-foreground">Real-time operational insights and KPIs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {kpiCards.map((kpi) => (
            <Card key={kpi.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${kpi.color}`}>
                    <kpi.icon className="w-4 h-4 text-white" />
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      kpi.trend === "up" ? "text-green-600" : 
                      kpi.trend === "down" ? "text-red-600" : ""
                    }`}
                  >
                    {kpi.trend === "up" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {kpi.change}
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clinical">Clinical</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="operational">Operational</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Patient Visits Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Patient Visits Trend</CardTitle>
                  <CardDescription>Monthly breakdown by visit type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={patientVisitsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="outpatient" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Outpatient" />
                      <Area type="monotone" dataKey="inpatient" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Inpatient" />
                      <Area type="monotone" dataKey="emergency" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Emergency" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Department Distribution</CardTitle>
                  <CardDescription>Patient volume by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Bed Occupancy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bed Occupancy by Ward</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={bedOccupancyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="ward" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="occupied" stackId="a" fill="#3B82F6" name="Occupied" />
                    <Bar dataKey="available" stackId="a" fill="#E5E7EB" name="Available" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clinical Tab */}
          <TabsContent value="clinical" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Top Diagnoses */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Diagnoses</CardTitle>
                  <CardDescription>Most common conditions this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {diagnosisData.map((diagnosis, index) => (
                      <div key={diagnosis.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}</span>
                          <div>
                            <p className="font-medium">{diagnosis.name}</p>
                            <p className="text-sm text-muted-foreground">{diagnosis.count} cases</p>
                          </div>
                        </div>
                        <Badge 
                          variant="secondary"
                          className={
                            diagnosis.trend === "up" ? "text-red-600" :
                            diagnosis.trend === "down" ? "text-green-600" : ""
                          }
                        >
                          {diagnosis.trend === "up" ? <TrendingUp className="w-3 h-3 mr-1" /> :
                           diagnosis.trend === "down" ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
                          {diagnosis.change > 0 ? "+" : ""}{diagnosis.change}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Wait Times */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Average Wait Times</CardTitle>
                  <CardDescription>By hour of day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={waitTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} min`, "Avg Wait"]} />
                      <Line type="monotone" dataKey="avg" stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Clinical Metrics */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <HeartPulse className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold">98.2%</p>
                  <p className="text-sm text-muted-foreground">Patient Satisfaction</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Syringe className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">4.2 days</p>
                  <p className="text-sm text-muted-foreground">Avg Length of Stay</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">2.1%</p>
                  <p className="text-sm text-muted-foreground">Readmission Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">99.1%</p>
                  <p className="text-sm text-muted-foreground">Med Admin Accuracy</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue & Collections</CardTitle>
                <CardDescription>Monthly financial performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                    <Bar dataKey="collections" fill="#10B981" name="Collections" />
                    <Bar dataKey="outstanding" fill="#F59E0B" name="Outstanding" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="w-8 h-8 text-green-500" />
                    <Badge className="bg-green-100 text-green-800">+18%</Badge>
                  </div>
                  <p className="text-3xl font-bold">$1.89M</p>
                  <p className="text-sm text-muted-foreground">Total Revenue YTD</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                    <Badge className="bg-blue-100 text-blue-800">85%</Badge>
                  </div>
                  <p className="text-3xl font-bold">$1.61M</p>
                  <p className="text-sm text-muted-foreground">Collections YTD</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Clock className="w-8 h-8 text-orange-500" />
                    <Badge className="bg-orange-100 text-orange-800">32 days</Badge>
                  </div>
                  <p className="text-3xl font-bold">$286K</p>
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Operational Tab */}
          <TabsContent value="operational" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Staff Productivity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Physicians</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: "85%" }} />
                        </div>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Nurses</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: "92%" }} />
                        </div>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lab Technicians</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: "78%" }} />
                        </div>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pharmacy</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: "88%" }} />
                        </div>
                        <span className="text-sm font-medium">88%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resource Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Operating Theatres</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: "72%" }} />
                        </div>
                        <span className="text-sm font-medium">72%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Imaging Equipment</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500" style={{ width: "65%" }} />
                        </div>
                        <span className="text-sm font-medium">65%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lab Equipment</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: "81%" }} />
                        </div>
                        <span className="text-sm font-medium">81%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Ambulances</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500" style={{ width: "45%" }} />
                        </div>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}
