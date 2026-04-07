import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bed, Users, Package, DollarSign, AlertTriangle, TrendingUp,
  Clock, Activity, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight,
  UserX, FlaskConical, HeartPulse, CalendarX, Siren, ListChecks,
  Stethoscope, Home, Wifi
} from "lucide-react";

// ── Care-point–aware data sets ──

type CarePoint = 'outpatient' | 'inpatient' | 'community' | 'virtual' | undefined;

const CARE_POINT_LABEL: Record<string, string> = {
  outpatient: 'Outpatient',
  inpatient: 'Inpatient',
  community: 'Community',
  virtual: 'Virtual',
};

// Metrics per care point — undefined = aggregate of all
function getMetrics(cp: CarePoint) {
  if (cp === 'outpatient') return {
    beds: null,
    queues: { waiting: 34, inService: 12, avgWait: 23, completed: 87, longestWait: 58 },
    staff: { onShift: 16, offShift: 8, onBreak: 2, overtime: 1 },
    stock: { lowItems: 3, expiringSoon: 5, pendingOrders: 2, criticalOut: 0 },
    billing: { unbilled: 8, pendingClaims: 4, todayRevenue: 22600, outstanding: 64000 },
    patients: { lostToFollowUp: 9, criticalResults: 4, overdueTasks: 5, pendingDischarges: 0, readmissions30d: 0, missedAppointments: 8, activeCarePlans: 28, avgLOS: null },
  };
  if (cp === 'inpatient') return {
    beds: { total: 120, occupied: 98, available: 18, cleaning: 4, occupancy: 82 },
    queues: { waiting: 6, inService: 4, avgWait: 18, completed: 14, longestWait: 35 },
    staff: { onShift: 22, offShift: 10, onBreak: 2, overtime: 2 },
    stock: { lowItems: 4, expiringSoon: 6, pendingOrders: 3, criticalOut: 1 },
    billing: { unbilled: 12, pendingClaims: 5, todayRevenue: 38400, outstanding: 98000 },
    patients: { lostToFollowUp: 2, criticalResults: 6, overdueTasks: 7, pendingDischarges: 5, readmissions30d: 3, missedAppointments: 1, activeCarePlans: 34, avgLOS: 4.2 },
  };
  if (cp === 'community') return {
    beds: null,
    queues: { waiting: 8, inService: 3, avgWait: 45, completed: 22, longestWait: 120 },
    staff: { onShift: 12, offShift: 6, onBreak: 1, overtime: 0 },
    stock: { lowItems: 2, expiringSoon: 3, pendingOrders: 1, criticalOut: 0 },
    billing: { unbilled: 3, pendingClaims: 1, todayRevenue: 4200, outstanding: 12000 },
    patients: { lostToFollowUp: 14, criticalResults: 1, overdueTasks: 12, pendingDischarges: 0, readmissions30d: 0, missedAppointments: 11, activeCarePlans: 56, avgLOS: null },
  };
  if (cp === 'virtual') return {
    beds: null,
    queues: { waiting: 4, inService: 6, avgWait: 8, completed: 18, longestWait: 22 },
    staff: { onShift: 5, offShift: 3, onBreak: 0, overtime: 0 },
    stock: null,
    billing: { unbilled: 2, pendingClaims: 2, todayRevenue: 6800, outstanding: 18500 },
    patients: { lostToFollowUp: 3, criticalResults: 0, overdueTasks: 2, pendingDischarges: 0, readmissions30d: 0, missedAppointments: 4, activeCarePlans: 15, avgLOS: null },
  };
  // Aggregate (landing)
  return {
    beds: { total: 120, occupied: 98, available: 18, cleaning: 4, occupancy: 82 },
    queues: { waiting: 34, inService: 12, avgWait: 23, completed: 87, longestWait: 58 },
    staff: { onShift: 28, offShift: 14, onBreak: 3, overtime: 2 },
    stock: { lowItems: 5, expiringSoon: 8, pendingOrders: 3, criticalOut: 1 },
    billing: { unbilled: 12, pendingClaims: 7, todayRevenue: 45200, outstanding: 128500 },
    patients: { lostToFollowUp: 14, criticalResults: 6, overdueTasks: 9, pendingDischarges: 5, readmissions30d: 3, missedAppointments: 11, activeCarePlans: 42, avgLOS: 4.2 },
  };
}

