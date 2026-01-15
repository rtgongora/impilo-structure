import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Upload,
  Search,
  Filter,
  FileText,
  FolderOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  Brain,
  ScanLine,
  Package,
  Share2,
  Printer,
  MoreVertical,
  Plus,
  RefreshCw,
  Download,
  Eye,
} from "lucide-react";
import { LandelaDocumentUpload } from "@/components/landela/LandelaDocumentUpload";
import { LandelaDocumentViewer } from "@/components/landela/LandelaDocumentViewer";
import { useQuery } from "@tanstack/react-query";
import { landelaApi, LandelaDocument, DocumentType } from "@/lib/api/landela";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Landela() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("documents");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const { data: documents = [], isLoading: loadingDocs, refetch: refetchDocs } = useQuery({
    queryKey: ["landela-documents", statusFilter, searchQuery],
    queryFn: () => landelaApi.getDocuments({
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchQuery || undefined,
      limit: 50,
    }),
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ["landela-document-types"],
    queryFn: () => landelaApi.getDocumentTypes(),
  });

  const { data: batchSessions = [] } = useQuery({
    queryKey: ["landela-batch-sessions"],
    queryFn: () => landelaApi.getBatchSessions(),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
      case "final":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "indexing_required":
      case "pending_review":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
      case "final":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case "indexing_required":
      case "pending_review":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const stats = {
    total: documents.length,
    pending: documents.filter(d => ["indexing_required", "pending_review"].includes(d.status)).length,
    processing: documents.filter(d => d.status === "processing").length,
    verified: documents.filter(d => ["verified", "final"].includes(d.status)).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  Landela DMS
                </h1>
                <p className="text-sm text-muted-foreground">
                  Document Management System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => refetchDocs()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{stats.total} Documents</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">{stats.pending} Pending Review</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{stats.processing} Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">{stats.verified} Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="batches" className="gap-2">
              <Package className="h-4 w-4" />
              Batch Scanning
            </TabsTrigger>
            <TabsTrigger value="types" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Document Types
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="indexing_required">Indexing Required</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Documents Grid */}
            {loadingDocs ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <Card className="py-12">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No documents found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your first document to get started
                  </p>
                  <Button onClick={() => setShowUpload(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                  <Card
                    key={doc.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedDocumentId(doc.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {doc.title}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {doc.landela_document_types?.name || doc.document_type_code}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedDocumentId(doc.id); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Printer className="h-4 w-4 mr-2" />
                              Print
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        {getStatusIcon(doc.status)}
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status.replace("_", " ")}
                        </Badge>
                        {doc.ai_classified && (
                          <Badge variant="outline" className="gap-1">
                            <Brain className="h-3 w-3" />
                            AI
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Captured:</span>
                          <span>{format(new Date(doc.captured_at), "PP")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Source:</span>
                          <span className="capitalize">{doc.source.replace("_", " ")}</span>
                        </div>
                        {doc.page_count > 0 && (
                          <div className="flex justify-between">
                            <span>Pages:</span>
                            <span>{doc.page_count}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="batches" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Batch Scanning Sessions</h2>
              <Button>
                <ScanLine className="h-4 w-4 mr-2" />
                New Batch Scan
              </Button>
            </div>

            {batchSessions.length === 0 ? (
              <Card className="py-12">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <ScanLine className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No batch sessions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start a batch scanning session to digitize multiple documents
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {batchSessions.map((session) => (
                  <Card key={session.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{session.session_name}</CardTitle>
                        <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                          {session.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Total Pages:</span>
                          <span>{session.total_pages}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Documents Created:</span>
                          <span>{session.documents_created}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Started:</span>
                          <span>{format(new Date(session.started_at), "PPp")}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="types" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Document Types</h2>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Type
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documentTypes.map((type) => (
                <Card key={type.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{type.name}</CardTitle>
                      <Badge variant="outline">{type.category}</Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">{type.code}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {type.description || "No description"}
                    </p>
                    <div className="flex gap-2 mt-3">
                      {type.requires_patient && (
                        <Badge variant="secondary" className="text-xs">Requires Patient</Badge>
                      )}
                      {type.requires_approval && (
                        <Badge variant="secondary" className="text-xs">Requires Approval</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
          </DialogHeader>
          <LandelaDocumentUpload
            onUploadComplete={() => {
              setShowUpload(false);
              refetchDocs();
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
    </div>
  );
}
