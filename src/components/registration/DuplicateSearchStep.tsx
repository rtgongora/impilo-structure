import { useState, useEffect } from "react";
import { 
  Search, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  Loader2,
  ChevronRight,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ClientData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  nationalId: string;
  idNumber: string;
}

interface PotentialDuplicate {
  id: string;
  health_id: string;
  given_names: string;
  family_name: string;
  date_of_birth: string | null;
  sex: string;
  phone_primary: string | null;
  district: string | null;
  lifecycle_state: string;
  match_score: number;
  match_reasons: string[];
}

interface DuplicateSearchStepProps {
  clientData: ClientData;
  onNoDuplicates: () => void;
  onSelectExisting: (clientId: string, healthId: string) => void;
  onProceedAnyway: () => void;
}

export function DuplicateSearchStep({ 
  clientData, 
  onNoDuplicates, 
  onSelectExisting,
  onProceedAnyway 
}: DuplicateSearchStepProps) {
  const [searchState, setSearchState] = useState<'searching' | 'complete'>('searching');
  const [potentialDuplicates, setPotentialDuplicates] = useState<PotentialDuplicate[]>([]);
  const [searchProgress, setSearchProgress] = useState(0);
  const [selectedDuplicate, setSelectedDuplicate] = useState<string | null>(null);

  useEffect(() => {
    performDuplicateSearch();
  }, []);

  const performDuplicateSearch = async () => {
    setSearchState('searching');
    setSearchProgress(10);

    try {
      // Step 1: Build search criteria
      const searchCriteria = [];
      
      // Search by name
      if (clientData.firstName && clientData.lastName) {
        searchCriteria.push({
          type: 'name',
          query: `${clientData.firstName} ${clientData.lastName}`
        });
      }
      setSearchProgress(20);

      // Search by phone
      if (clientData.phone) {
        searchCriteria.push({
          type: 'phone',
          query: clientData.phone
        });
      }
      setSearchProgress(30);

      // Search by national ID
      if (clientData.nationalId || clientData.idNumber) {
        searchCriteria.push({
          type: 'id',
          query: clientData.nationalId || clientData.idNumber
        });
      }
      setSearchProgress(40);

      // Perform the actual search
      const duplicates: PotentialDuplicate[] = [];

      // Search by name match
      if (clientData.firstName && clientData.lastName) {
        setSearchProgress(50);
        const { data: nameMatches } = await supabase
          .from('client_registry')
          .select('id, health_id, given_names, family_name, date_of_birth, sex, phone_primary, district, lifecycle_state')
          .ilike('family_name', `%${clientData.lastName}%`)
          .ilike('given_names', `%${clientData.firstName}%`)
          .neq('lifecycle_state', 'merged')
          .limit(10);

        if (nameMatches) {
          for (const match of nameMatches) {
            const matchReasons: string[] = [];
            let score = 0;

            // Calculate match score
            if (match.family_name?.toLowerCase() === clientData.lastName.toLowerCase()) {
              score += 30;
              matchReasons.push('Exact surname match');
            } else {
              score += 15;
              matchReasons.push('Similar surname');
            }

            if (match.given_names?.toLowerCase().includes(clientData.firstName.toLowerCase())) {
              score += 25;
              matchReasons.push('First name match');
            }

            if (clientData.dateOfBirth && match.date_of_birth === clientData.dateOfBirth) {
              score += 25;
              matchReasons.push('Date of birth match');
            }

            if (clientData.phone && match.phone_primary?.replace(/\D/g, '').includes(clientData.phone.replace(/\D/g, ''))) {
              score += 20;
              matchReasons.push('Phone number match');
            }

            if (score >= 40) {
              duplicates.push({
                ...match,
                match_score: Math.min(score, 100),
                match_reasons: matchReasons
              });
            }
          }
        }
      }

      setSearchProgress(70);

      // Search by phone if provided
      if (clientData.phone) {
        const normalizedPhone = clientData.phone.replace(/\D/g, '');
        const { data: phoneMatches } = await supabase
          .from('client_registry')
          .select('id, health_id, given_names, family_name, date_of_birth, sex, phone_primary, district, lifecycle_state')
          .or(`phone_primary.ilike.%${normalizedPhone}%,phone_secondary.ilike.%${normalizedPhone}%`)
          .neq('lifecycle_state', 'merged')
          .limit(5);

        if (phoneMatches) {
          for (const match of phoneMatches) {
            const existingIndex = duplicates.findIndex(d => d.id === match.id);
            if (existingIndex === -1) {
              duplicates.push({
                ...match,
                match_score: 60,
                match_reasons: ['Phone number match']
              });
            }
          }
        }
      }

      setSearchProgress(85);

      // Search by National ID if provided
      if (clientData.nationalId) {
        const { data: idMatches } = await supabase
          .from('client_identifiers')
          .select('client_id')
          .eq('identifier_type', 'national_id')
          .eq('identifier_value', clientData.nationalId);

        if (idMatches && idMatches.length > 0) {
          const clientIds = idMatches.map(m => m.client_id);
          const { data: clients } = await supabase
            .from('client_registry')
            .select('id, health_id, given_names, family_name, date_of_birth, sex, phone_primary, district, lifecycle_state')
            .in('id', clientIds)
            .neq('lifecycle_state', 'merged');

          if (clients) {
            for (const match of clients) {
              const existingIndex = duplicates.findIndex(d => d.id === match.id);
              if (existingIndex >= 0) {
                duplicates[existingIndex].match_score = Math.min(duplicates[existingIndex].match_score + 35, 100);
                duplicates[existingIndex].match_reasons.push('National ID match');
              } else {
                duplicates.push({
                  ...match,
                  match_score: 95,
                  match_reasons: ['National ID match']
                });
              }
            }
          }
        }
      }

      setSearchProgress(100);

      // Sort by match score
      duplicates.sort((a, b) => b.match_score - a.match_score);
      
      setPotentialDuplicates(duplicates);
      setSearchState('complete');

      // If no duplicates found, notify parent
      if (duplicates.length === 0) {
        // Wait a moment to show the "no duplicates" state
        setTimeout(() => {
          onNoDuplicates();
        }, 1500);
      }

    } catch (error) {
      console.error('Duplicate search error:', error);
      setSearchState('complete');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-destructive';
    if (score >= 60) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'destructive';
    if (score >= 60) return 'secondary';
    return 'outline';
  };

  if (searchState === 'searching') {
    return (
      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <CardTitle>Searching for Duplicates</CardTitle>
            <CardDescription>
              Checking the National Client Registry for potential matches...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={searchProgress} className="h-2" />
            <div className="text-center text-sm text-muted-foreground">
              {searchProgress < 50 && "Building search criteria..."}
              {searchProgress >= 50 && searchProgress < 70 && "Searching by name and demographics..."}
              {searchProgress >= 70 && searchProgress < 85 && "Searching by phone number..."}
              {searchProgress >= 85 && "Searching by identity documents..."}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (potentialDuplicates.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-success/20 bg-success/5">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <CardTitle className="text-success">No Duplicates Found</CardTitle>
            <CardDescription>
              No existing records match this client. You can proceed with registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={onNoDuplicates} size="lg">
              Continue to Consent
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning Header */}
      <Card className="border-warning/30 bg-warning/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg">Potential Duplicates Found</CardTitle>
              <CardDescription>
                {potentialDuplicates.length} existing record{potentialDuplicates.length > 1 ? 's' : ''} may match this client. 
                Please review before proceeding.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Registration Summary */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            New Registration Details
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="font-medium">{clientData.firstName} {clientData.middleName} {clientData.lastName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date of Birth:</span>
              <p className="font-medium">{clientData.dateOfBirth || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>
              <p className="font-medium">{clientData.phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">ID Number:</span>
              <p className="font-medium">{clientData.nationalId || clientData.idNumber || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Potential Duplicates List */}
      <div className="space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <Search className="w-4 h-4" />
          Potential Matches ({potentialDuplicates.length})
        </h4>

        {potentialDuplicates.map((duplicate) => (
          <Card 
            key={duplicate.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              selectedDuplicate === duplicate.id && "border-primary ring-2 ring-primary/20"
            )}
            onClick={() => setSelectedDuplicate(duplicate.id === selectedDuplicate ? null : duplicate.id)}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    duplicate.match_score >= 80 ? "bg-destructive/10" : 
                    duplicate.match_score >= 60 ? "bg-warning/10" : "bg-muted"
                  )}>
                    <UserCheck className={cn("w-5 h-5", getScoreColor(duplicate.match_score))} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{duplicate.given_names} {duplicate.family_name}</p>
                      <Badge variant={getScoreBadge(duplicate.match_score)} className="text-xs">
                        {duplicate.match_score}% Match
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {duplicate.lifecycle_state}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>Health ID: {duplicate.health_id}</span>
                      {duplicate.date_of_birth && <span>DOB: {duplicate.date_of_birth}</span>}
                      {duplicate.phone_primary && <span>Phone: {duplicate.phone_primary}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {duplicate.match_reasons.map((reason, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectExisting(duplicate.id, duplicate.health_id);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Use This Record
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => performDuplicateSearch()}>
          <Search className="w-4 h-4 mr-2" />
          Search Again
        </Button>
        <Button onClick={onProceedAnyway} variant="secondary">
          Not a Duplicate - Continue Registration
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