function getAlerts(cp: CarePoint) {
  const ALL = [
    { id: 1, type: 'critical', message: 'ICU at 95% capacity – consider diversion', time: '5m ago', contexts: ['inpatient'] },
    { id: 2, type: 'critical', message: '6 critical lab results pending review', time: '8m ago', contexts: ['inpatient', 'outpatient'] },
    { id: 3, type: 'warning', message: 'Paracetamol IV below reorder level (12 units)', time: '15m ago', contexts: ['inpatient', 'outpatient'] },
    { id: 4, type: 'warning', message: '3 patients waiting >45min in General OPD', time: '20m ago', contexts: ['outpatient'] },
    { id: 5, type: 'critical', message: 'Blood bank: O- stock critical (2 units)', time: '30m ago', contexts: ['inpatient'] },
    { id: 6, type: 'warning', message: '14 patients lost to follow-up this month', time: '1h ago', contexts: ['community', 'outpatient'] },
    { id: 7, type: 'warning', message: '4 teleconsult no-shows today', time: '35m ago', contexts: ['virtual'] },
    { id: 8, type: 'warning', message: 'CHW coverage gap in Ward 12 – 3 households unvisited', time: '2h ago', contexts: ['community'] },
  ];
  if (!cp) return ALL;
  return ALL.filter(a => a.contexts.includes(cp));
}

function getActivityFeed(cp: CarePoint) {
  const ALL = [
    { id: 1, action: 'Patient admitted', detail: 'Bed 4B, Medical Ward', actor: 'Sr. Moyo', time: '2m ago', contexts: ['inpatient'] },
    { id: 2, action: 'Critical result flagged', detail: 'K+ 6.8 mEq/L – Bed 2C ICU', actor: 'Lab', time: '5m ago', contexts: ['inpatient'] },
    { id: 3, action: 'Stock received', detail: 'PO-20260406-0012 (Surgical supplies)', actor: 'Pharmacy', time: '8m ago', contexts: ['inpatient', 'outpatient'] },
    { id: 4, action: 'Discharge completed', detail: 'Bed 2A, Pediatrics', actor: 'Dr. Nkomo', time: '12m ago', contexts: ['inpatient'] },
    { id: 5, action: 'Missed appointment', detail: 'HIV Clinic – 3 no-shows today', actor: 'System', time: '25m ago', contexts: ['outpatient'] },
    { id: 6, action: 'Shift started', detail: 'Night shift – 14 staff checked in', actor: 'System', time: '30m ago', contexts: ['inpatient', 'outpatient'] },
    { id: 7, action: 'Teleconsult completed', detail: 'Dr. Phiri → Patient #4821', actor: 'Virtual', time: '10m ago', contexts: ['virtual'] },
    { id: 8, action: 'Home visit logged', detail: 'Ward 8, 4 households', actor: 'CHW Banda', time: '18m ago', contexts: ['community'] },
    { id: 9, action: 'Defaulter traced', detail: 'ART patient returned – Ward 5', actor: 'CHW Dube', time: '40m ago', contexts: ['community'] },
    { id: 10, action: 'OPD queue cleared', detail: 'General OPD – 0 waiting', actor: 'System', time: '15m ago', contexts: ['outpatient'] },
  ];
  if (!cp) return ALL.slice(0, 6);
  return ALL.filter(a => a.contexts.includes(cp)).slice(0, 6);
}

function getWards(cp: CarePoint) {
  const ALL = [
    { name: 'Medical Ward', occupied: 24, total: 28 },
    { name: 'Surgical Ward', occupied: 18, total: 22 },
    { name: 'ICU', occupied: 9, total: 10 },
    { name: 'Pediatrics', occupied: 14, total: 20 },
    { name: 'Maternity', occupied: 16, total: 20 },
    { name: 'Emergency', occupied: 17, total: 20 },
  ];
  if (cp === 'outpatient') return []; // No ward capacity for OPD
  if (cp === 'community' || cp === 'virtual') return [];
  return ALL;
}

