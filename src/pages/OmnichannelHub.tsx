import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Smartphone, Globe, MessageSquare, Phone, Radio, PhoneCall,
  Users, Shield, ArrowUpRight, Clock, CheckCircle, AlertTriangle,
  Bot, User, Search, ChevronRight, BarChart3, Lock, Unlock,
  Volume2, Hash, Headphones, UserCheck, RefreshCw, Eye, EyeOff,
  Zap, Activity, TrendingUp, Settings, FileText,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ─── Mock Data ───────────────────────────────────────────────────────
const channelStats = [
  { channel: "Smartphone App", icon: Smartphone, sessions: 12450, active: 342, trust: "High", color: "text-blue-500" },
  { channel: "Web Portal", icon: Globe, sessions: 8920, active: 189, trust: "High", color: "text-indigo-500" },
  { channel: "SMS / USSD", icon: Hash, sessions: 34200, active: 1820, trust: "Low", color: "text-amber-500" },
  { channel: "WhatsApp", icon: MessageSquare, sessions: 21300, active: 890, trust: "Moderate", color: "text-green-500" },
  { channel: "IVR / Voice", icon: Phone, sessions: 9800, active: 210, trust: "Low", color: "text-purple-500" },
  { channel: "Call Centre", icon: Headphones, sessions: 4300, active: 67, trust: "High", color: "text-rose-500" },
  { channel: "Facility Desk", icon: UserCheck, sessions: 6700, active: 134, trust: "High", color: "text-teal-500" },
  { channel: "Community Worker", icon: Users, sessions: 3100, active: 48, trust: "Moderate", color: "text-orange-500" },
];

const channelSessions = [
  { id: "CS-001", channel: "USSD", user: "CPID-8827", started: "2026-03-10 08:12", intent: "Check appointment", status: "completed", trust: "Low", aiAssisted: true, escalated: false },
  { id: "CS-002", channel: "WhatsApp", user: "CPID-4421", started: "2026-03-10 08:15", intent: "Medication refill", status: "active", trust: "Moderate", aiAssisted: true, escalated: false },
  { id: "CS-003", channel: "IVR", user: "CPID-6632", started: "2026-03-10 08:18", intent: "Lab results", status: "escalated", trust: "Low", aiAssisted: true, escalated: true },
  { id: "CS-004", channel: "Call Centre", user: "CPID-1199", started: "2026-03-10 08:22", intent: "Claim status", status: "active", trust: "High", aiAssisted: false, escalated: false },
  { id: "CS-005", channel: "SMS", user: "CPID-7744", started: "2026-03-10 08:30", intent: "Appointment reminder ack", status: "completed", trust: "Low", aiAssisted: false, escalated: false },
  { id: "CS-006", channel: "Community Worker", user: "CPID-3356", started: "2026-03-10 08:35", intent: "Vaccination scheduling", status: "active", trust: "Moderate", aiAssisted: true, escalated: false },
  { id: "CS-007", channel: "Facility Desk", user: "CPID-9981", started: "2026-03-10 08:40", intent: "Eligibility check", status: "completed", trust: "High", aiAssisted: false, escalated: false },
  { id: "CS-008", channel: "USSD", user: "CPID-2210", started: "2026-03-10 08:45", intent: "Callback request", status: "pending-callback", trust: "Low", aiAssisted: true, escalated: true },
];

const smsJourneys = [
  { id: "SMS-J1", name: "Appointment Reminder", status: "active", sent: 12400, delivered: 11800, responded: 4200, language: "en/sn/nd" },
  { id: "SMS-J2", name: "Medication Adherence", status: "active", sent: 8900, delivered: 8500, responded: 2100, language: "en/sn" },
  { id: "SMS-J3", name: "Immunization Due", status: "active", sent: 5600, delivered: 5400, responded: 1800, language: "en/sn/nd" },
  { id: "SMS-J4", name: "Claim Status Notification", status: "active", sent: 3200, delivered: 3100, responded: 900, language: "en" },
  { id: "SMS-J5", name: "Outbreak Alert", status: "draft", sent: 0, delivered: 0, responded: 0, language: "en/sn/nd" },
];

