import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Settings,
  Database,
  FileText,
  Users,
  Package,
  DollarSign,
  Clock,
  ArrowRightLeft,
  Link2,
  Unlink,
  Play,
  Pause,
  History,
  Download,
  Upload,
  Filter,
  Search,
  Zap,
  Activity,
  Shield,
  Key,
  Loader2
} from "lucide-react";

interface SyncModule {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  odooModel: string;
  action: string;
  synced: number;
  pending: number;
  lastSync: string | null;
  enabled: boolean;
}

interface SyncHistoryItem {
  id: number;
  module: string;
  action: string;
  records: number;
  status: string;
  timestamp: string;
  duration: string;
}

const initialModules: SyncModule[] = [
  { id: "partners", name: "Partners/Contacts", icon: Users, odooModel: "res.partner", action: "get_partners", synced: 0, pending: 0, lastSync: null, enabled: true },
  { id: "products", name: "Products/Services", icon: Package, odooModel: "product.template", action: "get_products", synced: 0, pending: 0, lastSync: null, enabled: true },
  { id: "invoices", name: "Invoices", icon: FileText, odooModel: "account.move", action: "get_invoices", synced: 0, pending: 0, lastSync: null, enabled: true },
  { id: "payments", name: "Payments", icon: DollarSign, odooModel: "account.payment", action: "get_payments", synced: 0, pending: 0, lastSync: null, enabled: true },
  { id: "stock", name: "Stock/Inventory", icon: Package, odooModel: "stock.quant", action: "get_stock", synced: 0, pending: 0, lastSync: null, enabled: true },
  { id: "employees", name: "HR/Employees", icon: Users, odooModel: "hr.employee", action: "get_employees", synced: 0, pending: 0, lastSync: null, enabled: true },
];

const fieldMappings = [
  { ehrField: "patient.first_name", odooField: "res.partner.name", transform: "concat", enabled: true },
  { ehrField: "patient.email", odooField: "res.partner.email", transform: "direct", enabled: true },
  { ehrField: "patient.phone", odooField: "res.partner.phone", transform: "direct", enabled: true },
  { ehrField: "patient.mrn", odooField: "res.partner.ref", transform: "direct", enabled: true },
  { ehrField: "encounter.charges", odooField: "account.move.line", transform: "mapping", enabled: true },
  { ehrField: "stock.quantity", odooField: "stock.quant.quantity", transform: "direct", enabled: false },
];

