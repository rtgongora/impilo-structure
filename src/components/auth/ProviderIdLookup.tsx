import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  User, 
  Building2, 
  BadgeCheck, 
  Loader2, 
  AlertCircle,
  Stethoscope,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ProviderRegistryService, 
  FacilityRegistryService,
  type ProviderRegistryRecord,
  type FacilityRegistryRecord 
} from '@/services/registryServices';
import { toast } from 'sonner';

interface ProviderIdLookupProps {
  onProviderFound: (provider: ProviderRegistryRecord, facility: FacilityRegistryRecord) => void;
  onCancel: () => void;
}

export const ProviderIdLookup: React.FC<ProviderIdLookupProps> = ({
  onProviderFound,
  onCancel
}) => {
  const [providerId, setProviderId] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [facilities, setFacilities] = useState<FacilityRegistryRecord[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [provider, setProvider] = useState<ProviderRegistryRecord | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<FacilityRegistryRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'facility' | 'provider' | 'confirm'>('facility');

  // Load facilities on mount
  React.useEffect(() => {
    const loadFacilities = async () => {
      setIsLoadingFacilities(true);
      try {
        const data = await FacilityRegistryService.getAllFacilities();
        setFacilities(data);
      } catch (err) {
        toast.error('Failed to load facilities');
      } finally {
        setIsLoadingFacilities(false);
      }
    };
    loadFacilities();
  }, []);

  const handleFacilitySelect = async (gofrId: string) => {
    setSelectedFacilityId(gofrId);
    const facility = facilities.find(f => f.gofrId === gofrId);
    if (facility) {
      setSelectedFacility(facility);
      setStep('provider');
    }
  };

  const handleProviderLookup = async () => {
    if (!providerId.trim()) {
      setError('Please enter your Provider ID');
      return;
    }

    setIsLookingUp(true);
    setError(null);

    try {
      const result = await ProviderRegistryService.lookupProvider(providerId.trim());
      
      if (result) {
        setProvider(result);
        setStep('confirm');
      } else {
        setError('Provider ID not found in the registry. Please check your ID and try again.');
      }
    } catch (err) {
      setError('Failed to lookup provider. Please try again.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleConfirm = () => {
    if (provider && selectedFacility) {
      onProviderFound(provider, selectedFacility);
    }
  };

  const handleBack = () => {
    if (step === 'provider') {
      setStep('facility');
      setSelectedFacility(null);
      setSelectedFacilityId('');
    } else if (step === 'confirm') {
      setStep('provider');
      setProvider(null);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-border/50">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Stethoscope className="w-8 h-8 text-primary" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Impilo Digital Health Platform
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 'facility' && 'Select your health facility'}
            {step === 'provider' && 'Enter your Provider Registry ID'}
            {step === 'confirm' && 'Confirm your identity'}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Facility Selection */}
          {step === 'facility' && (
            <motion.div
              key="facility"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="facility">Health Facility (GOFR)</Label>
                <Select 
                  value={selectedFacilityId} 
                  onValueChange={handleFacilitySelect}
                  disabled={isLoadingFacilities}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isLoadingFacilities ? "Loading facilities..." : "Select your facility"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((facility) => (
                      <SelectItem key={facility.gofrId} value={facility.gofrId}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{facility.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {facility.address.city}, {facility.address.province}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="w-full" onClick={onCancel}>
                Cancel
              </Button>
            </motion.div>
          )}

          {/* Step 2: Provider ID Entry */}
          {step === 'provider' && (
            <motion.div
              key="provider"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Selected Facility Display */}
              {selectedFacility && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{selectedFacility.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedFacility.address.city}, {selectedFacility.address.province}
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {selectedFacility.gofrId}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="provider-id">Provider ID (iHRIS)</Label>
                <div className="relative">
                  <Input
                    id="provider-id"
                    type="text"
                    placeholder="IHRIS-2025-123456"
                    value={providerId}
                    onChange={(e) => {
                      setProviderId(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    className="pr-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleProviderLookup()}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your Provider Registry ID issued by the Health Professions Authority
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleBack}>
                  Back
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleProviderLookup}
                  disabled={isLookingUp || !providerId.trim()}
                >
                  {isLookingUp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirm' && provider && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{provider.fullName}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {provider.role}
                      {provider.specialty && ` • ${provider.specialty}`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Provider ID</p>
                    <p className="font-mono text-xs">{provider.providerId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p>{provider.department || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">License</p>
                    <p>{provider.licenseNumber || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge 
                      variant={provider.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {provider.status}
                    </Badge>
                  </div>
                </div>

                {provider.biometricEnrolled && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <BadgeCheck className="w-4 h-4" />
                    <span className="text-sm">Biometrics enrolled</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-center text-muted-foreground">
                Is this you? Proceed to biometric verification.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleBack}>
                  Not Me
                </Button>
                <Button className="flex-1" onClick={handleConfirm}>
                  Verify Identity
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OpenHIE Branding */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>iHRIS Provider Registry</span>
            <span>•</span>
            <span>GOFR Facility Registry</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderIdLookup;