function getQueuePerformance(cp: CarePoint) {
  const outpatient = [
    { name: 'General OPD', waiting: 12, avgWait: 28, inService: 4 },
    { name: 'ANC Clinic', waiting: 5, avgWait: 15, inService: 2 },
    { name: 'HIV Clinic', waiting: 8, avgWait: 35, inService: 3 },
    { name: 'Pharmacy', waiting: 6, avgWait: 12, inService: 2 },
    { name: 'Lab Reception', waiting: 3, avgWait: 18, inService: 1 },
  ];
  const inpatient = [
    { name: 'Theatre Pre-Op', waiting: 2, avgWait: 40, inService: 1 },
    { name: 'Dialysis', waiting: 3, avgWait: 25, inService: 2 },
    { name: 'Recovery', waiting: 1, avgWait: 15, inService: 1 },
  ];
  const community = [
    { name: 'Outreach Queue', waiting: 8, avgWait: 45, inService: 3 },
    { name: 'Home Visit Pool', waiting: 5, avgWait: 60, inService: 2 },
  ];
  const virtual = [
    { name: 'Teleconsult Queue', waiting: 4, avgWait: 8, inService: 6 },
    { name: 'Async Review', waiting: 3, avgWait: 120, inService: 2 },
  ];
  if (cp === 'outpatient') return outpatient;
  if (cp === 'inpatient') return inpatient;
  if (cp === 'community') return community;
  if (cp === 'virtual') return virtual;
  return outpatient; // aggregate defaults to OPD view
}

function getWardPerformance(cp: CarePoint) {
  return [
    { name: 'Medical Ward', avgLOS: 5.2, discharges: 3, admissions: 4, pendingDischarge: 2 },
    { name: 'Surgical Ward', avgLOS: 3.8, discharges: 2, admissions: 1, pendingDischarge: 1 },
    { name: 'ICU', avgLOS: 8.1, discharges: 0, admissions: 1, pendingDischarge: 0 },
    { name: 'Pediatrics', avgLOS: 2.9, discharges: 4, admissions: 2, pendingDischarge: 3 },
    { name: 'Maternity', avgLOS: 2.1, discharges: 5, admissions: 3, pendingDischarge: 1 },
  ];
}

// ── Component ──

