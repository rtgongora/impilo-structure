import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePACSAdmin } from "@/hooks/pacs/usePACSAdmin";
import { 
  Settings, Route, Database, Layout, Shield, 
  Eye, Download, Clock, FileText, Plus, Edit, Trash2
} from "lucide-react";
import { format } from "date-fns";

export function PACSAdminDashboard() {
  const {
    routingRules,
    prefetchRules,
    lifecyclePolicies,
    hangingProtocols,
    deidentJobs,
    auditLog,
    loading,
    fetchRoutingRules,
    fetchPrefetchRules,
    fetchLifecyclePolicies,
    fetchHangingProtocols,
    fetchDeidentJobs,
    fetchAuditLog,
    approveDeidentJob,
  } = usePACSAdmin();

  const [activeTab, setActiveTab] = useState("routing");

  useEffect(() => {
    fetchRoutingRules();
    fetchPrefetchRules();
    fetchLifecyclePolicies();
    fetchHangingProtocols();
    fetchDeidentJobs();
    fetchAuditLog({ limit: 50 });
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PACS Administration</h1>
          <p className="text-muted-foreground">Manage routing, storage, and access policies</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="routing" className="flex items-center gap-2">
            <Route className="w-4 h-4" />
            Routing
          </TabsTrigger>
          <TabsTrigger value="prefetch" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Prefetch
          </TabsTrigger>
          <TabsTrigger value="lifecycle" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Lifecycle
          </TabsTrigger>
          <TabsTrigger value="hanging" className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Hanging Protocols
          </TabsTrigger>
          <TabsTrigger value="deident" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            De-identification
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Routing Rules */}
        <TabsContent value="routing" className="mt-4 space-y-4">
          <div className="flex justify-between">
            <div>
              <h2 className="text-lg font-semibold">Study Routing Rules</h2>
              <p className="text-sm text-muted-foreground">
                Configure how studies are automatically routed to worklists and facilities
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Match Conditions</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routingRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rule.modality_match?.map(m => (
                          <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                        ))}
                        {rule.body_part_match?.map(b => (
                          <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {rule.set_priority && <Badge>{rule.set_priority}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {routingRules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No routing rules configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Prefetch Rules */}
        <TabsContent value="prefetch" className="mt-4 space-y-4">
          <div className="flex justify-between">
            <div>
              <h2 className="text-lg font-semibold">Prior Study Prefetch Rules</h2>
              <p className="text-sm text-muted-foreground">
                Configure automatic retrieval of prior studies for comparison
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {prefetchRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{rule.name}</CardTitle>
                    <Switch checked={rule.is_active} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modalities:</span>
                      <div className="flex gap-1">
                        {rule.modality?.map(m => <Badge key={m} variant="outline">{m}</Badge>)}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Body Parts:</span>
                      <div className="flex gap-1">
                        {rule.body_part?.map(b => <Badge key={b} variant="secondary">{b}</Badge>) || <span>Any</span>}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lookback:</span>
                      <span>{rule.lookback_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Priors:</span>
                      <span>{rule.max_priors}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      {rule.same_modality_only && <Badge variant="outline">Same Modality</Badge>}
                      {rule.same_body_part_only && <Badge variant="outline">Same Body Part</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Lifecycle Policies */}
        <TabsContent value="lifecycle" className="mt-4 space-y-4">
          <div className="flex justify-between">
            <div>
              <h2 className="text-lg font-semibold">Storage Lifecycle Policies</h2>
              <p className="text-sm text-muted-foreground">
                Configure retention and archiving policies for imaging data
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Policy
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Name</TableHead>
                  <TableHead>Modalities</TableHead>
                  <TableHead>Age Category</TableHead>
                  <TableHead>Hot Storage</TableHead>
                  <TableHead>Warm Storage</TableHead>
                  <TableHead>Cold Archive</TableHead>
                  <TableHead>Delete After</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lifecyclePolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {policy.modality?.map(m => (
                          <Badge key={m} variant="outline">{m}</Badge>
                        )) || <span className="text-muted-foreground">All</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{policy.patient_age_category || 'All'}</Badge>
                    </TableCell>
                    <TableCell>{policy.hot_storage_days} days</TableCell>
                    <TableCell>{policy.warm_storage_days} days</TableCell>
                    <TableCell>{policy.cold_storage_days} days</TableCell>
                    <TableCell>
                      {policy.deletion_after_days ? `${policy.deletion_after_days} days` : 
                        <Badge variant="outline" className="bg-green-50 text-green-700">Never</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={policy.is_active ? "default" : "secondary"}>
                        {policy.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Hanging Protocols */}
        <TabsContent value="hanging" className="mt-4 space-y-4">
          <div className="flex justify-between">
            <div>
              <h2 className="text-lg font-semibold">Hanging Protocols</h2>
              <p className="text-sm text-muted-foreground">
                Configure default display layouts by modality and body part
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Protocol
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {hangingProtocols.map((protocol) => (
              <Card key={protocol.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{protocol.name}</CardTitle>
                    {protocol.is_default && <Badge>Default</Badge>}
                  </div>
                  <CardDescription>{protocol.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modality:</span>
                      <Badge variant="outline">{protocol.modality}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Body Part:</span>
                      <span>{protocol.body_part || 'Any'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Layout:</span>
                      <Badge variant="secondary">{protocol.layout_type}</Badge>
                    </div>
                    {protocol.initial_window_preset && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Window:</span>
                        <span>{protocol.initial_window_preset}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      {protocol.auto_link_scrolling && <Badge variant="outline" className="text-xs">Link Scroll</Badge>}
                      {protocol.auto_compare_priors && <Badge variant="outline" className="text-xs">Auto Compare</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* De-identification Jobs */}
        <TabsContent value="deident" className="mt-4 space-y-4">
          <div className="flex justify-between">
            <div>
              <h2 className="text-lg font-semibold">De-identification Jobs</h2>
              <p className="text-sm text-muted-foreground">
                Manage requests to export de-identified imaging data
              </p>
            </div>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Studies</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deidentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.project_name || 'Unnamed'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.purpose}</Badge>
                    </TableCell>
                    <TableCell>{job.study_ids.length} studies</TableCell>
                    <TableCell>{format(new Date(job.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={job.status === 'pending' ? 'outline' : 
                                job.status === 'approved' ? 'default' :
                                job.status === 'completed' ? 'secondary' : 'destructive'}
                      >
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {job.status === 'pending' && (
                        <Button size="sm" onClick={() => approveDeidentJob(job.id)}>
                          Approve
                        </Button>
                      )}
                      {job.status === 'completed' && job.output_location && (
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {deidentJobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No de-identification jobs
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="mt-4 space-y-4">
          <div className="flex justify-between">
            <div>
              <h2 className="text-lg font-semibold">Imaging Access Audit Log</h2>
              <p className="text-sm text-muted-foreground">
                Track all access to imaging studies and reports
              </p>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Filter by study ID..." className="w-64" />
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                  <SelectItem value="share">Share</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Card>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Study</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Emergency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.map((entry) => (
                    <TableRow key={entry.id} className={entry.is_emergency_access ? 'bg-red-50' : ''}>
                      <TableCell className="text-sm">
                        {format(new Date(entry.created_at), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.action}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {entry.study_id?.slice(0, 8) || '--'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {entry.actor_id?.slice(0, 8)}
                      </TableCell>
                      <TableCell>{entry.purpose_of_use || '--'}</TableCell>
                      <TableCell>{entry.access_method || '--'}</TableCell>
                      <TableCell>
                        {entry.is_emergency_access && (
                          <Badge variant="destructive">Emergency</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {auditLog.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No audit log entries
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
