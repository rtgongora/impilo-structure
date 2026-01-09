/**
 * Facility Registry Page
 * OpenHIE/GOFR/WHO MFL compliant Master Facility List management
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
  Building2, 
  Search, 
  Plus, 
  MapPin, 
  FileText, 
  GitMerge, 
  Upload,
  Settings,
  BarChart3,
  Map,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useFacilityData, useFacilityTypes, useFacilityAdminHierarchies } from '@/hooks/useFacilityData';
import { FacilityDashboard } from '@/components/facility/FacilityDashboard';
import { FacilityList } from '@/components/facility/FacilityList';
import { FacilityDetailPanel } from '@/components/facility/FacilityDetailPanel';
import { FacilityRegistrationWizard } from '@/components/facility/FacilityRegistrationWizard';
import { FacilityMapView } from '@/components/facility/FacilityMapView';
import { FacilityReconciliation } from '@/components/facility/FacilityReconciliation';
import { FacilityChangeRequests } from '@/components/facility/FacilityChangeRequests';
import { FacilityReferenceData } from '@/components/facility/FacilityReferenceData';
import { FacilityReports } from '@/components/facility/FacilityReports';
import type { Facility, FacilityWorkflowStatus } from '@/types/facility';

const FacilityRegistry = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FacilityWorkflowStatus | 'all'>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);

  const { 
    facilities, 
    loading, 
    counts,
    refetch,
    submitForApproval,
    approveFacility,
    rejectFacility,
  } = useFacilityData({
    status: statusFilter,
    search: searchQuery,
    provinceId: provinceFilter || undefined,
    facilityTypeId: typeFilter || undefined,
  });

  const { types: facilityTypes } = useFacilityTypes();
  const { hierarchies: provinces } = useFacilityAdminHierarchies(1);

  const handleFacilitySelect = (facility: Facility) => {
    setSelectedFacility(facility);
  };

  const handleRegistrationSuccess = () => {
    setShowRegistrationDialog(false);
    refetch();
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                National Facility Registry
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Master Facility List (Thuso) - OpenHIE/GOFR Compliant
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                {counts.approved} Approved
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                {counts.pending} Pending
              </Badge>
              <Button onClick={() => setShowRegistrationDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Register Facility
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-4">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFilter('all')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{counts.total}</p>
                    <p className="text-xs text-muted-foreground">Total Facilities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFilter('approved')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{counts.approved}</p>
                    <p className="text-xs text-muted-foreground">Approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFilter('pending_approval')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{counts.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFilter('draft')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{counts.draft}</p>
                    <p className="text-xs text-muted-foreground">Draft</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFilter('rejected')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{counts.rejected}</p>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="facilities" className="gap-2">
                <Building2 className="h-4 w-4" />
                Facilities
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <Map className="h-4 w-4" />
                Map View
              </TabsTrigger>
              <TabsTrigger value="reconciliation" className="gap-2">
                <GitMerge className="h-4 w-4" />
                Reconciliation
              </TabsTrigger>
              <TabsTrigger value="changes" className="gap-2">
                <FileText className="h-4 w-4" />
                Change Requests
              </TabsTrigger>
              <TabsTrigger value="reference" className="gap-2">
                <Settings className="h-4 w-4" />
                Reference Data
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <FacilityDashboard />
            </TabsContent>

            <TabsContent value="facilities" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search facilities by name, code, or city..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={provinceFilter || "all"} onValueChange={(v) => setProvinceFilter(v === "all" ? "" : v)}>
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
                    <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {facilityTypes.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Facility List with Detail Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <FacilityList
                    facilities={facilities}
                    loading={loading}
                    selectedFacility={selectedFacility}
                    onSelect={handleFacilitySelect}
                    onApprove={approveFacility}
                    onReject={rejectFacility}
                    onSubmit={submitForApproval}
                  />
                </div>
                <div className="lg:col-span-1">
                  {selectedFacility ? (
                    <FacilityDetailPanel 
                      facility={selectedFacility} 
                      onClose={() => setSelectedFacility(null)}
                      onUpdate={refetch}
                    />
                  ) : (
                    <Card className="h-full flex items-center justify-center">
                      <CardContent className="text-center text-muted-foreground p-8">
                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a facility to view details</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="map">
              <FacilityMapView facilities={facilities} onSelect={handleFacilitySelect} />
            </TabsContent>

            <TabsContent value="reconciliation">
              <FacilityReconciliation />
            </TabsContent>

            <TabsContent value="changes">
              <FacilityChangeRequests />
            </TabsContent>

            <TabsContent value="reference">
              <FacilityReferenceData />
            </TabsContent>

            <TabsContent value="reports">
              <FacilityReports />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Facility</DialogTitle>
          </DialogHeader>
          <FacilityRegistrationWizard onSuccess={handleRegistrationSuccess} onCancel={() => setShowRegistrationDialog(false)} />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default FacilityRegistry;
