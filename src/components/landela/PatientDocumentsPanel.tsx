import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileText,
  Upload,
  Eye,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  Brain,
  FolderOpen,
  Plus,
  RefreshCw,
} from "lucide-react";
import { landelaApi, LandelaDocument } from "@/lib/api/landela";
import { LandelaDocumentUpload } from "./LandelaDocumentUpload";
import { LandelaDocumentViewer } from "./LandelaDocumentViewer";
import { format } from "date-fns";

interface PatientDocumentsPanelProps {
  patientId: string;
  encounterId?: string;
  visitId?: string;
  compact?: boolean;
}

export function PatientDocumentsPanel({
  patientId,
  encounterId,
  visitId,
  compact = false,
}: PatientDocumentsPanelProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ["patient-documents", patientId],
    queryFn: () => landelaApi.getPatientDocuments(patientId),
    enabled: !!patientId,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
      case "final":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "processing":
        return <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />;
      case "indexing_required":
      case "pending_review":
        return <AlertTriangle className="h-3 w-3 text-amber-600" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents ({documents.length})
          </h4>
          <Button size="sm" variant="ghost" onClick={() => setShowUpload(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No documents attached</p>
        ) : (
          <div className="space-y-1">
            {documents.slice(0, 5).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
                onClick={() => setSelectedDocumentId(doc.id)}
              >
                {getStatusIcon(doc.status)}
                <span className="flex-1 truncate">{doc.title}</span>
                <Eye className="h-3 w-3 text-muted-foreground" />
              </div>
            ))}
            {documents.length > 5 && (
              <p className="text-xs text-muted-foreground text-center py-1">
                +{documents.length - 5} more documents
              </p>
            )}
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <LandelaDocumentUpload
              patientId={patientId}
              encounterId={encounterId}
              visitId={visitId}
              onUploadComplete={() => {
                setShowUpload(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Viewer Dialog */}
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Patient Documents
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No documents for this patient
            </p>
            <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedDocumentId(doc.id)}
                >
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{doc.landela_document_types?.name || doc.document_type_code}</span>
                      <span>•</span>
                      <span>{format(new Date(doc.captured_at), "PP")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(doc.status)}
                    {doc.ai_classified && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Brain className="h-3 w-3" />
                        AI
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document for Patient</DialogTitle>
          </DialogHeader>
          <LandelaDocumentUpload
            patientId={patientId}
            encounterId={encounterId}
            visitId={visitId}
            onUploadComplete={() => {
              setShowUpload(false);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Viewer Dialog */}
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
    </Card>
  );
}
