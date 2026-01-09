/**
 * Facility Detail Panel
 * Shows comprehensive facility information
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Clock,
  Bed,
  Zap,
  Droplets,
  Wifi,
  X,
  ExternalLink,
  Edit,
  CheckCircle,
  AlertCircle,
  FileText,
  Stethoscope,
  History,
  Link2,
} from 'lucide-react';
import type { Facility } from '@/types/facility';
import { 
  FACILITY_WORKFLOW_STATUS_COLORS, 
  FACILITY_WORKFLOW_STATUS_LABELS,
  OPERATIONAL_STATUS_COLORS,
  OPERATIONAL_STATUS_LABELS 
} from '@/types/facility';
import { useFacilityServices, useFacilityIdentifiers } from '@/hooks/useFacilityData';
import { cn } from '@/lib/utils';

interface FacilityDetailPanelProps {
  facility: Facility;
  onClose: () => void;
  onUpdate: () => void;
}

export const FacilityDetailPanel = ({ facility, onClose, onUpdate }: FacilityDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { services, loading: servicesLoading } = useFacilityServices(facility.id);
  const { identifiers, loading: identifiersLoading } = useFacilityIdentifiers(facility.id);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {facility.name}
            </CardTitle>
            <p className="text-sm font-mono text-muted-foreground">
              {facility.facility_code || facility.gofr_id || 'No ID assigned'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge className={cn("text-xs", FACILITY_WORKFLOW_STATUS_COLORS[facility.workflow_status])}>
            {FACILITY_WORKFLOW_STATUS_LABELS[facility.workflow_status]}
          </Badge>
          <Badge 
            variant="outline" 
            className={cn("text-xs", OPERATIONAL_STATUS_COLORS[facility.operational_status])}
          >
            {OPERATIONAL_STATUS_LABELS[facility.operational_status]}
          </Badge>
          {facility.is_verified && (
            <Badge variant="outline" className="text-xs gap-1 text-emerald-600">
              <CheckCircle className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 flex-shrink-0">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="services" className="flex-1">Services</TabsTrigger>
          <TabsTrigger value="identifiers" className="flex-1">IDs</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="overview" className="m-0 p-4 space-y-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{facility.facility_type || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Level</p>
                  <p className="font-medium">{facility.level || 'Unknown'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </h4>
              <div className="space-y-2 text-sm">
                {facility.physical_address || facility.address_line1 ? (
                  <p>{facility.physical_address || facility.address_line1}</p>
                ) : null}
                <p>
                  {[facility.city, facility.province, facility.country].filter(Boolean).join(', ') || 'No address'}
                </p>
                {facility.latitude && facility.longitude && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {facility.latitude.toFixed(6)}, {facility.longitude.toFixed(6)}
                    </span>
                    <Button variant="link" size="sm" className="h-auto p-0">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Map
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>
              <div className="space-y-2 text-sm">
                {facility.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{facility.phone}</span>
                  </div>
                )}
                {facility.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{facility.email}</span>
                  </div>
                )}
                {facility.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={facility.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {facility.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Infrastructure */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Infrastructure</h4>
              <div className="grid grid-cols-2 gap-3">
                {facility.bed_count !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    <span>{facility.bed_count} beds</span>
                  </div>
                )}
                {facility.is_24hr && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>24/7 Service</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Zap className={cn("h-4 w-4", facility.has_electricity ? "text-amber-500" : "text-muted-foreground")} />
                  <span className={!facility.has_electricity ? "text-muted-foreground" : ""}>
                    Electricity {facility.has_electricity ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Droplets className={cn("h-4 w-4", facility.has_water ? "text-blue-500" : "text-muted-foreground")} />
                  <span className={!facility.has_water ? "text-muted-foreground" : ""}>
                    Water {facility.has_water ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wifi className={cn("h-4 w-4", facility.has_internet ? "text-green-500" : "text-muted-foreground")} />
                  <span className={!facility.has_internet ? "text-muted-foreground" : ""}>
                    Internet {facility.has_internet ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>

            {/* Managing Organization */}
            {facility.managing_org_name && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Managing Organization</h4>
                  <p className="text-sm">{facility.managing_org_name}</p>
                  {facility.managing_org_contact && (
                    <p className="text-sm text-muted-foreground">{facility.managing_org_contact}</p>
                  )}
                </div>
              </>
            )}

            {/* Licensing */}
            {(facility.license_number || facility.accreditation_status) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Licensing & Accreditation</h4>
                  {facility.license_number && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">License #</p>
                      <p className="font-mono">{facility.license_number}</p>
                      {facility.license_expiry && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(facility.license_expiry).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                  {facility.accreditation_status && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Accreditation</p>
                      <p>{facility.accreditation_status}</p>
                      {facility.accreditation_body && (
                        <p className="text-xs text-muted-foreground">by {facility.accreditation_body}</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="services" className="m-0 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Services Offered
                </h4>
                <Button variant="outline" size="sm">Add Service</Button>
              </div>
              {servicesLoading ? (
                <p className="text-sm text-muted-foreground">Loading services...</p>
              ) : services.length === 0 ? (
                <div className="py-8 text-center">
                  <Stethoscope className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No services registered yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {services.map(service => (
                    <div key={service.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{service.service_name}</p>
                        {service.operating_days && (
                          <p className="text-xs text-muted-foreground">{service.operating_days}</p>
                        )}
                      </div>
                      <Badge variant={service.is_available ? "default" : "secondary"}>
                        {service.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="identifiers" className="m-0 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Identifiers / Crosswalks
                </h4>
                <Button variant="outline" size="sm">Add ID</Button>
              </div>
              {/* Primary IDs */}
              <div className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Thuso ID (Primary)</p>
                  <p className="font-mono font-medium">{facility.facility_code || 'Not assigned'}</p>
                </div>
                {facility.gofr_id && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">GOFR ID</p>
                    <p className="font-mono">{facility.gofr_id}</p>
                  </div>
                )}
                {facility.dhis2_uid && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">DHIS2 UID</p>
                    <p className="font-mono">{facility.dhis2_uid}</p>
                  </div>
                )}
                {facility.legacy_code && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Legacy Code</p>
                    <p className="font-mono">{facility.legacy_code}</p>
                  </div>
                )}
              </div>
              {/* Additional identifiers */}
              {identifiers.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h5 className="text-xs font-medium text-muted-foreground">Additional Identifiers</h5>
                  {identifiers.map(id => (
                    <div key={id.id} className="p-2 border rounded-lg text-sm">
                      <p className="text-xs text-muted-foreground">{id.identifier_type}</p>
                      <p className="font-mono">{id.identifier_value}</p>
                      {id.source_system && (
                        <p className="text-xs text-muted-foreground">Source: {id.source_system}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="m-0 p-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <History className="h-4 w-4" />
                Change History
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <div className="p-1 rounded-full bg-muted">
                    <FileText className="h-3 w-3" />
                  </div>
                  <div>
                    <p>Record created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(facility.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {facility.submitted_at && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="p-1 rounded-full bg-amber-100">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                    </div>
                    <div>
                      <p>Submitted for approval</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(facility.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {facility.approved_at && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="p-1 rounded-full bg-emerald-100">
                      <CheckCircle className="h-3 w-3 text-emerald-600" />
                    </div>
                    <div>
                      <p>Approved</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(facility.approved_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <div className="p-4 border-t flex-shrink-0">
        <Button className="w-full gap-2">
          <Edit className="h-4 w-4" />
          Edit Facility
        </Button>
      </div>
    </Card>
  );
};
