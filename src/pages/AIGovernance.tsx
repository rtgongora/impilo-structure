import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Brain, Shield, Eye, AlertTriangle, CheckCircle, XCircle, BarChart3,
  Activity, Zap, Target, TrendingUp, Settings, FileText, Users, Clock,
  RefreshCw, Lock, Lightbulb, ThumbsUp, ThumbsDown, Info
} from "lucide-react";

const AI_CLASSES = [
  { id: "I1", label: "Insight Only", description: "Dashboards, trend surfacing, summarization, anomaly hints. No direct operational effect.", color: "bg-blue-500", icon: Eye, count: 23 },
  { id: "I2", label: "Recommendation + Human Action", description: "Claim triage, risk scoring, preauth prioritization, coding suggestions, outbreak hotspot recommendation. Human acceptance required.", color: "bg-amber-500", icon: Lightbulb, count: 14 },
  { id: "I3", label: "Governed Low-Risk Automation", description: "Queue routing, reminder prioritization, low-risk document classification, duplicate claim pre-screening. Explicit approval + monitoring + rollback.", color: "bg-purple-500", icon: Zap, count: 5 },
];

const SAMPLE_MODELS = [
  { id: "MDL-001", name: "Clinical Coding Assistant", version: "2.3.1", class: "I2", domain: "Claims", status: "approved", accuracy: 94.2, driftStatus: "stable", lastInference: "2 min ago", owner: "AI Platform Team" },
  { id: "MDL-002", name: "Duplicate Claim Detector", version: "1.8.0", class: "I3", domain: "Claims", status: "approved", accuracy: 97.1, driftStatus: "stable", lastInference: "5 min ago", owner: "Fraud Team" },
  { id: "MDL-003", name: "Outbreak Hotspot Predictor", version: "3.1.0", class: "I2", domain: "Public Health", status: "approved", accuracy: 88.5, driftStatus: "minor_drift", lastInference: "1 hr ago", owner: "Epidemiology Team" },
  { id: "MDL-004", name: "Patient Triage Prioritizer", version: "2.0.1", class: "I2", domain: "Clinical", status: "approved", accuracy: 91.7, driftStatus: "stable", lastInference: "30 sec ago", owner: "Clinical AI Team" },
  { id: "MDL-005", name: "Queue Routing Optimizer", version: "1.2.0", class: "I3", domain: "Operations", status: "approved", accuracy: 89.3, driftStatus: "stable", lastInference: "1 min ago", owner: "Operations Team" },
  { id: "MDL-006", name: "Fraud Anomaly Scorer", version: "4.0.0-beta", class: "I2", domain: "Financial", status: "pending_review", accuracy: 92.8, driftStatus: "n/a", lastInference: "never", owner: "Integrity Team" },
  { id: "MDL-007", name: "Clinical Note Summarizer", version: "1.5.2", class: "I1", domain: "Clinical", status: "approved", accuracy: 86.4, driftStatus: "stable", lastInference: "3 min ago", owner: "Clinical AI Team" },
  { id: "MDL-008", name: "Settlement Forecaster", version: "1.0.0", class: "I1", domain: "Financial", status: "withdrawn", accuracy: 74.2, driftStatus: "significant_drift", lastInference: "3 days ago", owner: "Finance Analytics" },
];

const SAMPLE_INFERENCES = [
  { id: "INF-001", model: "Clinical Coding Assistant", class: "I2", subject: "CLM-2026-00142", output: "Suggested ICD-11: 1A00 — Cholera", score: 0.94, confidence: 0.91, humanReview: true, accepted: true, actor: "Dr. Moyo", timestamp: "2026-03-10T08:42:15Z" },
  { id: "INF-002", model: "Duplicate Claim Detector", class: "I3", subject: "CLM-2026-00145", output: "Potential duplicate of CLM-2026-00089", score: 0.87, confidence: 0.82, humanReview: false, accepted: null, actor: "System", timestamp: "2026-03-10T08:45:00Z" },
  { id: "INF-003", model: "Patient Triage Prioritizer", class: "I2", subject: "CPID-abc123", output: "Priority: HIGH — suspected sepsis indicators", score: 0.96, confidence: 0.93, humanReview: true, accepted: true, actor: "Nurse Dube", timestamp: "2026-03-10T08:30:00Z" },
  { id: "INF-004", model: "Fraud Anomaly Scorer", class: "I2", subject: "PRV-00456", output: "Anomalous billing pattern detected", score: 0.78, confidence: 0.71, humanReview: true, accepted: null, actor: "Pending", timestamp: "2026-03-10T08:50:00Z" },
];

