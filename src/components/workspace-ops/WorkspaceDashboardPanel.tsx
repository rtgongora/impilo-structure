import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bed, Users, Package, DollarSign, AlertTriangle, TrendingUp,
  Clock, Activity, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight
} from "lucide-react";

// Mock dashboard data
const METRICS = {
  beds: { total: 120, occupied: 98, available: 18, cleaning: 4, occupancy: 82 },
  queues: { waiting: 34, inService: 12, avgWait: 23, completed: 87 },
  staff: { onShift: 28, offShift: 14, onBreak: 3, overtime: 2 },
  stock: { lowItems: 5, expiringSoon: 8, pendingOrders: 3, criticalOut: 1 },
  billing: { unbilled: 12, pendingClaims: 7, todayRevenue: 45200, outstanding: 128500 },
};

const ALERTS = [
  { id: 1, type: 'critical', message: 'ICU at 95% capacity – consider diversion', time: '5m ago' },
  { id: 2, type: 'warning', message: 'Paracetamol IV below reorder level (12 units)', time: '15m ago' },
  { id: 3, type: 'warning', message: '3 patients waiting >45min in General OPD', time: '20m ago' },
  { id: 4, type: 'info', message: 'Shift handover due in 35 minutes', time: '25m ago' },
  { id: 5, type: 'critical', message: 'Blood bank: O- stock critical (2 units)', time: '30m ago' },
];

const ACTIVITY_FEED = [
  { id: 1, action: 'Patient admitted', detail: 'Bed 4B, Medical Ward', actor: 'Sr. Moyo', time: '2m ago' },
  { id: 2, action: 'Stock received', detail: 'PO-20260406-0012 (Surgical supplies)', actor: 'Pharmacy', time: '8m ago' },
  { id: 3, action: 'Discharge completed', detail: 'Bed 2A, Pediatrics', actor: 'Dr. Nkomo', time: '12m ago' },
  { id: 4, action: 'Shift started', detail: 'Night shift – 14 staff checked in', actor: 'System', time: '30m ago' },
  { id: 5, action: 'Invoice generated', detail: 'INV-202604-000342 – R4,200', actor: 'Billing', time: '45m ago' },
];

export function WorkspaceDashboardPanel() {
  return (
    <div className="space-y-3">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard icon={Bed} label="Bed Occupancy" value={`${METRICS.beds.occupancy}%`} sub={`${METRICS.beds.occupied}/${METRICS.beds.total}`} trend="up" color="text-amber-500" />
        <MetricCard icon={Users} label="Queue Load" value={`${METRICS.queues.waiting}`} sub={`${METRICS.queues.avgWait}min avg wait`} trend="down" color="text-blue-500" />
        <MetricCard icon={Activity} label="Staff On Shift" value={`${METRICS.staff.onShift}`} sub={`${METRICS.staff.overtime} overtime`} color="text-green-500" />
        <MetricCard icon={Package} label="Stock Alerts" value={`${METRICS.stock.lowItems + METRICS.stock.criticalOut}`} sub={`${METRICS.stock.expiringSoon} expiring`} trend="up" color="text-red-500" />
        <MetricCard icon={DollarSign} label="Today Revenue" value={`R${(METRICS.billing.todayRevenue / 1000).toFixed(1)}k`} sub={`${METRICS.billing.unbilled} unbilled`} trend="up" color="text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Active Alerts
              <Badge variant="destructive" className="ml-auto text-xs">{ALERTS.filter(a => a.type === 'critical').length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ALERTS.map(alert => (
              <div key={alert.id} className={`text-xs p-2 rounded-lg border ${alert.type === 'critical' ? 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800' : alert.type === 'warning' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800' : 'border-border bg-muted/30'}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{alert.message}</span>
                  <span className="text-muted-foreground whitespace-nowrap">{alert.time}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ward Capacity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ward Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Medical Ward', occupied: 24, total: 28 },
              { name: 'Surgical Ward', occupied: 18, total: 22 },
              { name: 'ICU', occupied: 9, total: 10 },
              { name: 'Pediatrics', occupied: 14, total: 20 },
              { name: 'Maternity', occupied: 16, total: 20 },
              { name: 'Emergency', occupied: 17, total: 20 },
            ].map(ward => {
              const pct = Math.round((ward.occupied / ward.total) * 100);
              return (
                <div key={ward.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{ward.name}</span>
                    <span className="text-muted-foreground">{ward.occupied}/{ward.total} ({pct}%)</span>
                  </div>
                  <Progress value={pct} className={`h-1.5 ${pct > 90 ? '[&>div]:bg-red-500' : pct > 75 ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ACTIVITY_FEED.map(item => (
              <div key={item.id} className="flex items-start gap-2 text-xs p-2 rounded-lg hover:bg-muted/50">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium">{item.action}</p>
                  <p className="text-muted-foreground truncate">{item.detail} • {item.actor}</p>
                </div>
                <span className="text-muted-foreground whitespace-nowrap ml-auto">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, trend, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub: string;
  trend?: 'up' | 'down'; color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between mb-1">
          <Icon className={`h-4 w-4 ${color || 'text-muted-foreground'}`} />
          {trend && (trend === 'up'
            ? <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
            : <ArrowDownRight className="h-3.5 w-3.5 text-blue-500" />
          )}
        </div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
