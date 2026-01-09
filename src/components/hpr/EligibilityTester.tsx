/**
 * Eligibility Tester - Interactive eligibility check tool
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  FileJson,
  Info,
} from 'lucide-react';
import { HPRService } from '@/services/hprService';
import type { HealthProvider, EligibilityResponse } from '@/types/hpr';

const COMMON_PRIVILEGES = [
  'prescribe',
  'order_lab',
  'order_imaging',
  'perform_surgery',
  'administer_medication',
  'discharge_patient',
  'admit_patient',
  'view_records',
  'edit_records',
];

export function EligibilityTester() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<HealthProvider | null>(null);
  const [searchResults, setSearchResults] = useState<HealthProvider[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [requestedRole, setRequestedRole] = useState('');
  const [requestedPrivileges, setRequestedPrivileges] = useState<string[]>([]);
  const [facilityContext, setFacilityContext] = useState('');
  
  const [result, setResult] = useState<EligibilityResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const results = await HPRService.searchProviders(searchQuery, { limit: 10 });
      setSearchResults(results);
      if (results.length === 0) {
        toast.info('No providers found');
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleCheckEligibility = async () => {
    if (!selectedProvider) {
      toast.error('Please select a provider');
      return;
    }

    setChecking(true);
    setResult(null);
    const startTime = Date.now();

    try {
      const eligibility = await HPRService.checkEligibility(
        selectedProvider.id,
        requestedRole || undefined,
        requestedPrivileges.length > 0 ? requestedPrivileges : undefined,
        facilityContext || undefined
      );
      setResult(eligibility);
      setResponseTime(Date.now() - startTime);
    } catch (error) {
      console.error('Eligibility check failed:', error);
      toast.error('Eligibility check failed');
    } finally {
      setChecking(false);
    }
  };

  const togglePrivilege = (privilege: string) => {
    setRequestedPrivileges(prev =>
      prev.includes(privilege)
        ? prev.filter(p => p !== privilege)
        : [...prev, privilege]
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Select Provider
            </CardTitle>
            <CardDescription>
              Search and select a provider to check eligibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or UPID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-48 overflow-auto">
                {searchResults.map((provider) => (
                  <div
                    key={provider.id}
                    className={`p-3 cursor-pointer hover:bg-muted border-b last:border-b-0 ${
                      selectedProvider?.id === provider.id ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <p className="font-medium text-sm">
                      {provider.first_name} {provider.surname}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {provider.upid}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {provider.cadre} • {provider.lifecycle_state}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {selectedProvider && (
              <div className="p-3 border rounded-lg bg-primary/5">
                <p className="font-medium text-sm">Selected Provider:</p>
                <p className="text-sm">
                  {selectedProvider.first_name} {selectedProvider.surname}
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  {selectedProvider.upid}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Request Parameters
            </CardTitle>
            <CardDescription>
              Configure the eligibility check parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Requested Role</label>
              <Input
                placeholder="e.g. clinician, nurse, pharmacist"
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Facility Context</label>
              <Input
                placeholder="e.g. FAC-001"
                value={facilityContext}
                onChange={(e) => setFacilityContext(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Requested Privileges</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_PRIVILEGES.map((privilege) => (
                  <Badge
                    key={privilege}
                    variant={requestedPrivileges.includes(privilege) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => togglePrivilege(privilege)}
                  >
                    {privilege}
                  </Badge>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleCheckEligibility} 
              disabled={!selectedProvider || checking}
              className="w-full"
            >
              {checking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Check Eligibility
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Result Display */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Eligibility Decision
              </CardTitle>
              {responseTime !== null && (
                <Badge variant="outline" className="text-xs">
                  {responseTime}ms
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Decision Summary */}
              <div className={`p-6 rounded-lg ${
                result.eligible 
                  ? 'bg-green-50 border-2 border-green-200' 
                  : 'bg-red-50 border-2 border-red-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {result.eligible ? (
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  ) : (
                    <XCircle className="h-10 w-10 text-red-600" />
                  )}
                  <div>
                    <p className="text-xl font-bold">
                      {result.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.eligible 
                        ? 'Provider can access clinical systems' 
                        : 'Access denied'}
                    </p>
                  </div>
                </div>

                {result.reason_codes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Reason Codes:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.reason_codes.map((code, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Granted Claims */}
              <div className="space-y-4">
                {result.eligible && (
                  <>
                    <div>
                      <p className="text-sm font-medium mb-2">Granted Roles:</p>
                      <div className="flex flex-wrap gap-1">
                        {result.roles.length > 0 ? (
                          result.roles.map((role, i) => (
                            <Badge key={i} className="bg-green-100 text-green-800">
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Granted Privileges:</p>
                      <div className="flex flex-wrap gap-1">
                        {result.privileges.length > 0 ? (
                          result.privileges.map((priv, i) => (
                            <Badge key={i} className="bg-blue-100 text-blue-800">
                              {priv}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Facility Scope:</p>
                      <div className="flex flex-wrap gap-1">
                        {result.facility_scope.length > 0 ? (
                          result.facility_scope.map((fac, i) => (
                            <Badge key={i} variant="outline">
                              {fac}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">All facilities</span>
                        )}
                      </div>
                    </div>

                    {result.license_valid_until && (
                      <div>
                        <p className="text-sm font-medium">License Valid Until:</p>
                        <p className="text-sm">{result.license_valid_until}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Raw JSON */}
            <div className="mt-6">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Raw Response (for token claims)
              </p>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-48">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eligibility API Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Database Function:</p>
            <code className="text-xs bg-muted p-2 rounded block">
              check_provider_eligibility(p_provider_id, p_requested_role, p_requested_privileges, p_facility_context)
            </code>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Eligibility Criteria (evaluated in order):</p>
            <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
              <li>Provider must exist in health_providers table</li>
              <li>Provider lifecycle_state must be 'active'</li>
              <li>At least one active, non-expired license must exist</li>
              <li>If facility_context provided, must have active affiliation there</li>
              <li>If requested_role provided, must be granted via affiliation</li>
              <li>If requested_privileges provided, all must be granted via affiliation</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
