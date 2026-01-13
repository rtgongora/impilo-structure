// Visits Timeline Component (PCT-UI-03)
// Visit-centric patient history with encounter drill-down

import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronRight,
  ChevronDown,
  Bed,
  AlertTriangle,
  Video,
  Home,
  Layers,
  FileText,
  Activity,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getPatientVisits, getVisitWithEncounters } from "@/services/patientCareTrackerService";
import type { Visit, VisitType, VisitStatus, EncounterSummary } from "@/types/patientCareTracker";
import { VISIT_TYPE_CONFIG, VISIT_STATUS_CONFIG, VISIT_OUTCOME_CONFIG } from "@/types/patientCareTracker";

interface VisitsTimelineProps {
  patientId: string;
  onSelectVisit?: (visit: Visit) => void;
  onSelectEncounter?: (encounterId: string) => void;
}

const VISIT_ICONS: Record<VisitType, React.ElementType> = {
  outpatient: User,
  inpatient: Bed,
  emergency: AlertTriangle,
  day_case: Clock,
  home_care: Home,
  telehealth: Video,
  programme: Layers,
};

export function VisitsTimeline({ patientId, onSelectVisit, onSelectEncounter }: VisitsTimelineProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
  const [expandedVisit, setExpandedVisit] = useState<Visit | null>(null);
  const [typeFilter, setTypeFilter] = useState<VisitType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<VisitStatus | "all">("all");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");

  useEffect(() => {
    loadVisits();
  }, [patientId, typeFilter, statusFilter]);

  const loadVisits = async () => {
    setLoading(true);
    const data = await getPatientVisits(patientId, {
      visitType: typeFilter !== "all" ? [typeFilter] : undefined,
      status: statusFilter !== "all" ? [statusFilter] : undefined,
    });
    setVisits(data);
    setLoading(false);
  };

  const handleExpandVisit = async (visitId: string) => {
    if (expandedVisitId === visitId) {
      setExpandedVisitId(null);
      setExpandedVisit(null);
    } else {
      setExpandedVisitId(visitId);
      const visitWithEncounters = await getVisitWithEncounters(visitId);
      setExpandedVisit(visitWithEncounters);
    }
  };

  const sortedVisits = [...visits].sort((a, b) => {
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    return sortOrder === "recent" ? dateB - dateA : dateA - dateB;
  });

  const activeVisit = visits.find((v) => v.status === "active");

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Visits & Admissions</h2>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="w-36">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(VISIT_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(VISIT_STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Visit Highlight */}
      {activeVisit && (
        <Card className="border-green-500 bg-green-50/50 dark:bg-green-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Currently Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{VISIT_TYPE_CONFIG[activeVisit.visitType].label}</p>
                <p className="text-sm text-muted-foreground">
                  Started {format(new Date(activeVisit.startDate), "MMM d, yyyy")} •{" "}
                  {activeVisit.facilityName || "Current Facility"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onSelectVisit?.(activeVisit)}>
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <ScrollArea className="h-[500px]">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading visits...</div>
        ) : sortedVisits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No visits found</div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {sortedVisits.map((visit) => {
                const Icon = VISIT_ICONS[visit.visitType];
                const typeConfig = VISIT_TYPE_CONFIG[visit.visitType];
                const statusConfig = VISIT_STATUS_CONFIG[visit.status];
                const outcomeConfig = visit.outcome ? VISIT_OUTCOME_CONFIG[visit.outcome] : null;
                const isExpanded = expandedVisitId === visit.id;

                return (
                  <Collapsible
                    key={visit.id}
                    open={isExpanded}
                    onOpenChange={() => handleExpandVisit(visit.id)}
                  >
                    <Card className={`ml-10 ${visit.status === "active" ? "border-green-500" : ""}`}>
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-4 w-5 h-5 rounded-full border-2 bg-background flex items-center justify-center
                          ${visit.status === "active" ? "border-green-500" : "border-muted-foreground"}`}
                      >
                        <Icon className="h-3 w-3" />
                      </div>

                      <CollapsibleTrigger asChild>
                        <CardHeader className="p-4 cursor-pointer hover:bg-muted/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base">{typeConfig.label}</CardTitle>
                                <Badge
                                  variant="outline"
                                  className={`text-xs bg-${statusConfig.color}-100 text-${statusConfig.color}-800`}
                                >
                                  {statusConfig.label}
                                </Badge>
                                {outcomeConfig && (
                                  <Badge variant="secondary" className="text-xs">
                                    {outcomeConfig.label}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {format(new Date(visit.startDate), "MMM d, yyyy")}
                                  {visit.endDate && ` - ${format(new Date(visit.endDate), "MMM d, yyyy")}`}
                                </span>
                                {visit.facilityName && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {visit.facilityName}
                                  </span>
                                )}
                              </div>
                              {visit.admissionReason && (
                                <p className="text-sm mt-2">{visit.admissionReason}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {visit.visitNumber}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4 px-4">
                          {expandedVisit?.encounters && expandedVisit.encounters.length > 0 ? (
                            <div className="space-y-2 border-t pt-4">
                              <h4 className="text-sm font-medium mb-3">
                                Encounters ({expandedVisit.encounters.length})
                              </h4>
                              {expandedVisit.encounters.map((encounter) => (
                                <div
                                  key={encounter.id}
                                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                                  onClick={() => onSelectEncounter?.(encounter.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                      {encounter.sequence}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {encounter.encounterType} - {encounter.encounterNumber}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {format(new Date(encounter.admissionDate), "MMM d, yyyy")}
                                        {encounter.chiefComplaint && ` • ${encounter.chiefComplaint}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {encounter.status}
                                    </Badge>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-sm text-muted-foreground border-t">
                              No encounters recorded
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSelectVisit?.(visit)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Full Details
                            </Button>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