export function WorkspaceDashboardPanel({ carePoint }: { carePoint?: string }) {
  const cp = carePoint as CarePoint;
  const M = getMetrics(cp);
  const alerts = getAlerts(cp);
  const activity = getActivityFeed(cp);
  const wards = getWards(cp);
  const queuePerf = getQueuePerformance(cp);
  const wardPerf = getWardPerformance(cp);
  const showBeds = !!M.beds;
  const showStock = !!M.stock;
  const showWardCapacity = wards.length > 0;
  const showWardPerformance = cp === 'inpatient' || (!cp);
  const contextLabel = cp ? CARE_POINT_LABEL[cp] : 'All Services';

  return (
    <div className="space-y-4">
      {/* Context Badge */}
      {cp && (
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="text-xs">{contextLabel} Dashboard</Badge>
        </div>
      )}

      {/* Row 1: Operational KPIs */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Operations</h3>
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${showBeds && showStock ? '5' : showStock ? '4' : showBeds ? '4' : '3'} gap-3`}>
          {showBeds && (
            <MetricCard icon={Bed} label="Bed Occupancy" value={`${M.beds!.occupancy}%`} sub={`${M.beds!.occupied}/${M.beds!.total} beds`} trend="up" color="text-amber-600" />
          )}
          <MetricCard icon={Users} label="Queue Load" value={`${M.queues.waiting}`} sub={`${M.queues.avgWait}min avg · ${M.queues.longestWait}min max`} trend="down" color="text-blue-600" />
          <MetricCard icon={Activity} label="Staff On Shift" value={`${M.staff.onShift}`} sub={`${M.staff.overtime} overtime`} color="text-green-600" />
          {showStock && (
            <MetricCard icon={Package} label="Stock Alerts" value={`${M.stock!.lowItems + M.stock!.criticalOut}`} sub={`${M.stock!.expiringSoon} expiring soon`} trend="up" color="text-red-600" />
          )}
          <MetricCard icon={DollarSign} label="Today Revenue" value={`R${(M.billing.todayRevenue / 1000).toFixed(1)}k`} sub={`${M.billing.unbilled} unbilled charges`} trend="up" color="text-emerald-600" />
        </div>
      </div>

      {/* Row 2: Patient Care KPIs */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Patient Care</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard icon={UserX} label="Lost to Follow-Up" value={`${M.patients.lostToFollowUp}`} sub="This month · needs outreach" trend={M.patients.lostToFollowUp > 5 ? "up" : undefined} color="text-orange-600" highlight={M.patients.lostToFollowUp > 5} />
          <MetricCard icon={FlaskConical} label="Critical Results" value={`${M.patients.criticalResults}`} sub="Pending clinician review" trend={M.patients.criticalResults > 0 ? "up" : undefined} color="text-red-600" highlight={M.patients.criticalResults > 3} />
          <MetricCard icon={CalendarX} label="Missed Appointments" value={`${M.patients.missedAppointments}`} sub={`Today · ${contextLabel.toLowerCase()}`} color="text-amber-600" />
          <MetricCard icon={ListChecks} label="Active Care Plans" value={`${M.patients.activeCarePlans}`} sub={`${M.patients.overdueTasks} overdue tasks`} color="text-indigo-600" />
          {M.patients.avgLOS !== null ? (
            <MetricCard icon={HeartPulse} label="Avg Length of Stay" value={`${M.patients.avgLOS}d`} sub={`${M.patients.readmissions30d} readmissions (30d)`} color="text-purple-600" />
          ) : (
            <MetricCard icon={CheckCircle2} label="Completed Today" value={`${M.queues.completed}`} sub={`${M.queues.inService} currently serving`} color="text-purple-600" />
          )}
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Active Alerts
              <Badge variant="destructive" className="ml-auto text-xs">{alerts.filter(a => a.type === 'critical').length} critical</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {alerts.map(alert => (
                <div key={alert.id} className={`text-sm p-3 rounded-lg border ${alert.type === 'critical' ? 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800' : 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{alert.message}</span>
                    <span className="text-muted-foreground whitespace-nowrap text-xs">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom 3-column grid: Ward Capacity / Queue or Ward Perf / Activity */}
      <div className={`grid grid-cols-1 ${showWardCapacity ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-3`}>
        {/* Ward Capacity — only for inpatient / aggregate */}
        {showWardCapacity && (
          <Card className="flex flex-col">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                Ward Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 px-4 pb-4 space-y-3">
              {wards.map(ward => {
                const pct = Math.round((ward.occupied / ward.total) * 100);
                return (
                  <div key={ward.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{ward.name}</span>
                      <span className="text-muted-foreground text-xs">{ward.occupied}/{ward.total} ({pct}%)</span>
                    </div>
                    <Progress value={pct} className={`h-2 ${pct > 90 ? '[&>div]:bg-red-500' : pct > 75 ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Context-aware middle panel */}
        {showWardPerformance ? (
          <Card className="flex flex-col">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                Ward Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 px-4 pb-4 space-y-3">
              {wardPerf.map(w => (
                <div key={w.name} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                  <div>
                    <span className="font-medium">{w.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">LOS {w.avgLOS}d</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-green-600">{w.discharges}↑</span>
                      <span className="text-xs text-blue-600">{w.admissions}↓</span>
                    </div>
                  </div>
                  {w.pendingDischarge > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {w.pendingDischarge} pending d/c
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="flex flex-col">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Queue Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 px-4 pb-4 space-y-3">
              {queuePerf.map(q => (
                <div key={q.name} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                  <div>
                    <span className="font-medium">{q.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{q.waiting} waiting</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{q.inService} serving</span>
                    </div>
                  </div>
                  <Badge variant={q.avgWait > 30 ? "destructive" : q.avgWait > 20 ? "secondary" : "outline"} className="text-xs">
                    {q.avgWait}min
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Activity Feed */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 px-4 pb-4 space-y-1">
            {activity.length > 0 ? activity.map(item => (
              <div key={item.id} className="flex items-start gap-3 text-sm p-2.5 rounded-lg hover:bg-muted/50">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.action}</p>
                  <p className="text-muted-foreground truncate text-xs">{item.detail} · {item.actor}</p>
                </div>
                <span className="text-muted-foreground whitespace-nowrap text-xs">{item.time}</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, trend, color, highlight }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub: string;
  trend?: 'up' | 'down'; color?: string; highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-orange-200 dark:border-orange-800' : ''}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between mb-1.5">
          <Icon className={`h-5 w-5 ${color || 'text-muted-foreground'}`} />
          {trend && (trend === 'up'
            ? <ArrowUpRight className="h-4 w-4 text-red-500" />
            : <ArrowDownRight className="h-4 w-4 text-green-500" />
          )}
        </div>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{sub}</p>
        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">{label}</p>
      </CardContent>
    </Card>
  );
}
