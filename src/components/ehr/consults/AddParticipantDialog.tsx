/**
 * AddParticipantDialog - Add participants to multi-participant sessions
 * For multidisciplinary consultations and group calls
 */
import { useState } from "react";
import {
  UserPlus,
  Search,
  Building,
  Stethoscope,
  Phone,
  Users,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import type { ParticipantInvite } from "@/hooks/useMultiParticipantSession";

interface AddParticipantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddParticipant: (invite: ParticipantInvite) => Promise<boolean>;
  currentParticipantCount: number;
  maxParticipants: number;
}

// Mock provider directory
const MOCK_PROVIDERS = [
  { id: "p1", name: "Dr. Sarah Ncube", specialty: "Cardiology", facility: "Central Hospital", status: "online" },
  { id: "p2", name: "Dr. John Moyo", specialty: "Oncology", facility: "Cancer Center", status: "online" },
  { id: "p3", name: "Dr. Grace Mutasa", specialty: "Surgery", facility: "Central Hospital", status: "busy" },
  { id: "p4", name: "Dr. Peter Dube", specialty: "Internal Medicine", facility: "District Hospital", status: "offline" },
  { id: "p5", name: "Dr. Ruth Sibanda", specialty: "Pediatrics", facility: "Children's Hospital", status: "online" },
];

const SPECIALTIES = [
  "Cardiology", "Oncology", "Surgery", "Internal Medicine", "Pediatrics",
  "Neurology", "Radiology", "Pathology", "OB/GYN", "Psychiatry",
];

export function AddParticipantDialog({
  isOpen,
  onClose,
  onAddParticipant,
  currentParticipantCount,
  maxParticipants,
}: AddParticipantDialogProps) {
  const [searchType, setSearchType] = useState<'provider' | 'specialty' | 'on_call'>('provider');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<typeof MOCK_PROVIDERS[0] | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [inviteReason, setInviteReason] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const filteredProviders = MOCK_PROVIDERS.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canAddMore = currentParticipantCount < maxParticipants;

  const handleInvite = async () => {
    if (!inviteReason.trim()) {
      toast.error("Please provide a reason for adding this participant");
      return;
    }

    let invite: ParticipantInvite;
    
    if (searchType === 'provider' && selectedProvider) {
      invite = {
        targetType: 'provider',
        targetId: selectedProvider.id,
        targetName: selectedProvider.name,
        reason: inviteReason,
        urgent: isUrgent,
      };
    } else if (searchType === 'specialty' && selectedSpecialty) {
      invite = {
        targetType: 'specialty',
        targetName: selectedSpecialty,
        reason: inviteReason,
        urgent: isUrgent,
      };
    } else if (searchType === 'on_call') {
      invite = {
        targetType: 'on_call',
        targetName: 'On-Call Specialist',
        reason: inviteReason,
        urgent: isUrgent,
      };
    } else {
      toast.error("Please select a participant to invite");
      return;
    }

    setIsInviting(true);
    const success = await onAddParticipant(invite);
    setIsInviting(false);

    if (success) {
      setSelectedProvider(null);
      setSelectedSpecialty("");
      setInviteReason("");
      setIsUrgent(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Participant
          </DialogTitle>
          <DialogDescription>
            Invite another provider to join this session.
            {!canAddMore && (
              <span className="block text-destructive mt-1">
                Maximum {maxParticipants} participants reached.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={searchType} onValueChange={(v) => setSearchType(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="provider">
              <Stethoscope className="h-4 w-4 mr-1" />
              Provider
            </TabsTrigger>
            <TabsTrigger value="specialty">
              <Building className="h-4 w-4 mr-1" />
              Specialty
            </TabsTrigger>
            <TabsTrigger value="on_call">
              <Phone className="h-4 w-4 mr-1" />
              On-Call
            </TabsTrigger>
          </TabsList>

          <TabsContent value="provider" className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search providers by name or specialty..."
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredProviders.map(provider => (
                  <div
                    key={provider.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedProvider?.id === provider.id
                        ? 'bg-primary/10 border border-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {provider.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {provider.specialty} • {provider.facility}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        provider.status === 'online' ? 'text-success border-success' :
                        provider.status === 'busy' ? 'text-warning border-warning' :
                        'text-muted-foreground'
                      }`}
                    >
                      {provider.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="specialty" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Request any available specialist from selected specialty
            </p>
            
            <RadioGroup value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <ScrollArea className="h-48 border rounded-lg">
                <div className="p-2 space-y-1">
                  {SPECIALTIES.map(specialty => (
                    <div
                      key={specialty}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedSpecialty === specialty
                          ? 'bg-primary/10 border border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedSpecialty(specialty)}
                    >
                      <RadioGroupItem value={specialty} id={specialty} />
                      <Label htmlFor={specialty} className="flex-1 cursor-pointer">
                        {specialty}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </RadioGroup>
          </TabsContent>

          <TabsContent value="on_call" className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Phone className="h-12 w-12 text-primary mx-auto mb-3" />
              <p className="font-medium">On-Call Specialist</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connect to the currently on-call specialist for immediate consultation
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Invite Reason */}
        <div className="space-y-2">
          <Label>Reason for Adding</Label>
          <Textarea
            value={inviteReason}
            onChange={(e) => setInviteReason(e.target.value)}
            placeholder="Why is this participant needed for the consultation?"
            className="min-h-[60px]"
          />
        </div>

        {/* Urgent Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className={`h-4 w-4 ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`} />
            <div>
              <p className="font-medium text-sm">Mark as Urgent</p>
              <p className="text-xs text-muted-foreground">
                Escalate priority for immediate response
              </p>
            </div>
          </div>
          <Switch checked={isUrgent} onCheckedChange={setIsUrgent} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!canAddMore || isInviting || !inviteReason.trim()}
          >
            {isInviting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-1" />
            )}
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
