/**
 * EncounterDocumentsSheet - Persistent sheet for scanning/uploading and viewing
 * patient documents throughout the encounter. Accessible from the clinical toolbar.
 */

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ScanLine, Upload, FileText, FolderOpen, Camera, Eye, Download, Clock,
  CheckCircle, AlertTriangle, RefreshCw, Brain, Search, Plus, X, File,
  Image as ImageIcon, Paperclip, History
} from "lucide-react";
import { useEHR } from "@/contexts/EHRContext";
import { useQuery } from "@tanstack/react-query";
import { landelaApi } from "@/lib/api/landela";
import { LandelaDocumentUpload } from "@/components/landela/LandelaDocumentUpload";
import { LandelaDocumentViewer } from "@/components/landela/LandelaDocumentViewer";
import { ClinicalDocumentScanner, ScannedDocument } from "@/components/documents/ClinicalDocumentScanner";
import { toast } from "sonner";
import { format } from "date-fns";

const DOCUMENT_CATEGORIES = [
  { id: "all", label: "All Documents" },
  { id: "clinical", label: "Clinical" },
  { id: "history", label: "Patient History" },
  { id: "referral", label: "Referral Letters" },
  { id: "lab", label: "Lab Results" },
  { id: "imaging", label: "Imaging" },
  { id: "consent", label: "Consent Forms" },
  { id: "insurance", label: "Insurance" },
  { id: "scanned", label: "Scanned (Legacy)" },
];

