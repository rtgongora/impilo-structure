/**
 * National Client Registry Page
 * OpenHIE, WHO DIIG, FHIR R4 Compliant Health ID Registry
 */

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Plus, 
  UserCheck,
  FileText, 
  GitMerge, 
  Upload,
  Settings,
  BarChart3,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Heart,
  Fingerprint,
  QrCode,
} from 'lucide-react';
import { useClientRegistryData } from '@/hooks/useClientRegistryData';
import { ClientRegistryDashboard } from '@/components/clientRegistry/ClientRegistryDashboard';
import { ClientList } from '@/components/clientRegistry/ClientList';
import { ClientDetailPanel } from '@/components/clientRegistry/ClientDetailPanel';
import { ClientRegistrationWizard } from '@/components/clientRegistry/ClientRegistrationWizard';
import { ClientDuplicateQueue } from '@/components/clientRegistry/ClientDuplicateQueue';
import { ClientMergeHistory } from '@/components/clientRegistry/ClientMergeHistoryPanel';
import { ClientMatchingRules } from '@/components/clientRegistry/ClientMatchingRules';
import { ClientRegistryReports } from '@/components/clientRegistry/ClientRegistryReports';
import { HealthIdVerification } from '@/components/clientRegistry/HealthIdVerification';
import type { ClientRecord, ClientLifecycleState } from '@/types/clientRegistry';

const ClientRegistry = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientLifecycleState | 'all'>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const { 
    clients, 
    loading, 
    counts,
    refetch,
    createClient,
    updateClient,
    updateLifecycleState,
    markDeceased,
  } = useClientRegistryData({
    status: statusFilter,
    search: searchQuery,
    province: provinceFilter || undefined,
  });

  const handleClientSelect = (client: ClientRecord) => {
    setSelectedClient(client);
  };

  const handleRegistrationSuccess = () => {
    setShowRegistrationDialog(false);
    refetch();
  };

  const provinces = [
    { id: 'harare', name: 'Harare' },
    { id: 'bulawayo', name: 'Bulawayo' },
    { id: 'manicaland', name: 'Manicaland' },
    { id: 'mashonaland_central', name: 'Mashonaland Central' },
    { id: 'mashonaland_east', name: 'Mashonaland East' },
    { id: 'mashonaland_west', name: 'Mashonaland West' },
    { id: 'masvingo', name: 'Masvingo' },
    { id: 'matabeleland_north', name: 'Matabeleland North' },
    { id: 'matabeleland_south', name: 'Matabeleland South' },
    { id: 'midlands', name: 'Midlands' },
  ];

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary" />
                National Client Registry
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Health ID Registry (MOSIP) - OpenHIE/FHIR R4 Compliant
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                {counts.active} Active
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                {counts.draft} Draft
              </Badge>
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3 text-red-500" />
                {counts.duplicates} Duplicates
              </Badge>
              <Button onClick={() => setShowVerificationDialog(true)} variant="outline" className="gap-2">
                <QrCode className="h-4 w-4" />
                Verify ID
              </Button>
              <Button onClick={() => setShowRegistrationDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Register Client
              </Button>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-8 w-full max-w-4xl">
              <TabsTrigger value="dashboard" className="gap-1">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-1">
                <Users className="h-4 w-4" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="duplicates" className="gap-1">
                <GitMerge className="h-4 w-4" />
                Duplicates
                {counts.duplicates > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                    {counts.duplicates}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="merges" className="gap-1">
                <FileText className="h-4 w-4" />
                Merge History
              </TabsTrigger>
              <TabsTrigger value="matching" className="gap-1">
                <Settings className="h-4 w-4" />
                Matching
              </TabsTrigger>
              <TabsTrigger value="biometrics" className="gap-1">
                <Fingerprint className="h-4 w-4" />
                Biometrics
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-1">
                <BarChart3 className="h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="access" className="gap-1">
                <Shield className="h-4 w-4" />
                Access
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="mt-6">
              <ClientRegistryDashboard counts={counts} />
            </TabsContent>

            {/* Clients Tab */}
            <TabsContent value="clients" className="mt-6">
              <div className="flex gap-6">
                <div className={selectedClient ? "w-1/2" : "w-full"}>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle>Client Records</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Upload className="h-4 w-4" />
                            Bulk Import
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        Search and manage client identity records
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Search & Filters */}
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search by name, Health ID, phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Select 
                          value={statusFilter} 
                          onValueChange={(v) => setStatusFilter(v as ClientLifecycleState | 'all')}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="deceased">Deceased</SelectItem>
                            <SelectItem value="merged">Merged</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select 
                          value={provinceFilter || "all"} 
                          onValueChange={(v) => setProvinceFilter(v === "all" ? "" : v)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Provinces" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Provinces</SelectItem>
                            {provinces.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Client List */}
                      <ClientList
                        clients={clients}
                        loading={loading}
                        onSelect={handleClientSelect}
                        selectedId={selectedClient?.id}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Detail Panel */}
                {selectedClient && (
                  <div className="w-1/2">
                    <ClientDetailPanel
                      client={selectedClient}
                      onClose={() => setSelectedClient(null)}
                      onUpdate={updateClient}
                      onStateChange={updateLifecycleState}
                      onMarkDeceased={markDeceased}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Duplicates Tab */}
            <TabsContent value="duplicates" className="mt-6">
              <ClientDuplicateQueue />
            </TabsContent>

            {/* Merge History Tab */}
            <TabsContent value="merges" className="mt-6">
              <ClientMergeHistory />
            </TabsContent>

            {/* Matching Rules Tab */}
            <TabsContent value="matching" className="mt-6">
              <ClientMatchingRules />
            </TabsContent>

            {/* Biometrics Tab */}
            <TabsContent value="biometrics" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5" />
                    Biometric Enrollment
                  </CardTitle>
                  <CardDescription>
                    Policy-driven biometric identity linkage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Fingerprint className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Biometric enrollment module</p>
                    <p className="text-sm">Fingerprint, Facial, and Iris capture integration</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="mt-6">
              <ClientRegistryReports />
            </TabsContent>

            {/* Access Control Tab */}
            <TabsContent value="access" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Access Control
                  </CardTitle>
                  <CardDescription>
                    Registry role assignments and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Access control is managed through the Admin dashboard</p>
                    <Button variant="outline" className="mt-4">
                      Go to Admin → Registry Roles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Register New Client
            </DialogTitle>
          </DialogHeader>
          <ClientRegistrationWizard 
            onSuccess={handleRegistrationSuccess}
            onCancel={() => setShowRegistrationDialog(false)}
            createClient={createClient}
          />
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Verify Health ID
            </DialogTitle>
          </DialogHeader>
          <HealthIdVerification onClose={() => setShowVerificationDialog(false)} />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ClientRegistry;