export function OdooIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [modules, setModules] = useState<SyncModule[]>(initialModules);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [liveData, setLiveData] = useState<Record<string, any[]>>({});

  // Connection settings state
  const [odooUrl, setOdooUrl] = useState("https://demo.odoo.com");
  const [odooDatabase, setOdooDatabase] = useState("demo");
  const [odooUsername, setOdooUsername] = useState("admin");
  const [odooPassword, setOdooPassword] = useState("admin");
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState("5");

  const getOdooConfig = () => ({
    url: odooUrl,
    db: odooDatabase,
    username: odooUsername,
    password: odooPassword,
  });

  const callOdooApi = async (action: string, extraParams: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke('odoo-integration', {
      body: { action, config: getOdooConfig(), ...extraParams },
    });
    
    if (error) throw new Error(error.message);
    return data;
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await callOdooApi('test_connection');
      if (result.success) {
        setIsConnected(true);
        toast.success(`Connected to Odoo at ${odooUrl}`);
        // Fetch summary after connecting
        await fetchSummary();
      } else {
        toast.error(result.message || 'Connection failed');
      }
    } catch (error) {
      toast.error('Failed to connect to Odoo');
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setModules(initialModules);
    setLiveData({});
    toast.info("Disconnected from Odoo ERP");
  };

  const fetchSummary = async () => {
    try {
      const result = await callOdooApi('get_summary');
      if (result.success && result.summary) {
        setModules(prev => prev.map(mod => {
          const key = mod.id === 'partners' ? 'partners' : mod.id;
          return { ...mod, synced: result.summary[key] || 0, lastSync: 'Just now' };
        }));
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleSync = async (moduleId?: string) => {
    setIsSyncing(true);
    setSyncProgress(0);
    const startTime = Date.now();

    try {
      const modulesToSync = moduleId 
        ? modules.filter(m => m.id === moduleId) 
        : modules.filter(m => m.enabled);

      let completed = 0;
      for (const mod of modulesToSync) {
        const result = await callOdooApi(mod.action, { limit: 100 });
        if (result.success) {
          setModules(prev => prev.map(m => 
            m.id === mod.id ? { ...m, synced: result.total || result.records?.length || 0, lastSync: 'Just now' } : m
          ));
          setLiveData(prev => ({ ...prev, [mod.id]: result.records || [] }));
          
          // Add to history
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          setSyncHistory(prev => [{
            id: Date.now(),
            module: mod.name,
            action: 'Pull',
            records: result.records?.length || 0,
            status: 'success',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            duration: `${duration}s`,
          }, ...prev].slice(0, 20));
        }
        completed++;
        setSyncProgress(Math.round((completed / modulesToSync.length) * 100));
      }
      toast.success(moduleId ? `${moduleId} synced successfully` : "All modules synced successfully");
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "partial": return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "error": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "partial": return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case "error": return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Odoo ERP Integration</h1>
              <p className="text-sm text-muted-foreground">Synchronize data between Impilo EHR and Odoo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
              {isConnected ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" />
                  Disconnected
                </>
              )}
            </Badge>
            {isConnected ? (
              <Button variant="outline" onClick={handleDisconnect}>
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            ) : (
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            )}
            <Button onClick={() => handleSync()} disabled={!isConnected || isSyncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync All"}
            </Button>
          </div>
        </div>

        {isSyncing && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Synchronizing...</span>
              <span>{syncProgress}%</span>
            </div>
            <Progress value={syncProgress} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="modules" className="h-full flex flex-col">
          <div className="px-6 pt-4 border-b">
            <TabsList>
              <TabsTrigger value="modules">Sync Modules</TabsTrigger>
              <TabsTrigger value="mappings">Field Mappings</TabsTrigger>
              <TabsTrigger value="history">Sync History</TabsTrigger>
              <TabsTrigger value="settings">Connection Settings</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            {/* Modules Tab */}
            <TabsContent value="modules" className="mt-0 space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((module) => (
                  <Card key={module.id} className={!module.enabled ? "opacity-60" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <module.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{module.name}</CardTitle>
                            <p className="text-xs text-muted-foreground font-mono">{module.odooModel}</p>
                          </div>
                        </div>
                        <Switch 
                          checked={module.enabled} 
                          onCheckedChange={(checked) => setModules(prev => 
                            prev.map(m => m.id === module.id ? { ...m, enabled: checked } : m)
                          )}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-2 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{module.synced.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Records</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{liveData[module.id]?.length || 0}</p>
                          <p className="text-xs text-muted-foreground">Fetched</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {module.lastSync || 'Never'}
                        </div>
                        <Button size="sm" variant="outline" disabled={!module.enabled} onClick={() => handleSync(module.id)}>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Sync
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Push All Changes
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Pull Latest Data
                    </Button>
                    <Button variant="outline" size="sm">
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      Resolve Conflicts
                    </Button>
                    <Button variant="outline" size="sm">
                      <Activity className="w-4 h-4 mr-2" />
                      Health Check
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mappings Tab */}
            <TabsContent value="mappings" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Field Mappings</CardTitle>
                      <CardDescription>Configure how data fields map between EHR and Odoo</CardDescription>
                    </div>
                    <Button size="sm">
                      <Zap className="w-4 h-4 mr-2" />
                      Add Mapping
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fieldMappings.map((mapping, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                        <Switch checked={mapping.enabled} />
                        <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                          <div>
                            <p className="text-sm font-mono text-primary">{mapping.ehrField}</p>
                            <p className="text-xs text-muted-foreground">EHR Field</p>
                          </div>
                          <div className="flex items-center justify-center">
                            <Badge variant="outline">{mapping.transform}</Badge>
                            <ArrowRightLeft className="w-4 h-4 mx-2 text-muted-foreground" />
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono text-purple-600">{mapping.odooField}</p>
                            <p className="text-xs text-muted-foreground">Odoo Field</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Sync History</CardTitle>
                      <CardDescription>View recent synchronization activities</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search history..." 
                          className="pl-10 w-64" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {syncHistory.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(item.status)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.module}</span>
                              <Badge variant="outline" className="text-xs">{item.action}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{item.records} records</p>
                            <p className="text-xs text-muted-foreground">{item.duration}</p>
                          </div>
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Connection Configuration</CardTitle>
                  <CardDescription>Configure your Odoo ERP connection settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Odoo Server URL</Label>
                      <Input 
                        value={odooUrl} 
                        onChange={(e) => setOdooUrl(e.target.value)}
                        placeholder="https://your-odoo-instance.com" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Database Name</Label>
                      <Input 
                        value={odooDatabase} 
                        onChange={(e) => setOdooDatabase(e.target.value)}
                        placeholder="odoo_db" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Username</Label>
                      <Input 
                        value={odooUsername} 
                        onChange={(e) => setOdooUsername(e.target.value)}
                        placeholder="api_user@company.com" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password / API Key</Label>
                      <Input 
                        type="password" 
                        value={odooPassword} 
                        onChange={(e) => setOdooPassword(e.target.value)}
                        placeholder="Enter password or API key" 
                      />
                      <p className="text-xs text-muted-foreground">
                        For demo: use "admin" as password
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sync Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-Sync</p>
                      <p className="text-sm text-muted-foreground">Automatically sync data at regular intervals</p>
                    </div>
                    <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                  </div>
                  {autoSync && (
                    <div className="space-y-2">
                      <Label>Sync Interval (minutes)</Label>
                      <Select value={syncInterval} onValueChange={setSyncInterval}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Every 1 minute</SelectItem>
                          <SelectItem value="5">Every 5 minutes</SelectItem>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Conflict Resolution</p>
                      <p className="text-sm text-muted-foreground">How to handle data conflicts</p>
                    </div>
                    <Select defaultValue="ehr">
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ehr">EHR Wins</SelectItem>
                        <SelectItem value="odoo">Odoo Wins</SelectItem>
                        <SelectItem value="newest">Newest Wins</SelectItem>
                        <SelectItem value="manual">Manual Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">SSL/TLS Encryption</p>
                        <p className="text-sm text-muted-foreground">All data is encrypted in transit</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium">API Key Authentication</p>
                        <p className="text-sm text-muted-foreground">Secure API key based authentication</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Configured</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