export function EncounterDocumentsSheet() {
  const { currentEncounter } = useEHR();
  const patientId = currentEncounter?.patient?.id;
  const encounterId = currentEncounter?.id;
  const visitId = encounterId; // Use encounter ID as visit context

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [recentScans, setRecentScans] = useState<ScannedDocument[]>([]);

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ["patient-documents", patientId],
    queryFn: () => landelaApi.getPatientDocuments(patientId!),
    enabled: !!patientId && open,
  });

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = !searchQuery ||
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" ||
      doc.document_type_code?.toLowerCase().includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const handleDocumentScanned = (doc: ScannedDocument) => {
    setRecentScans((prev) => [doc, ...prev]);
    toast.success(`${doc.name} captured — ready for review`);
    refetch();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
      case "final":
        return <CheckCircle className="h-3.5 w-3.5 text-green-600" />;
      case "processing":
        return <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" />;
      case "indexing_required":
      case "pending_review":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getDocIcon = (typeCode: string) => {
    if (typeCode?.includes("imaging") || typeCode?.includes("xray") || typeCode?.includes("scan")) return <ImageIcon className="h-4 w-4" />;
    if (typeCode?.includes("lab") || typeCode?.includes("result")) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  if (!patientId) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs shrink-0">
            <FolderOpen className="w-3.5 h-3.5" />
            Documents
            {documents.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">
                {documents.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[520px] sm:w-[600px] p-0 flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-3 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-base">
                <FolderOpen className="h-5 w-5 text-primary" />
                Patient Documents
              </SheetTitle>
              <div className="flex gap-1.5">
                <ClinicalDocumentScanner
                  variant="button"
                  context="encounter"
                  onDocumentScanned={handleDocumentScanned}
                  buttonLabel="Scan"
                />
                <Button size="sm" onClick={() => setShowUpload(true)}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Upload
                </Button>
              </div>
            </div>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 pt-3">
              <TabsList className="w-full grid grid-cols-3 h-9">
                <TabsTrigger value="browse" className="text-xs gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5" />
                  All Files
                </TabsTrigger>
                <TabsTrigger value="recent" className="text-xs gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Recent
                  {recentScans.length > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-[10px]">{recentScans.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  Legacy / Scanned
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Browse Tab */}
            <TabsContent value="browse" className="flex-1 overflow-hidden m-0 flex flex-col">
              <div className="px-5 py-3 space-y-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {DOCUMENT_CATEGORIES.slice(0, 6).map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={categoryFilter === cat.id ? "default" : "outline"}
                      className="cursor-pointer text-[10px] px-2 py-0.5"
                      onClick={() => setCategoryFilter(cat.id)}
                    >
                      {cat.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 px-5 py-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium mb-1">No documents found</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      {searchQuery ? "Try a different search term" : "Scan or upload documents to get started"}
                    </p>
                    <div className="flex justify-center gap-2">
                      <ClinicalDocumentScanner
                        variant="button"
                        context="encounter"
                        onDocumentScanned={handleDocumentScanned}
                        buttonLabel="Scan Document"
                      />
                      <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}>
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        Upload File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 cursor-pointer transition-colors group"
                        onClick={() => setSelectedDocumentId(doc.id)}
                      >
                        <div className="h-9 w-9 rounded bg-muted flex items-center justify-center shrink-0">
                          {getDocIcon(doc.document_type_code)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.title}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span>{doc.landela_document_types?.name || doc.document_type_code}</span>
                            <span>·</span>
                            <span>{format(new Date(doc.captured_at), "PP")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(doc.status)}
                          {doc.ai_classified && (
                            <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5">
                              <Brain className="h-3 w-3" />
                              AI
                            </Badge>
                          )}
                          <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Recent Scans Tab */}
            <TabsContent value="recent" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full px-5 py-3">
                {recentScans.length === 0 ? (
                  <div className="text-center py-12">
                    <ScanLine className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium mb-1">No recent scans</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Documents scanned or uploaded during this encounter appear here
                    </p>
                    <ClinicalDocumentScanner
                      variant="button"
                      context="encounter"
                      onDocumentScanned={handleDocumentScanned}
                      buttonLabel="Scan Now"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      {recentScans.length} document(s) captured this session
                    </p>
                    {recentScans.map((doc) => (
                      <Card key={doc.id} className="overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center shrink-0">
                              {doc.previewUrl ? (
                                <img src={doc.previewUrl} alt="" className="h-full w-full object-cover rounded" />
                              ) : (
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.name}</p>
                              <p className="text-[11px] text-muted-foreground">{doc.type} · Just now</p>
                              {doc.confidentiality && (
                                <Badge variant="outline" className="text-[10px] mt-1">
                                  {doc.confidentiality}
                                </Badge>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-[10px] shrink-0">New</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Legacy / Scanned History Tab */}
            <TabsContent value="history" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full px-5 py-3">
                <div className="text-center py-6 mb-4">
                  <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">Legacy & Scanned Records</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Upload old paper records, historical documents, and previous provider notes
                  </p>
                  <div className="flex justify-center gap-2">
                    <ClinicalDocumentScanner
                      variant="button"
                      context="encounter"
                      onDocumentScanned={handleDocumentScanned}
                      buttonLabel="Scan Old Records"
                    />
                    <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload Files
                    </Button>
                  </div>
                </div>

                {/* Show documents tagged as scanned/legacy */}
                {documents
                  .filter((d) =>
                    d.document_type_code?.includes("scanned") ||
                    d.document_type_code?.includes("legacy") ||
                    d.document_type_code?.includes("historical") ||
                    d.document_type_code?.includes("OLD") ||
                    d.document_type_code?.includes("PAPER")
                  )
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 cursor-pointer transition-colors mb-1.5"
                      onClick={() => setSelectedDocumentId(doc.id)}
                    >
                      <div className="h-9 w-9 rounded bg-amber-50 flex items-center justify-center shrink-0">
                        <History className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(doc.captured_at), "PP")}
                        </p>
                      </div>
                      {getStatusIcon(doc.status)}
                    </div>
                  ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Patient Document</DialogTitle>
          </DialogHeader>
          <LandelaDocumentUpload
            patientId={patientId}
            encounterId={encounterId}
            visitId={visitId}
            onUploadComplete={() => {
              setShowUpload(false);
              refetch();
              toast.success("Document uploaded successfully");
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedDocumentId} onOpenChange={() => setSelectedDocumentId(null)}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          {selectedDocumentId && (
            <LandelaDocumentViewer
              documentId={selectedDocumentId}
              onClose={() => setSelectedDocumentId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
