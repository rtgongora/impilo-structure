/**
 * Provider Detail Panel - Full provider management
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  UserCheck,
  FileCheck,
  Building2,
  Activity,
  History,
  ShieldCheck,
  Fingerprint,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { HPRService } from '@/services/hprService';
import type {
  HealthProvider,
  ProviderLicense,
  ProviderAffiliation,
  ProviderLifecycleState,
  EligibilityResponse,
  ProviderStateTransition,
  LicenseStatus,
} from '@/types/hpr';
import {
  LIFECYCLE_STATE_METADATA,
  LICENSE_STATUS_METADATA,
  EMPLOYMENT_TYPE_LABELS,
  PROVIDER_CADRES,
  REGISTRATION_COUNCILS,
  VALID_STATE_TRANSITIONS,
  COUNCIL_ONLY_TRANSITIONS,
} from '@/types/hpr';

interface ProviderDetailPanelProps {
  provider: HealthProvider;
  onProviderUpdated: () => void;
}

export function ProviderDetailPanel({ provider, onProviderUpdated }: ProviderDetailPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null);
  const [licenses, setLicenses] = useState<ProviderLicense[]>([]);
  const [affiliations, setAffiliations] = useState<ProviderAffiliation[]>([]);
  const [stateHistory, setStateHistory] = useState<ProviderStateTransition[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [addLicenseDialogOpen, setAddLicenseDialogOpen] = useState(false);
  const [addAffiliationDialogOpen, setAddAffiliationDialogOpen] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<ProviderLifecycleState | null>(null);
  const [transitionReason, setTransitionReason] = useState('');

  useEffect(() => {
    loadProviderData();
  }, [provider.id]);

  const loadProviderData = async () => {
    setLoading(true);
    try {
      const [eligibilityResult, licensesResult, affiliationsResult, historyResult] = await Promise.all([
        HPRService.checkEligibility(provider.id),
        HPRService.getProviderLicenses(provider.id),
        HPRService.getProviderAffiliations(provider.id),
        HPRService.getStateTransitions(provider.id),
      ]);
      setEligibility(eligibilityResult);
      setLicenses(licensesResult);
      setAffiliations(affiliationsResult);
      setStateHistory(historyResult);
    } catch (error) {
      console.error('Failed to load provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStateTransition = async () => {
    if (!selectedTransition) return;
    
    try {
      await HPRService.transitionState(provider.id, selectedTransition, transitionReason);
      toast.success(`Provider state updated to ${LIFECYCLE_STATE_METADATA[selectedTransition].label}`);
      setTransitionDialogOpen(false);
      setSelectedTransition(null);
      setTransitionReason('');
      onProviderUpdated();
      loadProviderData();
    } catch (error) {
      console.error('Failed to transition state:', error);
      toast.error('Failed to update provider state');
    }
  };

  const getStateColor = (state: ProviderLifecycleState) => {
    return LIFECYCLE_STATE_METADATA[state]?.color || 'bg-muted';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {provider.first_name} {provider.other_names} {provider.surname}
            </CardTitle>
            <p className="text-xs font-mono text-muted-foreground">{provider.upid}</p>
          </div>
          <Badge className={getStateColor(provider.lifecycle_state)}>
            {LIFECYCLE_STATE_METADATA[provider.lifecycle_state]?.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start px-4 rounded-none border-b">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="licenses" className="text-xs">
              Licenses ({licenses.length})
            </TabsTrigger>
            <TabsTrigger value="affiliations" className="text-xs">
              Affiliations ({affiliations.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4 space-y-6">
            {/* Identity Section */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4" />
                Identity
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">National ID:</span>
                  <span className="ml-2">{provider.national_id || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">DOB:</span>
                  <span className="ml-2">{provider.date_of_birth}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sex:</span>
                  <span className="ml-2 capitalize">{provider.sex}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Nationality:</span>
                  <span className="ml-2">{provider.nationality}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-2">{provider.email || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-2">{provider.phone || '-'}</span>
                </div>
              </div>
            </div>

            {/* Professional Section */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-sm">
                <FileCheck className="h-4 w-4" />
                Professional
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Cadre:</span>
                  <span className="ml-2">
                    {PROVIDER_CADRES.find(c => c.value === provider.cadre)?.label || provider.cadre}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Specialty:</span>
                  <span className="ml-2">{provider.specialty || '-'}</span>
                </div>
                {provider.sub_specialty && (
                  <div>
                    <span className="text-muted-foreground">Sub-specialty:</span>
                    <span className="ml-2">{provider.sub_specialty}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Eligibility Check */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4" />
                Eligibility Status
              </h4>
              {eligibility ? (
                <div className={`p-3 rounded-lg ${
                  eligibility.eligible 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {eligibility.eligible ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {eligibility.eligible ? 'Eligible for Clinical Access' : 'Not Eligible'}
                    </span>
                  </div>
                  {eligibility.reason_codes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {eligibility.reason_codes.map((code, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {eligibility.privileges.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">Privileges: </span>
                      <span className="text-xs">{eligibility.privileges.join(', ')}</span>
                    </div>
                  )}
                  {eligibility.license_valid_until && (
                    <p className="text-xs mt-2 text-muted-foreground">
                      License valid until: {eligibility.license_valid_until}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted text-center">
                  <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                </div>
              )}
            </div>

            {/* IdP Linkage */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-sm">
                <Fingerprint className="h-4 w-4" />
                IdP User Linkage
              </h4>
              {provider.user_id ? (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Linked to user account</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Method: {provider.user_link_verification_method || 'Unknown'} | 
                    Linked: {provider.user_linked_at ? new Date(provider.user_linked_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Not linked to user account</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Provider cannot authenticate until linked
                  </p>
                </div>
              )}
            </div>

            {/* State Transitions */}
            <div className="pt-4 border-t space-y-3">
              <h4 className="font-semibold text-sm">State Transitions</h4>
              <div className="flex flex-wrap gap-2">
                {VALID_STATE_TRANSITIONS[provider.lifecycle_state]?.map((targetState) => (
                  <Button
                    key={targetState}
                    size="sm"
                    variant={COUNCIL_ONLY_TRANSITIONS.includes(targetState) ? 'destructive' : 'outline'}
                    onClick={() => {
                      setSelectedTransition(targetState);
                      setTransitionDialogOpen(true);
                    }}
                  >
                    → {LIFECYCLE_STATE_METADATA[targetState]?.label}
                  </Button>
                ))}
                {VALID_STATE_TRANSITIONS[provider.lifecycle_state]?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No transitions available from this state</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Licenses Tab */}
          <TabsContent value="licenses" className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-sm">Professional Licenses</h4>
              <Dialog open={addLicenseDialogOpen} onOpenChange={setAddLicenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add License
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Professional License</DialogTitle>
                  </DialogHeader>
                  <AddLicenseForm 
                    providerId={provider.id} 
                    onSuccess={() => {
                      setAddLicenseDialogOpen(false);
                      loadProviderData();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-64">
              {licenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No licenses recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {licenses.map((license) => (
                    <LicenseCard 
                      key={license.id} 
                      license={license} 
                      onUpdated={loadProviderData}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Affiliations Tab */}
          <TabsContent value="affiliations" className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-sm">Facility Affiliations</h4>
              <Dialog open={addAffiliationDialogOpen} onOpenChange={setAddAffiliationDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Affiliation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Facility Affiliation</DialogTitle>
                  </DialogHeader>
                  <AddAffiliationForm 
                    providerId={provider.id} 
                    onSuccess={() => {
                      setAddAffiliationDialogOpen(false);
                      loadProviderData();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-64">
              {affiliations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No facility affiliations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {affiliations.map((affiliation) => (
                    <AffiliationCard 
                      key={affiliation.id} 
                      affiliation={affiliation}
                      onUpdated={loadProviderData}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="p-4 space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              State Transition History
            </h4>
            <ScrollArea className="h-64">
              {stateHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No state transitions recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stateHistory.map((transition) => (
                    <div 
                      key={transition.id} 
                      className="p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {new Date(transition.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {transition.from_state && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {LIFECYCLE_STATE_METADATA[transition.from_state]?.label}
                            </Badge>
                            <span>→</span>
                          </>
                        )}
                        <Badge className={`text-xs ${getStateColor(transition.to_state)}`}>
                          {LIFECYCLE_STATE_METADATA[transition.to_state]?.label}
                        </Badge>
                      </div>
                      {transition.reason && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Reason: {transition.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* State Transition Dialog */}
      <Dialog open={transitionDialogOpen} onOpenChange={setTransitionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Transition to {selectedTransition && LIFECYCLE_STATE_METADATA[selectedTransition]?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTransition && COUNCIL_ONLY_TRANSITIONS.includes(selectedTransition) && (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Council Action Required</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This transition typically requires authorization from a professional council.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Transition *</label>
              <Textarea
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                placeholder="Provide a reason for this state change..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransitionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStateTransition}
              disabled={!transitionReason.trim()}
              variant={selectedTransition && COUNCIL_ONLY_TRANSITIONS.includes(selectedTransition) ? 'destructive' : 'default'}
            >
              Confirm Transition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// License Card Component
function LicenseCard({ license, onUpdated }: { license: ProviderLicense; onUpdated: () => void }) {
  const isExpired = new Date(license.expiry_date) < new Date();
  const statusMeta = LICENSE_STATUS_METADATA[license.status];

  const handleVerify = async () => {
    try {
      await HPRService.verifyLicense(license.id);
      toast.success('License verified');
      onUpdated();
    } catch (error) {
      toast.error('Failed to verify license');
    }
  };

  const handleSuspend = async () => {
    try {
      await HPRService.updateLicenseStatus(license.id, 'suspended', 'Administrative action');
      toast.success('License suspended');
      onUpdated();
    } catch (error) {
      toast.error('Failed to suspend license');
    }
  };

  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{license.council_name}</p>
          <p className="text-xs text-muted-foreground font-mono">{license.registration_number}</p>
        </div>
        <Badge className={statusMeta?.color || 'bg-muted'}>
          {statusMeta?.label || license.status}
        </Badge>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Category: {license.license_category}</div>
        <div>Issued: {license.issue_date}</div>
        <div className={isExpired ? 'text-red-600' : ''}>
          Expires: {license.expiry_date} {isExpired && '(EXPIRED)'}
        </div>
        {license.last_verified_at && (
          <div>Verified: {new Date(license.last_verified_at).toLocaleDateString()}</div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" onClick={handleVerify}>
          <CheckCircle className="h-3 w-3 mr-1" />
          Verify
        </Button>
        {license.status === 'active' && (
          <Button size="sm" variant="outline" className="text-red-600" onClick={handleSuspend}>
            <Ban className="h-3 w-3 mr-1" />
            Suspend
          </Button>
        )}
      </div>
    </div>
  );
}

// Affiliation Card Component
function AffiliationCard({ affiliation, onUpdated }: { affiliation: ProviderAffiliation; onUpdated: () => void }) {
  const handleEndAffiliation = async () => {
    try {
      await HPRService.endAffiliation(affiliation.id, 'Administrative action');
      toast.success('Affiliation ended');
      onUpdated();
    } catch (error) {
      toast.error('Failed to end affiliation');
    }
  };

  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{affiliation.facility_name}</p>
          <p className="text-xs text-muted-foreground">{affiliation.role}</p>
        </div>
        <div className="flex items-center gap-2">
          {affiliation.is_primary && (
            <Badge variant="outline" className="text-xs">Primary</Badge>
          )}
          <Badge className={affiliation.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {affiliation.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Type: {EMPLOYMENT_TYPE_LABELS[affiliation.employment_type] || affiliation.employment_type}</div>
        <div>Dept: {affiliation.department || '-'}</div>
        <div>From: {affiliation.start_date}</div>
        <div>To: {affiliation.end_date || 'Present'}</div>
      </div>
      {affiliation.privileges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {affiliation.privileges.map((priv, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {priv}
            </Badge>
          ))}
        </div>
      )}
      {affiliation.is_active && (
        <div className="mt-3">
          <Button size="sm" variant="outline" className="text-red-600" onClick={handleEndAffiliation}>
            <Ban className="h-3 w-3 mr-1" />
            End Affiliation
          </Button>
        </div>
      )}
    </div>
  );
}

// Add License Form
function AddLicenseForm({ providerId, onSuccess }: { providerId: string; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    council_id: '',
    registration_number: '',
    license_category: '',
    issue_date: '',
    expiry_date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedCouncil = REGISTRATION_COUNCILS.find(c => c.id === formData.council_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.council_id || !formData.registration_number || !formData.issue_date || !formData.expiry_date) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await HPRService.addLicense({
        provider_id: providerId,
        council_id: formData.council_id,
        council_name: selectedCouncil?.name || formData.council_id,
        registration_number: formData.registration_number,
        license_category: formData.license_category || 'General',
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date,
      });
      toast.success('License added successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to add license:', error);
      toast.error('Failed to add license');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Registration Council *</label>
        <Select value={formData.council_id} onValueChange={(v) => setFormData(prev => ({ ...prev, council_id: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select council" />
          </SelectTrigger>
          <SelectContent>
            {REGISTRATION_COUNCILS.map((council) => (
              <SelectItem key={council.id} value={council.id}>
                {council.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Registration Number *</label>
        <Input
          value={formData.registration_number}
          onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
          placeholder="e.g. MDPCZ/12345"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">License Category</label>
        <Input
          value={formData.license_category}
          onChange={(e) => setFormData(prev => ({ ...prev, license_category: e.target.value }))}
          placeholder="e.g. General Practice, Specialist"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Issue Date *</label>
          <Input
            type="date"
            value={formData.issue_date}
            onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Expiry Date *</label>
          <Input
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          Add License
        </Button>
      </div>
    </form>
  );
}

// Add Affiliation Form
function AddAffiliationForm({ providerId, onSuccess }: { providerId: string; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    facility_id: '',
    facility_name: '',
    employment_type: 'permanent' as const,
    role: '',
    department: '',
    position_title: '',
    start_date: '',
    is_primary: false,
    privileges: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [privilegeInput, setPrivilegeInput] = useState('');

  const addPrivilege = () => {
    if (privilegeInput.trim() && !formData.privileges.includes(privilegeInput.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        privileges: [...prev.privileges, privilegeInput.trim()] 
      }));
      setPrivilegeInput('');
    }
  };

  const removePrivilege = (priv: string) => {
    setFormData(prev => ({
      ...prev,
      privileges: prev.privileges.filter(p => p !== priv)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.facility_name || !formData.role || !formData.start_date) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await HPRService.addAffiliation({
        provider_id: providerId,
        facility_id: formData.facility_id || `FAC-${Date.now()}`,
        facility_name: formData.facility_name,
        employment_type: formData.employment_type,
        role: formData.role,
        department: formData.department || undefined,
        position_title: formData.position_title || undefined,
        privileges: formData.privileges,
        start_date: formData.start_date,
        is_primary: formData.is_primary,
      });
      toast.success('Affiliation added successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to add affiliation:', error);
      toast.error('Failed to add affiliation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Facility Name *</label>
        <Input
          value={formData.facility_name}
          onChange={(e) => setFormData(prev => ({ ...prev, facility_name: e.target.value }))}
          placeholder="e.g. Central Hospital Harare"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Employment Type *</label>
          <Select 
            value={formData.employment_type} 
            onValueChange={(v: any) => setFormData(prev => ({ ...prev, employment_type: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Role *</label>
          <Input
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            placeholder="e.g. Senior Consultant"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Department</label>
          <Input
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
            placeholder="e.g. Emergency Medicine"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date *</label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Clinical Privileges</label>
        <div className="flex gap-2">
          <Input
            value={privilegeInput}
            onChange={(e) => setPrivilegeInput(e.target.value)}
            placeholder="e.g. Prescribe, Perform Surgery"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPrivilege())}
          />
          <Button type="button" variant="outline" onClick={addPrivilege}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.privileges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {formData.privileges.map((priv) => (
              <Badge key={priv} variant="secondary" className="gap-1">
                {priv}
                <button 
                  type="button" 
                  onClick={() => removePrivilege(priv)}
                  className="hover:text-red-600"
                >
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_primary"
          checked={formData.is_primary}
          onChange={(e) => setFormData(prev => ({ ...prev, is_primary: e.target.checked }))}
          className="rounded border-gray-300"
        />
        <label htmlFor="is_primary" className="text-sm">Primary affiliation</label>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          Add Affiliation
        </Button>
      </div>
    </form>
  );
}
