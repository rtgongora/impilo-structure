import { useState } from "react";
import { Skull, MapPin, Clock, User, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeathDeclarationFormProps {
  dischargeCaseId: string;
  patientName?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

const MANNER_OF_DEATH = [
  { value: 'natural', label: 'Natural' },
  { value: 'accident', label: 'Accident' },
  { value: 'suicide', label: 'Suicide' },
  { value: 'homicide', label: 'Homicide' },
  { value: 'pending_investigation', label: 'Pending Investigation' },
  { value: 'unknown', label: 'Unknown' }
];

const PLACE_OF_DEATH = [
  { value: 'hospital_ward', label: 'Hospital Ward' },
  { value: 'emergency_department', label: 'Emergency Department' },
  { value: 'icu', label: 'ICU' },
  { value: 'operating_theatre', label: 'Operating Theatre' },
  { value: 'labour_ward', label: 'Labour Ward' },
  { value: 'home', label: 'Home' },
  { value: 'transit', label: 'In Transit' },
  { value: 'other', label: 'Other' }
];

interface FormData {
  certificationType: 'facility' | 'community';
  practitionerName: string;
  practitionerQualification: string;
  practitionerRegNumber: string;
  communityVerifierName: string;
  communityVerifierRole: string;
  deathDatetime: string;
  placeOfDeath: string;
  placeDetails: string;
  immediateCause: string;
  underlyingCause: string;
  contributingCauses: string;
  mannerOfDeath: string;
}

export function DeathDeclarationForm({ 
  dischargeCaseId, 
  patientName,
  onComplete, 
  onCancel 
}: DeathDeclarationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    certificationType: 'facility',
    practitionerName: '',
    practitionerQualification: 'medical_practitioner',
    practitionerRegNumber: '',
    communityVerifierName: '',
    communityVerifierRole: '',
    deathDatetime: new Date().toISOString().slice(0, 16),
    placeOfDeath: 'hospital_ward',
    placeDetails: '',
    immediateCause: '',
    underlyingCause: '',
    contributingCauses: '',
    mannerOfDeath: 'natural'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (formData.certificationType === 'facility') {
      if (!formData.practitionerName || !formData.practitionerQualification) {
        toast.error("Practitioner details are required for facility deaths");
        return;
      }
      if (formData.practitionerQualification !== 'medical_practitioner') {
        toast.error("Only medical practitioners can certify facility deaths in Zimbabwe");
        return;
      }
    } else {
      if (!formData.communityVerifierName || !formData.communityVerifierRole) {
        toast.error("Community verifier details are required");
        return;
      }
    }

    if (!formData.immediateCause) {
      toast.error("Immediate cause of death is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('death_certifications')
        .insert([{
          discharge_case_id: dischargeCaseId,
          certification_type: formData.certificationType,
          practitioner_name: formData.practitionerName || 'N/A',
          practitioner_qualification: formData.practitionerQualification || 'N/A',
          practitioner_registration_number: formData.practitionerRegNumber || null,
          community_verifier_name: formData.communityVerifierName || null,
          community_verifier_role: formData.communityVerifierRole || null,
          certification_datetime: formData.deathDatetime,
          place_of_certification: formData.placeOfDeath,
          immediate_cause: formData.immediateCause,
          underlying_cause: formData.underlyingCause || null,
          contributing_causes: formData.contributingCauses 
            ? formData.contributingCauses.split(',').map(s => s.trim())
            : null,
          manner_of_death: formData.mannerOfDeath
        }] as any);

      if (error) throw error;

      // Update discharge case
      await supabase
        .from('discharge_cases')
        .update({
          death_datetime: formData.deathDatetime,
          death_place: formData.placeOfDeath,
          is_community_death: formData.certificationType === 'community'
        } as any)
        .eq('id', dischargeCaseId);

      toast.success("Death certification recorded");
      onComplete?.();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("Failed to record death certification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-purple-200">
      <CardHeader className="bg-purple-50">
        <div className="flex items-center gap-3">
          <Skull className="w-6 h-6 text-purple-600" />
          <div>
            <CardTitle>Death Certification</CardTitle>
            <CardDescription>
              {patientName && `Patient: ${patientName}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Certification Type */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Certification Type *</Label>
          <RadioGroup
            value={formData.certificationType}
            onValueChange={(v) => updateField('certificationType', v as 'facility' | 'community')}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <RadioGroupItem value="facility" id="facility" />
              <Label htmlFor="facility" className="flex-1 cursor-pointer">
                <div className="font-medium">Facility Death</div>
                <div className="text-sm text-muted-foreground">
                  Medical practitioner certification
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <RadioGroupItem value="community" id="community" />
              <Label htmlFor="community" className="flex-1 cursor-pointer">
                <div className="font-medium">Community Death</div>
                <div className="text-sm text-muted-foreground">
                  Community verifier confirmation
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Facility Certification Details */}
        {formData.certificationType === 'facility' && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">Certifying Medical Practitioner</span>
            </div>
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              In Zimbabwe, only registered medical practitioners can certify facility deaths
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Practitioner Name *</Label>
                <Input
                  value={formData.practitionerName}
                  onChange={(e) => updateField('practitionerName', e.target.value)}
                  placeholder="Dr. John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input
                  value={formData.practitionerRegNumber}
                  onChange={(e) => updateField('practitionerRegNumber', e.target.value)}
                  placeholder="MDCZ/123456"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Qualification *</Label>
              <Select
                value={formData.practitionerQualification}
                onValueChange={(v) => updateField('practitionerQualification', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical_practitioner">Medical Practitioner (Required)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Community Certification Details */}
        {formData.certificationType === 'community' && (
          <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-600" />
              <span className="font-medium text-orange-800">Community Verifier</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Verifier Name *</Label>
                <Input
                  value={formData.communityVerifierName}
                  onChange={(e) => updateField('communityVerifierName', e.target.value)}
                  placeholder="Name of community leader"
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={formData.communityVerifierRole}
                  onValueChange={(v) => updateField('communityVerifierRole', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chief">Chief</SelectItem>
                    <SelectItem value="headman">Headman</SelectItem>
                    <SelectItem value="village_head">Village Head</SelectItem>
                    <SelectItem value="police_officer">Police Officer</SelectItem>
                    <SelectItem value="health_worker">Community Health Worker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Death Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Date & Time of Death *
            </Label>
            <Input
              type="datetime-local"
              value={formData.deathDatetime}
              onChange={(e) => updateField('deathDatetime', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Place of Death *
            </Label>
            <Select
              value={formData.placeOfDeath}
              onValueChange={(v) => updateField('placeOfDeath', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACE_OF_DEATH.map(place => (
                  <SelectItem key={place.value} value={place.value}>
                    {place.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cause of Death */}
        <div className="space-y-4">
          <Label className="text-base font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Cause of Death
          </Label>
          
          <div className="space-y-2">
            <Label>Immediate Cause *</Label>
            <Textarea
              value={formData.immediateCause}
              onChange={(e) => updateField('immediateCause', e.target.value)}
              placeholder="Disease or condition directly leading to death"
            />
          </div>

          <div className="space-y-2">
            <Label>Underlying Cause</Label>
            <Textarea
              value={formData.underlyingCause}
              onChange={(e) => updateField('underlyingCause', e.target.value)}
              placeholder="Disease or injury that initiated the events leading to death"
            />
          </div>

          <div className="space-y-2">
            <Label>Contributing Causes</Label>
            <Textarea
              value={formData.contributingCauses}
              onChange={(e) => updateField('contributingCauses', e.target.value)}
              placeholder="Other significant conditions (comma-separated)"
            />
          </div>

          <div className="space-y-2">
            <Label>Manner of Death *</Label>
            <Select
              value={formData.mannerOfDeath}
              onValueChange={(v) => updateField('mannerOfDeath', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANNER_OF_DEATH.map(manner => (
                  <SelectItem key={manner.value} value={manner.value}>
                    {manner.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Skull className="w-4 h-4 mr-2" />
            Certify Death
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
