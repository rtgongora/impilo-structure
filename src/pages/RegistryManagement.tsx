/**
 * Registry Management Hub
 * Central page for managing all HIE registries
 */

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, UserCog, Building2, BookOpen, FileText, Database, 
  Shield, Search, Plus, Clock, CheckCircle, XCircle, AlertTriangle 
} from 'lucide-react';
import { useRegistryAdmin } from '@/hooks/useRegistryAdmin';
import { useRegistryRecords } from '@/hooks/useRegistryRecords';
import { REGISTRY_STATUS_LABELS, REGISTRY_STATUS_COLORS } from '@/types/registry';
import type { ClientRegistryRecord, ProviderRegistryRecord, FacilityRegistryRecord, RegistryRecordStatus } from '@/types/registry';

const RegistryManagement = () => {
  const [activeRegistry, setActiveRegistry] = useState<string>('client');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RegistryRecordStatus[]>([]);
  
  const { isRegistrySuperAdmin, canManageRegistry, loading: rolesLoading } = useRegistryAdmin();

  const clientRecords = useRegistryRecords<ClientRegistryRecord>({
    registryType: 'client',
    searchQuery: activeRegistry === 'client' ? searchQuery : undefined,
    statusFilter: activeRegistry === 'client' ? statusFilter : undefined,
  });

  const providerRecords = useRegistryRecords<ProviderRegistryRecord>({
    registryType: 'provider',
    searchQuery: activeRegistry === 'provider' ? searchQuery : undefined,
    statusFilter: activeRegistry === 'provider' ? statusFilter : undefined,
  });

  const facilityRecords = useRegistryRecords<FacilityRegistryRecord>({
    registryType: 'facility',
    searchQuery: activeRegistry === 'facility' ? searchQuery : undefined,
    statusFilter: activeRegistry === 'facility' ? statusFilter : undefined,
  });

  const registries = [
    { id: 'client', label: 'Client Registry', icon: Users, description: 'MOSIP - Patient Identity', pendingCount: clientRecords.pendingCount },
    { id: 'provider', label: 'Provider Registry', icon: UserCog, description: 'Varapi - Healthcare Workers', pendingCount: providerRecords.pendingCount },
    { id: 'facility', label: 'Facility Registry', icon: Building2, description: 'Thuso - Health Facilities', pendingCount: facilityRecords.pendingCount },
    { id: 'terminology', label: 'Terminology', icon: BookOpen, description: 'Clinical Code Systems', pendingCount: 0 },
    { id: 'shr', label: 'Shared Health Record', icon: FileText, description: 'FHIR Bundles', pendingCount: 0 },
    { id: 'ndr', label: 'National Data Repository', icon: Database, description: 'Analytics & Reporting', pendingCount: 0 },
  ];

  const getActiveRecords = (): { 
    records: (ClientRegistryRecord | ProviderRegistryRecord | FacilityRegistryRecord)[]; 
    loading: boolean; 
    pendingCount: number; 
    totalCount: number;
  } => {
    switch (activeRegistry) {
      case 'client': return clientRecords;
      case 'provider': return providerRecords;
      case 'facility': return facilityRecords;
      default: return { records: [], loading: false, pendingCount: 0, totalCount: 0 };
    }
  };

  const activeData = getActiveRecords();

  type AnyRegistryRecord = ClientRegistryRecord | ProviderRegistryRecord | FacilityRegistryRecord;

  const getRecordName = (record: AnyRegistryRecord) => {
    if ('name' in record) return record.name;
    return `${record.first_name} ${record.last_name}`;
  };

  const getRecordId = (record: AnyRegistryRecord): string | null => {
    if ('impilo_id' in record && record.impilo_id) return record.impilo_id;
    if ('provider_id' in record && record.provider_id) return record.provider_id;
    if ('thuso_id' in record && record.thuso_id) return record.thuso_id;
    return record.id;
  };

  return (
    <AppLayout>
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Registry Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage HIE registries with approval workflows
            </p>
          </div>
          {isRegistrySuperAdmin && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              Super Admin
            </Badge>
          )}
        </div>

        {/* Registry Selection Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {registries.map((registry) => {
            const Icon = registry.icon;
            const isActive = activeRegistry === registry.id;
            const canAccess = canManageRegistry(registry.id as 'client' | 'provider' | 'facility' | 'terminology' | 'shr' | 'ndr');
            
            return (
              <Card 
                key={registry.id}
                className={`cursor-pointer transition-all ${
                  isActive 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : canAccess 
                      ? 'hover:bg-muted/50' 
                      : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => canAccess && setActiveRegistry(registry.id)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="font-medium text-sm">{registry.label}</p>
                  <p className="text-xs text-muted-foreground">{registry.description}</p>
                  {registry.pendingCount > 0 && (
                    <Badge variant="destructive" className="mt-2 text-xs">
                      {registry.pendingCount} pending
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Area */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {registries.find(r => r.id === activeRegistry)?.label} Records
              </CardTitle>
              <CardDescription>
                {activeData.totalCount} total records • {activeData.pendingCount} pending approval
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search records..." 
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Status Filter Tabs */}
            <Tabs defaultValue="all" className="mb-4">
              <TabsList>
                <TabsTrigger value="all" onClick={() => setStatusFilter([])}>All</TabsTrigger>
                <TabsTrigger value="pending" onClick={() => setStatusFilter(['pending_approval'])}>
                  <Clock className="h-4 w-4 mr-1" /> Pending
                </TabsTrigger>
                <TabsTrigger value="approved" onClick={() => setStatusFilter(['approved'])}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Approved
                </TabsTrigger>
                <TabsTrigger value="rejected" onClick={() => setStatusFilter(['rejected'])}>
                  <XCircle className="h-4 w-4 mr-1" /> Rejected
                </TabsTrigger>
                <TabsTrigger value="suspended" onClick={() => setStatusFilter(['suspended', 'deactivated'])}>
                  <AlertTriangle className="h-4 w-4 mr-1" /> Suspended
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Records Table */}
            {activeData.loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading records...</div>
            ) : activeData.records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No records found. Create your first record to get started.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">ID</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeData.records as AnyRegistryRecord[]).slice(0, 10).map((record) => (
                      <tr key={record.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-medium">{getRecordName(record)}</td>
                        <td className="p-3 text-sm text-muted-foreground font-mono">
                          {getRecordId(record) || 'Pending'}
                        </td>
                        <td className="p-3">
                          <Badge className={REGISTRY_STATUS_COLORS[record.status]}>
                            {REGISTRY_STATUS_LABELS[record.status]}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(record.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm">View</Button>
                          {record.status === 'pending_approval' && (
                            <>
                              <Button variant="ghost" size="sm" className="text-emerald-600">Approve</Button>
                              <Button variant="ghost" size="sm" className="text-destructive">Reject</Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default RegistryManagement;
