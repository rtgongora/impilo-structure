import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload, Package, Shield, FileText, Search, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  ziboListArtifacts, ziboCreateDraftArtifact, ziboPublishArtifact, ziboDeprecateArtifact, ziboRetireArtifact,
  ziboUpdateDraftArtifact, ziboImportFhirBundle, ziboImportCsvCodelist,
  ziboListPacks, ziboCreateDraftPack, ziboUpdateDraftPack, ziboPublishPack,
  ziboListAssignments, ziboCreateAssignment, ziboGetEffectiveAssignment,
  ziboGetValidationLogs, ziboValidateCoding, ziboMapCode,
  type ZiboArtifact, type ZiboPack, type ZiboAssignment, type ZiboValidationLog,
} from "@/lib/kernel/zibo/ziboClient";

const statusColor: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PUBLISHED: "bg-primary/20 text-primary",
  DEPRECATED: "bg-yellow-500/20 text-yellow-700",
  RETIRED: "bg-destructive/20 text-destructive",
};

export default function ZiboAdmin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("artifacts");

  // Artifacts
  const [artifacts, setArtifacts] = useState<ZiboArtifact[]>([]);
  const [artFilter, setArtFilter] = useState("");
  const [artStatusFilter, setArtStatusFilter] = useState<string>("");
  const [editingArt, setEditingArt] = useState<ZiboArtifact | null>(null);
  const [newArt, setNewArt] = useState({ fhir_type: "CodeSystem", canonical_url: "", version: "1.0.0", content_json: "{}" });

  // Import
  const [bundleJson, setBundleJson] = useState("");
  const [csvCodes, setCsvCodes] = useState("");
  const [csvName, setCsvName] = useState("");
  const [csvSystem, setCsvSystem] = useState("");
  const [csvVersion, setCsvVersion] = useState("1.0.0");
  const [csvCreateVs, setCsvCreateVs] = useState(true);

  // Packs
  const [packs, setPacks] = useState<ZiboPack[]>([]);
  const [newPack, setNewPack] = useState({ pack_id: "", name: "", version: "1.0.0" });

  // Assignments
  const [assignments, setAssignments] = useState<ZiboAssignment[]>([]);
  const [newAssign, setNewAssign] = useState({ scope_type: "FACILITY", scope_id: "", pack_id: "", pack_version: "", policy_mode: "STRICT" });
  const [effectiveResult, setEffectiveResult] = useState<unknown>(null);
  const [effectiveFacility, setEffectiveFacility] = useState("");
  const [effectiveWorkspace, setEffectiveWorkspace] = useState("");

  // Validation logs
  const [logs, setLogs] = useState<ZiboValidationLog[]>([]);
  const [logFilter, setLogFilter] = useState({ facility_id: "", service_name: "" });

  // Dev console
  const [devSystem, setDevSystem] = useState("");
  const [devCode, setDevCode] = useState("");
  const [devResult, setDevResult] = useState<unknown>(null);
  const [mapSource, setMapSource] = useState({ system: "", code: "", target: "" });
  const [mapResult, setMapResult] = useState<unknown>(null);

  const loadArtifacts = async () => {
    try {
      const res = await ziboListArtifacts(artStatusFilter || undefined);
      setArtifacts(res.artifacts);
    } catch (e: unknown) { toast.error((e as Error).message); }
  };

  const loadPacks = async () => {
    try {
      const res = await ziboListPacks();
      setPacks(res.packs);
    } catch (e: unknown) { toast.error((e as Error).message); }
  };

  const loadAssignments = async () => {
    try {
      const res = await ziboListAssignments();
      setAssignments(res.assignments);
    } catch (e: unknown) { toast.error((e as Error).message); }
  };

  const loadLogs = async () => {
    try {
      const res = await ziboGetValidationLogs(undefined, logFilter.facility_id || undefined, logFilter.service_name || undefined, 50);
      setLogs(res.logs);
    } catch (e: unknown) { toast.error((e as Error).message); }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">ZIBO — Terminology Governance</h1>
          <p className="text-sm text-muted-foreground">Artifact lifecycle, packs, assignments, validation observability</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="artifacts"><FileText className="h-3 w-3 mr-1" />Artifacts</TabsTrigger>
          <TabsTrigger value="import"><Upload className="h-3 w-3 mr-1" />Import</TabsTrigger>
          <TabsTrigger value="packs"><Package className="h-3 w-3 mr-1" />Packs</TabsTrigger>
          <TabsTrigger value="assignments"><Shield className="h-3 w-3 mr-1" />Assign</TabsTrigger>
          <TabsTrigger value="logs"><AlertTriangle className="h-3 w-3 mr-1" />Logs</TabsTrigger>
          <TabsTrigger value="dev"><Search className="h-3 w-3 mr-1" />Dev</TabsTrigger>
        </TabsList>

        {/* ─── ARTIFACTS TAB ─── */}
        <TabsContent value="artifacts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Create DRAFT Artifact</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <Select value={newArt.fhir_type} onValueChange={v => setNewArt(p => ({ ...p, fhir_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["CodeSystem","ValueSet","ConceptMap","NamingSystem","StructureDefinition","ImplementationGuide","Bundle","Parameters"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="canonical_url" value={newArt.canonical_url} onChange={e => setNewArt(p => ({ ...p, canonical_url: e.target.value }))} />
                <Input placeholder="version" value={newArt.version} onChange={e => setNewArt(p => ({ ...p, version: e.target.value }))} />
              </div>
              <Textarea placeholder='content_json (FHIR resource JSON)' value={newArt.content_json} onChange={e => setNewArt(p => ({ ...p, content_json: e.target.value }))} rows={4} />
              <Button onClick={async () => {
                try {
                  let parsed;
                  try { parsed = JSON.parse(newArt.content_json); } catch { toast.error("Invalid JSON"); return; }
                  await ziboCreateDraftArtifact({ fhir_type: newArt.fhir_type, canonical_url: newArt.canonical_url, version: newArt.version, content_json: parsed });
                  toast.success("DRAFT artifact created"); loadArtifacts();
                } catch (e: unknown) { toast.error((e as Error).message); }
              }}>Create DRAFT</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Artifacts</CardTitle>
                <div className="flex gap-2">
                  <Select value={artStatusFilter} onValueChange={v => setArtStatusFilter(v === "ALL" ? "" : v)}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="DRAFT">DRAFT</SelectItem>
                      <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                      <SelectItem value="DEPRECATED">DEPRECATED</SelectItem>
                      <SelectItem value="RETIRED">RETIRED</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={loadArtifacts}>Load</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {artifacts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No artifacts loaded. Click Load.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {artifacts.filter(a => !artFilter || a.canonical_url.includes(artFilter)).map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.canonical_url}</p>
                        <p className="text-xs text-muted-foreground">{a.fhir_type} · v{a.version} · {a.hash?.substring(0, 12)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColor[a.status]}>{a.status}</Badge>
                        {a.status === "DRAFT" && (
                          <>
                            <Button size="sm" variant="outline" onClick={async () => { try { await ziboPublishArtifact(a.id); toast.success("Published"); loadArtifacts(); } catch (e: unknown) { toast.error((e as Error).message); } }}>Publish</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingArt(a)}>Edit</Button>
                          </>
                        )}
                        {a.status === "PUBLISHED" && (
                          <Button size="sm" variant="outline" onClick={async () => { try { await ziboDeprecateArtifact(a.id); toast.success("Deprecated"); loadArtifacts(); } catch (e: unknown) { toast.error((e as Error).message); } }}>Deprecate</Button>
                        )}
                        {a.status === "DEPRECATED" && (
                          <Button size="sm" variant="destructive" onClick={async () => { try { await ziboRetireArtifact(a.id); toast.success("Retired"); loadArtifacts(); } catch (e: unknown) { toast.error((e as Error).message); } }}>Retire</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {editingArt && (
            <Card>
              <CardHeader><CardTitle>Edit DRAFT: {editingArt.canonical_url}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea value={JSON.stringify(editingArt.content_json, null, 2)} onChange={e => setEditingArt({ ...editingArt, content_json: (() => { try { return JSON.parse(e.target.value); } catch { return editingArt.content_json; } })() })} rows={10} />
                <div className="flex gap-2">
                  <Button onClick={async () => { try { await ziboUpdateDraftArtifact(editingArt.id, { content_json: editingArt.content_json, fhir_type: editingArt.fhir_type, canonical_url: editingArt.canonical_url, version: editingArt.version }); toast.success("Updated"); setEditingArt(null); loadArtifacts(); } catch (e: unknown) { toast.error((e as Error).message); } }}>Save</Button>
                  <Button variant="ghost" onClick={() => setEditingArt(null)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── IMPORT TAB ─── */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Import FHIR Bundle</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder='Paste FHIR Bundle JSON here...' value={bundleJson} onChange={e => setBundleJson(e.target.value)} rows={8} />
              <Button onClick={async () => {
                try {
                  const bundle = JSON.parse(bundleJson);
                  const res = await ziboImportFhirBundle(bundle);
                  toast.success(`Imported ${res.imported} resources`);
                } catch (e: unknown) { toast.error((e as Error).message); }
              }}>Import Bundle</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Import CSV Codelist</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <Input placeholder="Name (e.g. ICD-10)" value={csvName} onChange={e => setCsvName(e.target.value)} />
                <Input placeholder="System URL" value={csvSystem} onChange={e => setCsvSystem(e.target.value)} />
                <Input placeholder="Version" value={csvVersion} onChange={e => setCsvVersion(e.target.value)} />
              </div>
              <Textarea placeholder="code,display (one per line)" value={csvCodes} onChange={e => setCsvCodes(e.target.value)} rows={6} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={csvCreateVs} onChange={e => setCsvCreateVs(e.target.checked)} /> Also create ValueSet</label>
              <Button onClick={async () => {
                try {
                  const codes = csvCodes.split("\n").filter(l => l.trim()).map(l => { const [code, ...rest] = l.split(","); return { code: code.trim(), display: rest.join(",").trim() }; });
                  const res = await ziboImportCsvCodelist({ name: csvName, system_url: csvSystem, version: csvVersion, codes, create_valueset: csvCreateVs });
                  toast.success(`Imported ${res.codes_count} codes`);
                } catch (e: unknown) { toast.error((e as Error).message); }
              }}>Import CSV</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── PACKS TAB ─── */}
        <TabsContent value="packs" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Create Pack</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <Input placeholder="pack_id (e.g. OPD)" value={newPack.pack_id} onChange={e => setNewPack(p => ({ ...p, pack_id: e.target.value }))} />
                <Input placeholder="Name" value={newPack.name} onChange={e => setNewPack(p => ({ ...p, name: e.target.value }))} />
                <Input placeholder="Version" value={newPack.version} onChange={e => setNewPack(p => ({ ...p, version: e.target.value }))} />
              </div>
              <Button onClick={async () => {
                try { await ziboCreateDraftPack(newPack); toast.success("Pack created"); loadPacks(); } catch (e: unknown) { toast.error((e as Error).message); }
              }}>Create DRAFT Pack</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Packs</CardTitle>
                <Button variant="outline" onClick={loadPacks}>Load</Button>
              </div>
            </CardHeader>
            <CardContent>
              {packs.length === 0 ? <p className="text-muted-foreground text-sm">No packs. Click Load.</p> : (
                <div className="space-y-2">
                  {packs.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{p.name} ({p.pack_id})</p>
                        <p className="text-xs text-muted-foreground">v{p.version} · {p.tenant_id}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge className={statusColor[p.status]}>{p.status}</Badge>
                        {p.status === "DRAFT" && (
                          <Button size="sm" variant="outline" onClick={async () => { try { await ziboPublishPack(p.pack_id, p.version); toast.success("Pack published"); loadPacks(); } catch (e: unknown) { toast.error((e as Error).message); } }}>Publish</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── ASSIGNMENTS TAB ─── */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Assign Pack</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select value={newAssign.scope_type} onValueChange={v => setNewAssign(p => ({ ...p, scope_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TENANT">TENANT</SelectItem>
                    <SelectItem value="FACILITY">FACILITY</SelectItem>
                    <SelectItem value="WORKSPACE">WORKSPACE</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="scope_id" value={newAssign.scope_id} onChange={e => setNewAssign(p => ({ ...p, scope_id: e.target.value }))} />
                <Input placeholder="pack_id" value={newAssign.pack_id} onChange={e => setNewAssign(p => ({ ...p, pack_id: e.target.value }))} />
                <Input placeholder="pack_version" value={newAssign.pack_version} onChange={e => setNewAssign(p => ({ ...p, pack_version: e.target.value }))} />
              </div>
              <Select value={newAssign.policy_mode} onValueChange={v => setNewAssign(p => ({ ...p, policy_mode: v }))}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STRICT">STRICT</SelectItem>
                  <SelectItem value="LENIENT">LENIENT</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={async () => { try { await ziboCreateAssignment(newAssign as Partial<ZiboAssignment>); toast.success("Assignment created"); loadAssignments(); } catch (e: unknown) { toast.error((e as Error).message); } }}>Assign</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Effective Policy Resolution</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="facility_id" value={effectiveFacility} onChange={e => setEffectiveFacility(e.target.value)} />
                <Input placeholder="workspace_id (optional)" value={effectiveWorkspace} onChange={e => setEffectiveWorkspace(e.target.value)} />
              </div>
              <Button variant="outline" onClick={async () => { try { const r = await ziboGetEffectiveAssignment(undefined, effectiveFacility || undefined, effectiveWorkspace || undefined); setEffectiveResult(r); } catch (e: unknown) { toast.error((e as Error).message); } }}>Resolve</Button>
              {effectiveResult && <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">{JSON.stringify(effectiveResult, null, 2)}</pre>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div className="flex items-center justify-between"><CardTitle>Assignments</CardTitle><Button variant="outline" onClick={loadAssignments}>Load</Button></div></CardHeader>
            <CardContent>
              {assignments.length === 0 ? <p className="text-muted-foreground text-sm">No assignments.</p> : (
                <div className="space-y-2">
                  {assignments.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{a.scope_type}: {a.scope_id}</p>
                        <p className="text-xs text-muted-foreground">Pack: {a.pack_id} v{a.pack_version}</p>
                      </div>
                      <Badge variant={a.policy_mode === "STRICT" ? "destructive" : "secondary"}>{a.policy_mode}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── LOGS TAB ─── */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Validation Logs</CardTitle>
                <div className="flex gap-2">
                  <Input placeholder="facility_id" value={logFilter.facility_id} onChange={e => setLogFilter(p => ({ ...p, facility_id: e.target.value }))} className="w-40" />
                  <Input placeholder="service_name" value={logFilter.service_name} onChange={e => setLogFilter(p => ({ ...p, service_name: e.target.value }))} className="w-32" />
                  <Button variant="outline" onClick={loadLogs}>Load</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? <p className="text-muted-foreground text-sm">No logs.</p> : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map(l => (
                    <div key={l.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        {l.severity === "ERROR" && <XCircle className="h-4 w-4 text-destructive" />}
                        {l.severity === "WARN" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        {l.severity === "INFO" && <CheckCircle className="h-4 w-4 text-primary" />}
                        <span className="text-sm font-medium">{l.issue_code}</span>
                        <Badge variant="outline" className="text-xs">{l.service_name}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">{new Date(l.created_at).toLocaleString()}</span>
                      </div>
                      {l.canonical_url && <p className="text-xs text-muted-foreground">{l.canonical_url}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── DEV CONSOLE ─── */}
        <TabsContent value="dev" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Validate Coding</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="system URL" value={devSystem} onChange={e => setDevSystem(e.target.value)} />
                <Input placeholder="code" value={devCode} onChange={e => setDevCode(e.target.value)} />
              </div>
              <Button onClick={async () => { try { const r = await ziboValidateCoding({ system: devSystem, code: devCode }); setDevResult(r); } catch (e: unknown) { toast.error((e as Error).message); } }}>Validate</Button>
              {devResult && <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">{JSON.stringify(devResult, null, 2)}</pre>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Map Code</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <Input placeholder="source system" value={mapSource.system} onChange={e => setMapSource(p => ({ ...p, system: e.target.value }))} />
                <Input placeholder="source code" value={mapSource.code} onChange={e => setMapSource(p => ({ ...p, code: e.target.value }))} />
                <Input placeholder="target system (optional)" value={mapSource.target} onChange={e => setMapSource(p => ({ ...p, target: e.target.value }))} />
              </div>
              <Button onClick={async () => { try { const r = await ziboMapCode(mapSource.system, mapSource.code, mapSource.target || undefined); setMapResult(r); } catch (e: unknown) { toast.error((e as Error).message); } }}>Map</Button>
              {mapResult && <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">{JSON.stringify(mapResult, null, 2)}</pre>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
