/**
 * Health ID Verification Component
 * Verify and lookup Health IDs
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  CheckCircle, 
  XCircle,
  User,
  Calendar,
  Phone,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { verifyHealthId } from '@/hooks/useClientRegistryData';
import type { ClientRecord } from '@/types/clientRegistry';
import { LIFECYCLE_STATE_LABELS, LIFECYCLE_STATE_COLORS } from '@/types/clientRegistry';

interface HealthIdVerificationProps {
  onClose: () => void;
}

export function HealthIdVerification({ onClose }: HealthIdVerificationProps) {
  const [healthId, setHealthId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    client?: ClientRecord;
    status?: string;
  } | null>(null);

  const handleVerify = async () => {
    if (!healthId.trim()) return;
    
    setLoading(true);
    try {
      const verification = await verifyHealthId(healthId.trim());
      setResult(verification);
    } catch (error) {
      setResult({ valid: false });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setHealthId('');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {!result ? (
        <>
          <div>
            <Label>Health ID</Label>
            <Input
              placeholder="Enter Health ID (e.g., HID-0000000001-ABCD-1)"
              value={healthId}
              onChange={(e) => setHealthId(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the full Health ID from the patient's card or QR code
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={!healthId.trim() || loading}>
              {loading ? 'Verifying...' : 'Verify'}
              <Search className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      ) : (
        <>
          {result.valid && result.client ? (
            <div className="space-y-4">
              {/* Valid Result */}
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-800">Health ID Verified</p>
                  <p className="text-sm text-emerald-600">This is a valid Health ID</p>
                </div>
              </div>

              {/* Client Info */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">
                      {result.client.given_names} {result.client.family_name}
                    </h4>
                    <p className="text-sm font-mono text-muted-foreground">
                      {result.client.health_id}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {result.client.date_of_birth 
                        ? format(new Date(result.client.date_of_birth), 'dd MMM yyyy')
                        : 'DOB not recorded'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="capitalize">{result.client.sex}</span>
                  </div>
                  {result.client.phone_primary && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{result.client.phone_primary}</span>
                    </div>
                  )}
                  {result.client.province && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{result.client.province}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <Badge className={LIFECYCLE_STATE_COLORS[result.client.lifecycle_state]}>
                    {LIFECYCLE_STATE_LABELS[result.client.lifecycle_state]}
                  </Badge>
                  
                  {result.client.lifecycle_state === 'deceased' && (
                    <p className="text-sm text-red-600 mt-2">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      This client is marked as deceased
                    </p>
                  )}
                  
                  {result.client.lifecycle_state === 'merged' && (
                    <p className="text-sm text-purple-600 mt-2">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      This identity has been merged into another record
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Invalid Result */}
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Health ID Not Found</p>
                  <p className="text-sm text-red-600">
                    This Health ID does not exist in the registry
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Searched:</strong>{' '}
                  <span className="font-mono">{healthId}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please check the ID and try again. If the problem persists, 
                  the client may need to be registered.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>
              Verify Another
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