const ussdMenus = [
  { code: "*123#", name: "Health Services Menu", steps: 4, completionRate: 72, dailyUse: 4200 },
  { code: "*123*1#", name: "Check Appointments", steps: 2, completionRate: 89, dailyUse: 1800 },
  { code: "*123*2#", name: "Request Refill", steps: 3, completionRate: 64, dailyUse: 900 },
  { code: "*123*3#", name: "Check Eligibility", steps: 2, completionRate: 81, dailyUse: 1100 },
  { code: "*123*4#", name: "Request Callback", steps: 2, completionRate: 91, dailyUse: 400 },
  { code: "*123*5#", name: "Facility Locator", steps: 3, completionRate: 76, dailyUse: 650 },
];

const ivrFlows = [
  { id: "IVR-1", name: "Main Health Menu", language: "en/sn/nd", avgDuration: "2:30", completionRate: 68, escalationRate: 12 },
  { id: "IVR-2", name: "Appointment Status", language: "en/sn/nd", avgDuration: "1:45", completionRate: 82, escalationRate: 8 },
  { id: "IVR-3", name: "Medication Refill", language: "en/sn", avgDuration: "3:10", completionRate: 54, escalationRate: 22 },
  { id: "IVR-4", name: "Claim Enquiry", language: "en", avgDuration: "4:20", completionRate: 41, escalationRate: 35 },
  { id: "IVR-5", name: "Emergency Guidance", language: "en/sn/nd", avgDuration: "1:15", completionRate: 90, escalationRate: 45 },
];

const callbackQueue = [
  { id: "CB-001", requestedAt: "08:45", channel: "USSD", cpid: "CPID-2210", reason: "Lab results enquiry", priority: "normal", status: "pending", language: "sn" },
  { id: "CB-002", requestedAt: "08:52", channel: "IVR", cpid: "CPID-6632", reason: "Escalation — sensitive result", priority: "high", status: "pending", language: "en" },
  { id: "CB-003", requestedAt: "09:01", channel: "WhatsApp", cpid: "CPID-8890", reason: "Claim dispute", priority: "normal", status: "assigned", language: "en" },
  { id: "CB-004", requestedAt: "09:15", channel: "SMS", cpid: "CPID-1122", reason: "Appointment change", priority: "low", status: "completed", language: "nd" },
];

const channelDisclosureRules = [
  { channel: "SMS", trustLevel: "Low", canDisclose: ["Reminders", "Generic status", "Facility info"], restricted: ["Lab results", "Diagnosis", "Financial details"], requiresStepUp: true },
  { channel: "USSD", trustLevel: "Low", canDisclose: ["Appointment times", "Queue position", "Generic status"], restricted: ["Clinical data", "Financial amounts"], requiresStepUp: true },
  { channel: "IVR", trustLevel: "Low", canDisclose: ["Appointment reminders", "Refill confirmations"], restricted: ["Test results", "Claim amounts", "Diagnoses"], requiresStepUp: true },
  { channel: "WhatsApp", trustLevel: "Moderate", canDisclose: ["Appointment details", "Medication names", "Queue updates"], restricted: ["Lab values", "Financial breakdowns"], requiresStepUp: true },
  { channel: "Web Portal", trustLevel: "High", canDisclose: ["Full clinical summary", "Financial details", "Lab results"], restricted: ["Break-glass records"], requiresStepUp: false },
  { channel: "Facility Desk", trustLevel: "High", canDisclose: ["Full clinical data", "Financial data", "Identity verification"], restricted: ["Cross-facility data without consent"], requiresStepUp: false },
];

const aiAgentSessions = [
  { id: "AI-001", channel: "WhatsApp", intent: "Refill request", confidence: 0.94, class: "I2", humanReview: false, status: "completed", language: "en" },
  { id: "AI-002", channel: "USSD", intent: "Appointment check", confidence: 0.98, class: "I1", humanReview: false, status: "completed", language: "sn" },
  { id: "AI-003", channel: "IVR", intent: "Lab result enquiry", confidence: 0.62, class: "I2", humanReview: true, status: "escalated", language: "en" },
  { id: "AI-004", channel: "WhatsApp", intent: "Claim status", confidence: 0.87, class: "I2", humanReview: false, status: "completed", language: "en" },
  { id: "AI-005", channel: "SMS", intent: "Emergency — chest pain", confidence: 0.95, class: "I1", humanReview: true, status: "escalated", language: "nd" },
  { id: "AI-006", channel: "Call Centre", intent: "Suggested reply — eligibility", confidence: 0.91, class: "I2", humanReview: false, status: "accepted", language: "en" },
];

