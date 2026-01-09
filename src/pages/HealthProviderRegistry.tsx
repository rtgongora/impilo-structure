/**
 * National Health Provider Registry (HPR) Management Page
 * Implements HPR + IdP requirements for provider identity, lifecycle, and eligibility
 */

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Users,
  Shield,
  Building2,
  FileCheck,
  Search,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  Key,
  Activity,
  History,
  ShieldCheck,
  Fingerprint,
} from 'lucide-react';
import { HPRService } from '@/services/hprService';
import { IdPService } from '@/services/idpService';
import type {
  HealthProvider,
  ProviderLifecycleState,
  EligibilityResponse,
  ProviderStateTransition,
} from '@/types/hpr';
import {
  LIFECYCLE_STATE_METADATA,
  PROVIDER_CADRES,
  VALID_STATE_TRANSITIONS,
} from '@/types/hpr';

export default function HealthProviderRegistry() {
  const [activeTab, setActiveTab] = useState('providers');
  const [providers, setProviders] = useState<HealthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [cadreFilter, setCadreFilter] = useState<string>('all');
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [stats, setStats] = useState<Record<ProviderLifecycleState, number>>({
    draft: 0,
    pending_council_verification: 0,
    pending_facility_affiliation: 0,
    active: 0,
    suspended: 0,
    revoked: 0,
    retired: 0,
    deceased: 0,
  });

  // Selected provider for detail view
  const [selectedProvider, setSelectedProvider] = useState<HealthProvider | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResponse | null>(null);
  const [stateHistory, setStateHistory] = useState<ProviderStateTransition[]>([]);

  useEffect(() => {
    loadProviders();
    loadStats();
  }, [searchQuery, stateFilter, cadreFilter]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const result = await HPRService.searchProviders(searchQuery, {
        lifecycle_state: stateFilter !== 'all' ? stateFilter as ProviderLifecycleState : undefined,
        cadre: cadreFilter !== 'all' ? cadreFilter : undefined,
        limit: 100,
      });
      setProviders(result);
    } catch (error) {
      console.error('Failed to load providers:', error);
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await HPRService.getProviderStats();
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleProviderSelect = async (provider: HealthProvider) => {
    setSelectedProvider(provider);
    
    // Load eligibility and state history
    try {
      const [eligibility, history] = await Promise.all([
        HPRService.checkEligibility(provider.id),
        HPRService.getStateTransitions(provider.id),
      ]);
      setEligibilityResult(eligibility);
      setStateHistory(history);
    } catch (error) {
      console.error('Failed to load provider details:', error);
    }
  };

  const handleStateTransition = async (newState: ProviderLifecycleState, reason: string) => {
    if (!selectedProvider) return;
    
    try {
      await HPRService.transitionState(selectedProvider.id, newState, reason);
      toast.success(`Provider state updated to ${LIFECYCLE_STATE_METADATA[newState].label}`);
      
      // Reload provider
      const updated = await HPRService.getProvider(selectedProvider.id);
      if (updated) {
        setSelectedProvider(updated);
        handleProviderSelect(updated);
      }
      loadProviders();
      loadStats();
    } catch (error) {
      console.error('Failed to transition state:', error);
      toast.error('Failed to update provider state');
    }
  };

  const getStateColor = (state: ProviderLifecycleState) => {
    return LIFECYCLE_STATE_METADATA[state]?.color || 'bg-muted';
  };

  const totalProviders = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              National Health Provider Registry
            </h1>
            <p className="text-muted-foreground">
              HPR + IdP: Unified provider identity, licensure, and access control
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              OpenHIE Compliant
            </Badge>
            <Badge variant="outline" className="text-sm">
              FHIR R4
            </Badge>
            <Button variant="outline" size="sm" onClick={() => { loadProviders(); loadStats(); toast.success('Data refreshed'); }}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Register Provider
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register New Health Provider</DialogTitle>
                </DialogHeader>
                <ProviderRegistrationForm 
                  onSuccess={() => { 
                    setRegisterDialogOpen(false); 
                    loadProviders(); 
                    loadStats(); 
                  }} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {Object.entries(LIFECYCLE_STATE_METADATA).map(([state, meta]) => (
            <Card 
              key={state} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                stateFilter === state ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setStateFilter(stateFilter === state ? 'all' : state)}
            >
              <CardContent className="p-3 text-center">
                <div className={`text-2xl font-bold ${meta.allowsAccess ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {stats[state as ProviderLifecycleState] || 0}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {meta.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Providers ({totalProviders})
            </TabsTrigger>
            <TabsTrigger value="eligibility" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Eligibility Engine
            </TabsTrigger>
            <TabsTrigger value="idp" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              IdP Events
            </TabsTrigger>
            <TabsTrigger value="architecture" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Architecture
            </TabsTrigger>
          </TabsList>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, UPID, or National ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={cadreFilter} onValueChange={setCadreFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Cadres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cadres</SelectItem>
                  {PROVIDER_CADRES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {Object.entries(LIFECYCLE_STATE_METADATA).map(([state, meta]) => (
                    <SelectItem key={state} value={state}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Provider List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Provider Registry</CardTitle>
                  <CardDescription>
                    {providers.length} providers found
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead>UPID</TableHead>
                          <TableHead>Cadre</TableHead>
                          <TableHead>State</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ) : providers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No providers found
                            </TableCell>
                          </TableRow>
                        ) : (
                          providers.map((provider) => (
                            <TableRow
                              key={provider.id}
                              className={`cursor-pointer ${
                                selectedProvider?.id === provider.id ? 'bg-muted' : ''
                              }`}
                              onClick={() => handleProviderSelect(provider)}
                            >
                              <TableCell>
                                <div className="font-medium">
                                  {provider.first_name} {provider.surname}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {provider.email || provider.phone || 'No contact'}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {provider.upid}
                              </TableCell>
                              <TableCell className="text-sm">
                                {PROVIDER_CADRES.find(c => c.value === provider.cadre)?.label || provider.cadre}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStateColor(provider.lifecycle_state)}>
                                  {LIFECYCLE_STATE_METADATA[provider.lifecycle_state]?.label}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Provider Detail */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Provider Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedProvider ? (
                    <div className="space-y-6">
                      {/* Identity */}
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Identity
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">UPID:</span>
                            <span className="ml-2 font-mono">{selectedProvider.upid}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">National ID:</span>
                            <span className="ml-2">{selectedProvider.national_id || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Name:</span>
                            <span className="ml-2">
                              {selectedProvider.first_name} {selectedProvider.other_names} {selectedProvider.surname}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">DOB:</span>
                            <span className="ml-2">{selectedProvider.date_of_birth}</span>
                          </div>
                        </div>
                      </div>

                      {/* Professional */}
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <FileCheck className="h-4 w-4" />
                          Professional
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Cadre:</span>
                            <span className="ml-2">
                              {PROVIDER_CADRES.find(c => c.value === selectedProvider.cadre)?.label}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Specialty:</span>
                            <span className="ml-2">{selectedProvider.specialty || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Lifecycle State */}
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Lifecycle State
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge className={getStateColor(selectedProvider.lifecycle_state)}>
                            {LIFECYCLE_STATE_METADATA[selectedProvider.lifecycle_state]?.label}
                          </Badge>
                          {LIFECYCLE_STATE_METADATA[selectedProvider.lifecycle_state]?.allowsAccess ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {LIFECYCLE_STATE_METADATA[selectedProvider.lifecycle_state]?.allowsAccess 
                              ? 'Access Allowed' 
                              : 'Access Denied'}
                          </span>
                        </div>
                        {selectedProvider.lifecycle_state_reason && (
                          <p className="text-sm text-muted-foreground">
                            Reason: {selectedProvider.lifecycle_state_reason}
                          </p>
                        )}
                      </div>

                      {/* Eligibility Check */}
                      {eligibilityResult && (
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            Eligibility Status
                          </h4>
                          <div className={`p-3 rounded-lg ${
                            eligibilityResult.eligible 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-red-50 border border-red-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              {eligibilityResult.eligible ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                              <span className="font-medium">
                                {eligibilityResult.eligible ? 'Eligible' : 'Not Eligible'}
                              </span>
                            </div>
                            {eligibilityResult.reason_codes.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {eligibilityResult.reason_codes.map((code, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {code}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {eligibilityResult.license_valid_until && (
                              <p className="text-xs mt-2 text-muted-foreground">
                                License valid until: {eligibilityResult.license_valid_until}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* User Linkage */}
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Fingerprint className="h-4 w-4" />
                          IdP Linkage
                        </h4>
                        {selectedProvider.user_id ? (
                          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm">Linked to user account</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Method: {selectedProvider.user_link_verification_method || 'Unknown'}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm">Not linked to user account</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* State Transitions */}
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <History className="h-4 w-4" />
                          State History
                        </h4>
                        {stateHistory.length > 0 ? (
                          <ScrollArea className="h-32">
                            <div className="space-y-2">
                              {stateHistory.map((transition) => (
                                <div key={transition.id} className="text-xs flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {new Date(transition.created_at).toLocaleString()}
                                  </span>
                                  <span>→</span>
                                  <Badge variant="outline" className="text-xs">
                                    {LIFECYCLE_STATE_METADATA[transition.to_state]?.label}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <p className="text-sm text-muted-foreground">No state transitions</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t flex flex-wrap gap-2">
                        {VALID_STATE_TRANSITIONS[selectedProvider.lifecycle_state]?.map((targetState) => (
                          <Button
                            key={targetState}
                            size="sm"
                            variant="outline"
                            onClick={() => handleStateTransition(targetState, 'Manual transition')}
                          >
                            → {LIFECYCLE_STATE_METADATA[targetState]?.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Select a provider to view details
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Eligibility Engine Tab */}
          <TabsContent value="eligibility" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Eligibility Decision Engine
                </CardTitle>
                <CardDescription>
                  Real-time provider eligibility checks based on lifecycle state, licenses, and affiliations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Eligibility Criteria (HPR-FR-050)</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Provider lifecycle state = Active
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        At least one active, non-expired license
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Active affiliation with required facility
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Required role granted
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Required privileges granted
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Response Format</h4>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
{`{
  "eligible": true,
  "provider_id": "UPID-XXXXXX-XXXXXXXX-X",
  "roles": ["clinician"],
  "privileges": ["prescribe", "order_lab"],
  "facility_scope": ["FAC-001"],
  "license_valid_until": "2026-12-31",
  "reason_codes": []
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IdP Events Tab */}
          <TabsContent value="idp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Identity Provider Events
                </CardTitle>
                <CardDescription>
                  Real-time revocation events and access control enforcement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Revocation Event Types (IDP-FR-040)</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        license_expired
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        provider_suspended
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        provider_revoked
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        privilege_revoked
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        affiliation_ended
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Enforcement Actions (IDP-FR-041)</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Revoke active sessions
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Invalidate access tokens
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Block re-authentication
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Health Provider Registry (HPR)
                  </CardTitle>
                  <CardDescription>
                    Authoritative system for provider identity and eligibility
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    The HPR decides:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>• Is this person a valid health provider?</li>
                    <li>• What roles and privileges are they entitled to?</li>
                    <li>• Where (facility context) can they practice?</li>
                  </ul>
                  <div className="pt-4 border-t">
                    <h5 className="font-semibold text-sm mb-2">Key Components</h5>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">UPID Generation</Badge>
                      <Badge variant="outline">Licensure Management</Badge>
                      <Badge variant="outline">Affiliations</Badge>
                      <Badge variant="outline">Privilege Taxonomy</Badge>
                      <Badge variant="outline">Eligibility Engine</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Identity Provider (IdP)
                  </CardTitle>
                  <CardDescription>
                    Authoritative system for authentication and token issuance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    The IdP decides:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>• Is this user who they claim to be?</li>
                    <li>• What claims can be embedded in their token?</li>
                    <li>• (Based on HPR eligibility decisions)</li>
                  </ul>
                  <div className="pt-4 border-t">
                    <h5 className="font-semibold text-sm mb-2">Critical Rule</h5>
                    <p className="text-sm text-muted-foreground italic">
                      "The IdP never decides clinical eligibility on its own — 
                      it enforces decisions received from the HPR."
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Authorization Flow</CardTitle>
                  <CardDescription>
                    End-to-end login and authorization sequence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4 p-4 bg-muted rounded-lg text-sm">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                        <UserCheck className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium">1. Authenticate</p>
                      <p className="text-xs text-muted-foreground">IdP verifies credentials</p>
                    </div>
                    <div className="text-2xl text-muted-foreground">→</div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                        <Fingerprint className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium">2. Link UPID</p>
                      <p className="text-xs text-muted-foreground">Retrieve provider record</p>
                    </div>
                    <div className="text-2xl text-muted-foreground">→</div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium">3. Check Eligibility</p>
                      <p className="text-xs text-muted-foreground">HPR evaluates access</p>
                    </div>
                    <div className="text-2xl text-muted-foreground">→</div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                        <Key className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium">4. Issue Token</p>
                      <p className="text-xs text-muted-foreground">With scoped claims</p>
                    </div>
                    <div className="text-2xl text-muted-foreground">→</div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="font-medium">5. Access Granted</p>
                      <p className="text-xs text-muted-foreground">App enforces privileges</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// Provider Registration Form Component
function ProviderRegistrationForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    first_name: '',
    surname: '',
    other_names: '',
    date_of_birth: '',
    sex: 'male' as 'male' | 'female' | 'other',
    national_id: '',
    passport_number: '',
    cadre: '',
    specialty: '',
    email: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.surname || !formData.date_of_birth || !formData.cadre) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await HPRService.createProvider({
        first_name: formData.first_name,
        surname: formData.surname,
        other_names: formData.other_names || undefined,
        date_of_birth: formData.date_of_birth,
        sex: formData.sex,
        national_id: formData.national_id || undefined,
        passport_number: formData.passport_number || undefined,
        cadre: formData.cadre,
        specialty: formData.specialty || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });
      toast.success('Provider registered successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to register provider:', error);
      toast.error('Failed to register provider');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">First Name *</label>
          <Input 
            value={formData.first_name}
            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
            placeholder="First name"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Surname *</label>
          <Input 
            value={formData.surname}
            onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
            placeholder="Surname"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Other Names</label>
        <Input 
          value={formData.other_names}
          onChange={(e) => setFormData(prev => ({ ...prev, other_names: e.target.value }))}
          placeholder="Middle names"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date of Birth *</label>
          <Input 
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Sex *</label>
          <Select value={formData.sex} onValueChange={(v) => setFormData(prev => ({ ...prev, sex: v as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">National ID</label>
          <Input 
            value={formData.national_id}
            onChange={(e) => setFormData(prev => ({ ...prev, national_id: e.target.value }))}
            placeholder="National ID number"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Passport Number</label>
          <Input 
            value={formData.passport_number}
            onChange={(e) => setFormData(prev => ({ ...prev, passport_number: e.target.value }))}
            placeholder="Passport number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Cadre/Profession *</label>
          <Select value={formData.cadre} onValueChange={(v) => setFormData(prev => ({ ...prev, cadre: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select cadre" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_CADRES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Specialty</label>
          <Input 
            value={formData.specialty}
            onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
            placeholder="Specialization area"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input 
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Email address"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone</label>
          <Input 
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Phone number"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Register Provider
            </>
          )}
        </Button>
      </div>
    </form>
  );
}