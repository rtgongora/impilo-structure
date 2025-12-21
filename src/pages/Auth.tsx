import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProviderIdLookup } from '@/components/auth/ProviderIdLookup';
import { BiometricAuth } from '@/components/auth/BiometricAuth';
import { 
  type ProviderRegistryRecord, 
  type FacilityRegistryRecord 
} from '@/services/registryServices';

type AuthView = 'lookup' | 'biometric';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  const [view, setView] = useState<AuthView>('lookup');
  const [provider, setProvider] = useState<ProviderRegistryRecord | null>(null);
  const [facility, setFacility] = useState<FacilityRegistryRecord | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleProviderFound = (
    providerData: ProviderRegistryRecord, 
    facilityData: FacilityRegistryRecord
  ) => {
    setProvider(providerData);
    setFacility(facilityData);
    setView('biometric');
  };

  const handleBiometricVerified = async (method: string, confidence: number) => {
    if (!provider) return;

    try {
      // Find the user account associated with this provider ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('provider_registry_id', provider.providerId)
        .maybeSingle();

      if (!profile) {
        toast.error('No user account linked to this Provider ID');
        setView('lookup');
        return;
      }

      // Log the biometric authentication
      await supabase.from('provider_registry_logs').insert({
        user_id: profile.user_id,
        provider_registry_id: provider.providerId,
        action: 'biometric_login',
        biometric_method: method,
        verification_status: 'success',
        user_agent: navigator.userAgent
      });

      // For demo purposes, we'll sign in with a magic link approach
      // In production, this would use a secure token-based auth after biometric verification
      toast.success(`Welcome, ${provider.fullName}!`, {
        description: `Verified via ${method} (${(confidence * 100).toFixed(1)}% confidence)`
      });

      // Redirect to dashboard - in production, this would complete the auth session
      navigate('/');
      
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Failed to complete authentication');
    }
  };

  const handleBiometricFailed = (error: string) => {
    toast.error('Biometric verification failed', { description: error });
    setView('lookup');
    setProvider(null);
    setFacility(null);
  };

  const handleCancel = () => {
    setView('lookup');
    setProvider(null);
    setFacility(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      {view === 'lookup' && (
        <ProviderIdLookup 
          onProviderFound={handleProviderFound}
          onCancel={() => navigate('/')}
        />
      )}

      {view === 'biometric' && provider && (
        <BiometricAuth
          providerId={provider.providerId}
          onVerified={handleBiometricVerified}
          onFailed={handleBiometricFailed}
          onCancel={handleCancel}
          requiredMethods={['fingerprint', 'facial', 'iris']}
        />
      )}
    </div>
  );
};

export default Auth;
