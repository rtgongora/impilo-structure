// Documents Library Component (PCT-UI-02)
// Unified document reference system with filtering

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  FileText,
  FileHeart,
  FileCheck,
  AlertTriangle,
  ArrowRightLeft,
  TestTube,
  Scan,
  Stethoscope,
  Filter,
  Search,
  Download,
  Eye,
  Share2,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPatientDocuments } from "@/services/patientCareTrackerService";
import type { DocumentReference, ClinicalDocumentType, DocumentStatus } from "@/types/patientCareTracker";
import { DOCUMENT_TYPE_CONFIG } from "@/types/patientCareTracker";

interface DocumentsLibraryProps {
  patientId: string;
  visitId?: string;
  compact?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  FileHeart,
  FileText,
  FileCheck,
  AlertTriangle,
  ArrowRightLeft,
  TestTube,
  Scan,
  Stethoscope,
};

export function DocumentsLibrary({ patientId, visitId, compact = false }: DocumentsLibraryProps) {
  const [documents, setDocuments] = useState<DocumentReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ClinicalDocumentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadDocuments();
  }, [patientId, visitId, typeFilter, statusFilter]);

  const loadDocuments = async () => {
    setLoading(true);
    const docs = await getPatientDocuments(patientId, {
      visitId,
      documentType: typeFilter !== "all" ? [typeFilter] : undefined,
      status: statusFilter !== "all" ? [statusFilter] : undefined,
    });
    setDocuments(docs);
    setLoading(false);
  };

  const filteredDocuments = documents.filter((doc) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(query) ||
        doc.authorName?.toLowerCase().includes(query) ||
        doc.facilityName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const documentsByCategory = {
    all: filteredDocuments,
    summaries: filteredDocuments.filter((d) =>
      ["ips", "visit_summary", "discharge_summary", "ed_summary", "transfer_summary"].includes(d.documentType)
    ),
    reports: filteredDocuments.filter((d) =>
      ["lab_report", "imaging_report"].includes(d.documentType)
    ),
    notes: filteredDocuments.filter((d) =>
      ["procedure_note", "operative_note", "consultation_note", "progress_note"].includes(d.documentType)
    ),
  };

  const getDocumentIcon = (type: ClinicalDocumentType) => {
    const config = DOCUMENT_TYPE_CONFIG[type];
    const IconComponent = ICON_MAP[config?.icon] || FileText;
    return IconComponent;
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case "final":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "pending_signature":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "amended":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-48">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
            ) : filteredDocuments.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No documents</div>
            ) : (
              <div className="divide-y">
                {filteredDocuments.slice(0, 5).map((doc) => {
                  const Icon = getDocumentIcon(doc.documentType);
                  return (
                    <div key={doc.id} className="p-2 hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate flex-1">{doc.title}</span>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(doc.documentDate), "MMM d, yyyy")}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documents & Summaries</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(DOCUMENT_TYPE_CONFIG).map(([key, config]) => (
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_signature">Pending Signature</SelectItem>
              <SelectItem value="final">Final</SelectItem>
              <SelectItem value="amended">Amended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({documentsByCategory.all.length})</TabsTrigger>
          <TabsTrigger value="summaries">Summaries ({documentsByCategory.summaries.length})</TabsTrigger>
          <TabsTrigger value="reports">Reports ({documentsByCategory.reports.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({documentsByCategory.notes.length})</TabsTrigger>
        </TabsList>

        {Object.entries(documentsByCategory).map(([key, docs]) => (
          <TabsContent key={key} value={key} className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
            ) : docs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No documents found
              </div>
            ) : (
              <div className="grid gap-3">
                {docs.map((doc) => {
                  const Icon = getDocumentIcon(doc.documentType);
                  const config = DOCUMENT_TYPE_CONFIG[doc.documentType];
                  return (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg bg-${config?.color || 'gray'}-100 dark:bg-${config?.color || 'gray'}-900/30`}>
                            <Icon className={`h-5 w-5 text-${config?.color || 'gray'}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate">{doc.title}</h3>
                              <Badge variant="outline" className={`text-xs ${getStatusColor(doc.status)}`}>
                                {doc.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {config?.label} • {format(new Date(doc.documentDate), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {doc.authorName && <span>By: {doc.authorName}</span>}
                              {doc.facilityName && <span>• {doc.facilityName}</span>}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions <ChevronDown className="h-4 w-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="h-4 w-4 mr-2" /> Share
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