const SAMPLE_OVERRIDES = [
  { id: "OVR-001", model: "Clinical Coding Assistant", inference: "INF-005", reason: "AI suggested incorrect procedure code — manual review indicated J06.9", actor: "Dr. Chirwa", timestamp: "2026-03-09T14:20:00Z" },
  { id: "OVR-002", model: "Patient Triage Prioritizer", inference: "INF-012", reason: "Patient presenting with atypical symptoms not captured by model features", actor: "Nurse Moyo", timestamp: "2026-03-08T09:15:00Z" },
];

const driftBadge = (status: string) => {
  switch (status) {
    case "stable": return <Badge className="bg-green-100 text-green-700">Stable</Badge>;
    case "minor_drift": return <Badge className="bg-amber-100 text-amber-700">Minor Drift</Badge>;
    case "significant_drift": return <Badge className="bg-red-100 text-red-700">Significant Drift</Badge>;
    case "n/a": return <Badge variant="outline">N/A</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const statusBadge = (status: string) => {
  switch (status) {
    case "approved": return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
    case "pending_review": return <Badge className="bg-amber-100 text-amber-700">Pending Review</Badge>;
    case "withdrawn": return <Badge className="bg-red-100 text-red-700">Withdrawn</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AIGovernance() {
  return (
    <AppLayout title="Intelligence, Automation & AI">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Intelligence, Automation & AI Governance
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Governed platform capability — assistive by default, autonomous only by explicit approval in low-risk domains
            </p>
          </div>
        </div>

        {/* AI Class Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AI_CLASSES.map(cls => (
            <Card key={cls.id} className="border-l-4" style={{ borderLeftColor: cls.id === "I1" ? "#3b82f6" : cls.id === "I2" ? "#f59e0b" : "#8b5cf6" }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg ${cls.color} flex items-center justify-center`}>
                    <cls.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{cls.id}</Badge>
                      <span className="font-medium text-sm">{cls.label}</span>
                    </div>
                    <p className="text-2xl font-bold">{cls.count} models</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{cls.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Transparency Banner */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800">AI Transparency Rule:</span>
              <span className="text-amber-700">AI may not silently finalize high-risk clinical, enforcement, entitlement, claims, or settlement decisions without human-governed controls.</span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="models" className="space-y-4">
          <TabsList className="inline-flex w-max">
            <TabsTrigger value="models">Model Registry</TabsTrigger>
            <TabsTrigger value="inferences">Inference Records</TabsTrigger>
            <TabsTrigger value="overrides">Human Overrides</TabsTrigger>
            <TabsTrigger value="drift">Drift & Monitoring</TabsTrigger>
            <TabsTrigger value="insights">AI Insight Panels</TabsTrigger>
            <TabsTrigger value="events">AI Events</TabsTrigger>
          </TabsList>

          <TabsContent value="models">
            <Card>
              <CardHeader>
                <CardTitle>AI Model Registry & Governance</CardTitle>
                <CardDescription>Every production AI model must define: owner, approval status, approved uses, prohibited uses, drift threshold, rollback strategy, human oversight requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Drift</TableHead>
                      <TableHead>Last Inference</TableHead>
                      <TableHead>Owner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_MODELS.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs">{m.id}</TableCell>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell className="font-mono text-xs">{m.version}</TableCell>
                        <TableCell><Badge variant="outline" className="font-mono">{m.class}</Badge></TableCell>
                        <TableCell>{m.domain}</TableCell>
                        <TableCell>{statusBadge(m.status)}</TableCell>
                        <TableCell>{m.accuracy}%</TableCell>
                        <TableCell>{driftBadge(m.driftStatus)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.lastInference}</TableCell>
                        <TableCell className="text-xs">{m.owner}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inferences">
            <Card>
              <CardHeader>
                <CardTitle>Inference Records</CardTitle>
                <CardDescription>Every AI output used in workflow records: model/version, confidence, human acceptance/override, decision linkage</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Output</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Human Review</TableHead>
                      <TableHead>Accepted</TableHead>
                      <TableHead>Actor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_INFERENCES.map(inf => (
                      <TableRow key={inf.id}>
                        <TableCell className="font-mono text-xs">{inf.id}</TableCell>
                        <TableCell className="text-sm">{inf.model}</TableCell>
                        <TableCell><Badge variant="outline" className="font-mono">{inf.class}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{inf.subject}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{inf.output}</TableCell>
                        <TableCell>{inf.score.toFixed(2)}</TableCell>
                        <TableCell>{inf.confidence.toFixed(2)}</TableCell>
                        <TableCell>{inf.humanReview ? <Eye className="h-4 w-4 text-amber-500" /> : <Zap className="h-4 w-4 text-purple-500" />}</TableCell>
                        <TableCell>
                          {inf.accepted === true ? <ThumbsUp className="h-4 w-4 text-green-500" /> :
                           inf.accepted === false ? <ThumbsDown className="h-4 w-4 text-red-500" /> :
                           <Clock className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell className="text-xs">{inf.actor}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overrides">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Human Override Records</CardTitle>
                <CardDescription>All cases where a human overrode or rejected an AI recommendation</CardDescription>
              </CardHeader>
              <CardContent>
                {SAMPLE_OVERRIDES.map(ovr => (
                  <div key={ovr.id} className="p-4 border rounded-lg mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{ovr.id}</Badge>
                        <span className="font-medium">{ovr.model}</span>
                        <Badge className="bg-amber-100 text-amber-700">Overridden</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{ovr.timestamp}</span>
                    </div>
                    <p className="text-sm">{ovr.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">Override by: {ovr.actor} • Inference: {ovr.inference}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drift">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Drift Monitoring & Model Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SAMPLE_MODELS.filter(m => m.status === "approved").map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${m.driftStatus === "stable" ? "bg-green-500" : m.driftStatus === "minor_drift" ? "bg-amber-500" : "bg-red-500"}`} />
                        <div>
                          <p className="font-medium text-sm">{m.name} v{m.version}</p>
                          <p className="text-xs text-muted-foreground">{m.domain} • {m.class}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{m.accuracy}%</p>
                          <p className="text-xs text-muted-foreground">accuracy</p>
                        </div>
                        {driftBadge(m.driftStatus)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    AI Recommendation Card
                    <Badge variant="outline" className="font-mono text-xs">I2</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 border rounded-lg bg-amber-50/50 border-amber-200">
                    <p className="text-sm font-medium">Suggested: Increase malaria IRS coverage in Chipinge District</p>
                    <p className="text-xs text-muted-foreground mt-1">Model: Outbreak Hotspot Predictor v3.1.0 • Confidence: 88% • Score: 0.91</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" variant="outline" className="gap-1"><ThumbsUp className="h-3 w-3" /> Accept</Button>
                      <Button size="sm" variant="outline" className="gap-1"><ThumbsDown className="h-3 w-3" /> Reject</Button>
                      <Badge className="bg-amber-100 text-amber-700 text-xs">Human review required</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    AI Insight Panel
                    <Badge variant="outline" className="font-mono text-xs">I1</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 border rounded-lg bg-blue-50/50 border-blue-200">
                    <p className="text-sm font-medium">Settlement forecast: $3.2M expected next cycle</p>
                    <p className="text-xs text-muted-foreground mt-1">Model: Settlement Forecaster v1.0.0 • Informational only — no operational effect</p>
                    <Badge className="bg-blue-100 text-blue-700 text-xs mt-2">Insight only — no action required</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>AI Event Stream</CardTitle>
                <CardDescription>impilo.ai.model.approved.v1 / withdrawn.v1 / inference.recorded.v1 / alert.generated.v1 / override.recorded.v1 / drift.detected.v1</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { type: "impilo.ai.inference.recorded.v1", detail: "Clinical Coding Assistant → CLM-2026-00142", time: "2 min ago" },
                    { type: "impilo.ai.override.recorded.v1", detail: "Dr. Chirwa overrode coding suggestion", time: "15 min ago" },
                    { type: "impilo.ai.drift.detected.v1", detail: "Settlement Forecaster v1.0.0 — significant drift", time: "3 hrs ago" },
                    { type: "impilo.ai.model.withdrawn.v1", detail: "Settlement Forecaster v1.0.0 withdrawn", time: "3 hrs ago" },
                    { type: "impilo.ai.model.approved.v1", detail: "Fraud Anomaly Scorer v4.0.0 approved for production", time: "1 day ago" },
                    { type: "impilo.ai.alert.generated.v1", detail: "Anomalous billing pattern — PRV-00456", time: "1 day ago" },
                  ].map((evt, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{evt.type}</Badge>
                        <span>{evt.detail}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{evt.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
