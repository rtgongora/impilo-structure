/**
 * Client Detail Panel
 * Displays comprehensive client information with edit capabilities
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  User, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  FileText,
  Users,
  Fingerprint,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  History,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';
import { useClientIdentifiers, useClientRelationships } from '@/hooks/useClientRegistryData';
import type { ClientRecord, ClientLifecycleState } from '@/types/clientRegistry';
import { 
  LIFECYCLE_STATE_LABELS, 
  LIFECYCLE_STATE_COLORS,
  IDENTIFIER_TYPE_LABELS,
  CONFIDENCE_LABELS,
  CONFIDENCE_COLORS,
  RELATIONSHIP_TYPE_LABELS,
} from '@/types/clientRegistry';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ClientDetailPanelProps {
  client: ClientRecord;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<ClientRecord>) => Promise<ClientRecord>;
  onStateChange: (id: string, newState: ClientLifecycleState, reason?: string) => Promise<void>;
  onMarkDeceased: (id: string, deceasedDate: string, source: string) => Promise<void>;
}

export function ClientDetailPanel({ 
  client, 
  onClose, 
  onUpdate,
  onStateChange,
  onMarkDeceased 
}: ClientDetailPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeceasedDialog, setShowDeceasedDialog] = useState(false);
  const [deceasedDate, setDeceasedDate] = useState('');
  const [deceasedSource, setDeceasedSource] = useState('');
  
  const { identifiers, loading: loadingIdentifiers } = useClientIdentifiers(client.id);
  const { relationships, loading: loadingRelationships } = useClientRelationships(client.id);

  const handleMarkDeceased = async () => {
    await onMarkDeceased(client.id, deceasedDate, deceasedSource);
    setShowDeceasedDialog(false);
  };

  const handleActivate = async () => {
    await onStateChange(client.id, 'active', 'Identity verified and activated');
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Client Details
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client Header */}
        <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">
              {client.given_names} {client.family_name}
            </h3>
            <p className="font-mono text-sm text-muted-foreground">{client.health_id}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={LIFECYCLE_STATE_COLORS[client.lifecycle_state]}>
                {LIFECYCLE_STATE_LABELS[client.lifecycle_state]}
              </Badge>
              {client.biometric_enrolled && (
                <Badge variant="outline" className="gap-1">
                  <Fingerprint className="h-3 w-3" />
                  Biometric
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          {client.lifecycle_state === 'draft' && (
            <Button size="sm" onClick={handleActivate} className="gap-1">
              <CheckCircle className="h-4 w-4" />
              Activate
            </Button>
          )}
          {client.lifecycle_state === 'active' && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowDeceasedDialog(true)}
                className="gap-1"
              >
                <XCircle className="h-4 w-4" />
                Mark Deceased
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStateChange(client.id, 'inactive', 'Marked inactive')}
                className="gap-1"
              >
                <Clock className="h-4 w-4" />
                Deactivate
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" className="gap-1">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>

        <Separator />

        {/* Detail Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="identifiers">
              IDs ({identifiers.length})
            </TabsTrigger>
            <TabsTrigger value="relationships">
              Relations ({relationships.length})
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Demographics */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Demographics</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Sex</p>
                  <p className="font-medium capitalize">{client.sex}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {client.date_of_birth ? format(new Date(client.date_of_birth), 'dd MMM yyyy') : 'Unknown'}
                    {client.estimated_dob && <span className="text-xs ml-1">(estimated)</span>}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nationality</p>
                  <p className="font-medium">{client.nationality || 'Zimbabwe'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Place of Birth</p>
                  <p className="font-medium">{client.place_of_birth || '-'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Contact Information</h4>
              <div className="space-y-2 text-sm">
                {client.phone_primary && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.phone_primary}</span>
                    {client.phone_secondary && (
                      <span className="text-muted-foreground">/ {client.phone_secondary}</span>
                    )}
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Address */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Address</h4>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {client.address_line1 && <p>{client.address_line1}</p>}
                  {client.village && <p>{client.village}</p>}
                  <p>
                    {[client.ward, client.district, client.province]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p>{client.country || 'Zimbabwe'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Provenance */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Record Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(client.created_at), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {format(new Date(client.updated_at), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Source System</p>
                  <p className="font-medium">{client.source_system || 'Direct Entry'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="font-medium">{client.version_id}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="identifiers" className="mt-4">
            {loadingIdentifiers ? (
              <p className="text-center py-4 text-muted-foreground">Loading...</p>
            ) : identifiers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No identifiers linked</p>
                <Button size="sm" variant="outline" className="mt-2">
                  Add Identifier
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {identifiers.map((id) => (
                  <div key={id.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {IDENTIFIER_TYPE_LABELS[id.identifier_type] || id.identifier_type}
                        </p>
                        <p className="font-mono text-sm">{id.identifier_value}</p>
                        {id.assigning_authority && (
                          <p className="text-xs text-muted-foreground">
                            Issued by: {id.assigning_authority}
                          </p>
                        )}
                      </div>
                      <Badge className={CONFIDENCE_COLORS[id.confidence]}>
                        {CONFIDENCE_LABELS[id.confidence]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="relationships" className="mt-4">
            {loadingRelationships ? (
              <p className="text-center py-4 text-muted-foreground">Loading...</p>
            ) : relationships.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No relationships recorded</p>
                <Button size="sm" variant="outline" className="mt-2">
                  Add Relationship
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {relationships.map((rel) => (
                  <div key={rel.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline">
                          {RELATIONSHIP_TYPE_LABELS[rel.relationship_type]}
                        </Badge>
                        <p className="font-medium mt-1">
                          {rel.related_person_name || 'Linked Client'}
                        </p>
                        {rel.related_person_phone && (
                          <p className="text-sm text-muted-foreground">
                            {rel.related_person_phone}
                          </p>
                        )}
                      </div>
                      {rel.is_active ? (
                        <Badge variant="outline" className="text-emerald-600">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>State transition history</p>
              <p className="text-sm">Coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Mark Deceased Dialog */}
      <AlertDialog open={showDeceasedDialog} onOpenChange={setShowDeceasedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Client as Deceased</AlertDialogTitle>
            <AlertDialogDescription>
              This action will update the client's status to deceased and block new encounters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Date of Death</Label>
              <Input
                type="date"
                value={deceasedDate}
                onChange={(e) => setDeceasedDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Source/Confirmation</Label>
              <Input
                placeholder="e.g., Death certificate, Hospital record"
                value={deceasedSource}
                onChange={(e) => setDeceasedSource(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkDeceased}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