function TrustBadge({ level }: { level: string }) {
  const config: Record<string, { color: string; icon: typeof Shield }> = {
    "Low": { color: "bg-amber-100 text-amber-800 border-amber-300", icon: Lock },
    "Moderate": { color: "bg-blue-100 text-blue-800 border-blue-300", icon: Shield },
    "High": { color: "bg-green-100 text-green-800 border-green-300", icon: Unlock },
  };
  const c = config[level] || config["Low"];
  return (
    <Badge variant="outline" className={`${c.color} text-[10px] font-medium gap-1`}>
      <c.icon className="h-3 w-3" />{level} Assurance
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "active": "bg-green-100 text-green-800",
    "completed": "bg-muted text-muted-foreground",
    "escalated": "bg-red-100 text-red-800",
    "pending-callback": "bg-amber-100 text-amber-800",
    "pending": "bg-amber-100 text-amber-800",
    "assigned": "bg-blue-100 text-blue-800",
    "draft": "bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={`${colors[status] || ""} text-[10px]`}>{status}</Badge>;
}

// ─── Channel Overview Dashboard ──────────────────────────────────────
function ChannelOverviewTab() {
  return (
    <div className="space-y-6">
      {/* Principle banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Omnichannel Access Principle</p>
              <p className="text-xs text-muted-foreground mt-1">
                No citizen, patient, client, member, caregiver, or household access model depends exclusively on smartphones, 
                high data availability, or persistent internet connectivity. Every channel is a legitimate front door to the platform.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {channelStats.map((ch) => (
          <Card key={ch.channel} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ch.icon className={`h-4 w-4 ${ch.color}`} />
                <span className="text-xs font-medium">{ch.channel}</span>
              </div>
              <div className="text-2xl font-bold">{ch.active.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">active now</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">{ch.sessions.toLocaleString()} total</span>
                <TrustBadge level={ch.trust} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent sessions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Channel Sessions</CardTitle>
          <CardDescription className="text-xs">Live omnichannel interactions across all access modes</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[320px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Session</TableHead>
                  <TableHead className="text-xs">Channel</TableHead>
                  <TableHead className="text-xs">Intent</TableHead>
                  <TableHead className="text-xs">Trust</TableHead>
                  <TableHead className="text-xs">AI</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelSessions.map((s) => (
                  <TableRow key={s.id} className="text-xs">
                    <TableCell className="font-mono text-[10px]">{s.id}</TableCell>
                    <TableCell>{s.channel}</TableCell>
                    <TableCell>{s.intent}</TableCell>
                    <TableCell><TrustBadge level={s.trust} /></TableCell>
                    <TableCell>
                      {s.aiAssisted ? (
                        <Badge variant="outline" className="bg-cyan-50 text-cyan-700 text-[10px] gap-1"><Bot className="h-3 w-3" />AI</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] gap-1"><User className="h-3 w-3" />Human</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                      {s.escalated && <ArrowUpRight className="h-3 w-3 text-red-500 inline ml-1" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── SMS Journeys Tab ────────────────────────────────────────────────
function SmsJourneysTab() {
  return (
    <div className="space-y-4">
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-3 flex items-center gap-2">
          <Hash className="h-4 w-4 text-amber-600" />
          <p className="text-xs text-amber-800">SMS operates at <strong>Low Assurance</strong>. Only generic reminders, confirmations, and non-sensitive status updates are disclosed. Sensitive data requires step-up to a higher-assurance channel.</p>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {smsJourneys.map((j) => (
          <Card key={j.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{j.name}</span>
                    <StatusBadge status={j.status} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Languages: {j.language}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Sent: {j.sent.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Delivered: {j.delivered.toLocaleString()}</div>
                  <div className="text-xs font-medium">Responded: {j.responded.toLocaleString()}</div>
                </div>
              </div>
              {j.sent > 0 && (
                <div className="mt-2">
                  <Progress value={(j.delivered / j.sent) * 100} className="h-1.5" />
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {((j.delivered / j.sent) * 100).toFixed(1)}% delivery rate
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── USSD Tab ────────────────────────────────────────────────────────
function UssdTab() {
  return (
    <div className="space-y-4">
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-3 flex items-center gap-2">
          <Phone className="h-4 w-4 text-amber-600" />
          <p className="text-xs text-amber-800">USSD works on any phone — no smartphone or data required. Sessions are short-lived (max ~180s). Designed for quick lookups and confirmations.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">USSD Menu Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Code</TableHead>
                <TableHead className="text-xs">Menu</TableHead>
                <TableHead className="text-xs">Steps</TableHead>
                <TableHead className="text-xs">Completion</TableHead>
                <TableHead className="text-xs">Daily Use</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ussdMenus.map((m) => (
                <TableRow key={m.code} className="text-xs">
                  <TableCell className="font-mono font-medium">{m.code}</TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.steps}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={m.completionRate} className="h-1.5 w-16" />
                      <span>{m.completionRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{m.dailyUse.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* USSD Flow Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">USSD Flow Preview — *123#</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 font-mono text-xs space-y-2 max-w-sm">
            <div className="border-b border-border pb-2">
              <p className="font-bold">Impilo Health Services</p>
              <p>Welcome. Choose an option:</p>
              <p>1. Appointments</p>
              <p>2. Medication Refill</p>
              <p>3. Check Eligibility</p>
              <p>4. Request Callback</p>
              <p>5. Find Nearest Facility</p>
            </div>
            <div className="text-muted-foreground">
              <p>→ User selects: 1</p>
            </div>
            <div className="border-b border-border pb-2">
              <p className="font-bold">Your Appointments</p>
              <p>1. Next: 12 Mar 09:00 — Dr Moyo, Parirenyatwa</p>
              <p>2. View all upcoming</p>
              <p>0. Back</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── IVR / Voice Tab ─────────────────────────────────────────────────
function IvrTab() {
  return (
    <div className="space-y-4">
      <Card className="border-purple-200 bg-purple-50/50">
        <CardContent className="py-3 flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-purple-600" />
          <p className="text-xs text-purple-800">IVR provides voice-guided access for users who cannot read or lack a smartphone. AI-powered speech understanding enables multilingual natural-language interaction. High escalation rates trigger callback routing.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">IVR Flow Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Flow</TableHead>
                <TableHead className="text-xs">Languages</TableHead>
                <TableHead className="text-xs">Avg Duration</TableHead>
                <TableHead className="text-xs">Completion</TableHead>
                <TableHead className="text-xs">Escalation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ivrFlows.map((f) => (
                <TableRow key={f.id} className="text-xs">
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell>{f.language}</TableCell>
                  <TableCell>{f.avgDuration}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={f.completionRate} className="h-1.5 w-16" />
                      <span>{f.completionRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${f.escalationRate > 20 ? "bg-red-50 text-red-700" : "bg-muted"}`}>
                      {f.escalationRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Callbacks & Escalation Tab ──────────────────────────────────────
function CallbacksTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{callbackQueue.filter(c => c.status === "pending").length}</div>
            <div className="text-xs text-muted-foreground">Pending Callbacks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{callbackQueue.filter(c => c.status === "assigned").length}</div>
            <div className="text-xs text-muted-foreground">Assigned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{callbackQueue.filter(c => c.status === "completed").length}</div>
            <div className="text-xs text-muted-foreground">Completed Today</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Callback & Escalation Queue</CardTitle>
          <CardDescription className="text-xs">Requests from low-assurance channels requiring human follow-up</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">ID</TableHead>
                <TableHead className="text-xs">Time</TableHead>
                <TableHead className="text-xs">Source</TableHead>
                <TableHead className="text-xs">Reason</TableHead>
                <TableHead className="text-xs">Priority</TableHead>
                <TableHead className="text-xs">Lang</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {callbackQueue.map((cb) => (
                <TableRow key={cb.id} className="text-xs">
                  <TableCell className="font-mono text-[10px]">{cb.id}</TableCell>
                  <TableCell>{cb.requestedAt}</TableCell>
                  <TableCell>{cb.channel}</TableCell>
                  <TableCell>{cb.reason}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${cb.priority === "high" ? "bg-red-50 text-red-700" : cb.priority === "low" ? "bg-muted" : "bg-amber-50 text-amber-700"}`}>
                      {cb.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{cb.language}</TableCell>
                  <TableCell><StatusBadge status={cb.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Disclosure & Trust Rules Tab ────────────────────────────────────
function DisclosureTab() {
  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Channel-Aware Trust & Disclosure</p>
              <p className="text-xs text-muted-foreground mt-1">
                Different channels have different trust and disclosure limits. Low-assurance channels handle only reminders and generic status. 
                Sensitive data requires step-up to a high-assurance channel or assisted mode.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {channelDisclosureRules.map((rule) => (
          <Card key={rule.channel}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{rule.channel}</span>
                  <TrustBadge level={rule.trustLevel} />
                </div>
                {rule.requiresStepUp && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px] gap-1">
                    <ArrowUpRight className="h-3 w-3" />Step-up required for sensitive data
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-green-700 mb-1 flex items-center gap-1"><Eye className="h-3 w-3" />Can Disclose</p>
                  <ul className="space-y-0.5">
                    {rule.canDisclose.map((item) => (
                      <li key={item} className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="h-2.5 w-2.5 text-green-500" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-red-700 mb-1 flex items-center gap-1"><EyeOff className="h-3 w-3" />Restricted</p>
                  <ul className="space-y-0.5">
                    {rule.restricted.map((item) => (
                      <li key={item} className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5 text-red-500" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── AI Agent Sessions Tab ───────────────────────────────────────────
function AiAgentTab() {
  return (
    <div className="space-y-4">
      <Card className="border-cyan-200 bg-cyan-50/50">
        <CardContent className="py-3 flex items-start gap-2">
          <Bot className="h-4 w-4 text-cyan-600 mt-0.5" />
          <div>
            <p className="text-xs text-cyan-800">
              <strong>Governed AI Agent</strong> — interprets user intent across channels, guides next steps in simple language, 
              supports multilingual interaction, and escalates to a human when needed. AI never silently discloses sensitive data 
              or finalizes high-risk actions.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{aiAgentSessions.length}</div>
            <div className="text-xs text-muted-foreground">AI Sessions Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{aiAgentSessions.filter(a => a.humanReview).length}</div>
            <div className="text-xs text-muted-foreground">Human Review Required</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {(aiAgentSessions.reduce((s, a) => s + a.confidence, 0) / aiAgentSessions.length * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Confidence</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">AI Agent Interaction Log</CardTitle>
          <CardDescription className="text-xs">AI-assisted omnichannel sessions with governance classification</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">ID</TableHead>
                <TableHead className="text-xs">Channel</TableHead>
                <TableHead className="text-xs">Intent</TableHead>
                <TableHead className="text-xs">Confidence</TableHead>
                <TableHead className="text-xs">Class</TableHead>
                <TableHead className="text-xs">Review</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aiAgentSessions.map((a) => (
                <TableRow key={a.id} className="text-xs">
                  <TableCell className="font-mono text-[10px]">{a.id}</TableCell>
                  <TableCell>{a.channel}</TableCell>
                  <TableCell>{a.intent}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${a.confidence >= 0.9 ? "bg-green-50 text-green-700" : a.confidence >= 0.7 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                      {(a.confidence * 100).toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] bg-cyan-50 text-cyan-700">{a.class}</Badge>
                  </TableCell>
                  <TableCell>
                    {a.humanReview ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 text-[10px] gap-1"><User className="h-3 w-3" />Required</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 text-[10px]">Auto</Badge>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
const OmnichannelHub = () => {
  return (
    <AppLayout title="Experience, Omnichannel & Access">
      <Tabs defaultValue="overview" className="p-4 space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="overview">Channel Overview</TabsTrigger>
            <TabsTrigger value="sms">SMS Journeys</TabsTrigger>
            <TabsTrigger value="ussd">USSD</TabsTrigger>
            <TabsTrigger value="ivr">IVR / Voice</TabsTrigger>
            <TabsTrigger value="callbacks">Callbacks & Escalation</TabsTrigger>
            <TabsTrigger value="disclosure">Trust & Disclosure</TabsTrigger>
            <TabsTrigger value="ai-agent">AI Agent</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview"><ChannelOverviewTab /></TabsContent>
        <TabsContent value="sms"><SmsJourneysTab /></TabsContent>
        <TabsContent value="ussd"><UssdTab /></TabsContent>
        <TabsContent value="ivr"><IvrTab /></TabsContent>
        <TabsContent value="callbacks"><CallbacksTab /></TabsContent>
        <TabsContent value="disclosure"><DisclosureTab /></TabsContent>
        <TabsContent value="ai-agent"><AiAgentTab /></TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default OmnichannelHub;
