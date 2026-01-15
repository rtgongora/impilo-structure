import { useState, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Printer,
  Share2,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
  Loader2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { landelaApi, LandelaDocument } from "@/lib/api/landela";
import { format } from "date-fns";

interface LandelaDocumentViewerProps {
  documentId: string;
  onClose?: () => void;
}

export function LandelaDocumentViewer({ documentId, onClose }: LandelaDocumentViewerProps) {
  const { toast } = useToast();
  const [document, setDocument] = useState<LandelaDocument | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const doc = await landelaApi.getDocument(documentId);
      if (doc) {
        setDocument(doc);
        const url = await landelaApi.getDocumentUrl(doc);
        setDocumentUrl(url);
        
        // Log view
        await landelaApi.logAction("view", documentId);
      }
    } catch (error) {
      console.error("Failed to load document:", error);
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document || !documentUrl) return;
    
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      
      await landelaApi.logAction("download", documentId);
      toast({ title: "Download started" });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download document",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async () => {
    if (!documentUrl) return;
    
    const printWindow = window.open(documentUrl, "_blank");
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    }
    
    await landelaApi.logAction("print", documentId);
  };

  const handleReprocess = async () => {
    if (!document) return;
    
    try {
      setProcessing(true);
      const result = await landelaApi.processDocument(documentId, "full");
      
      if (result.success) {
        toast({ title: "Processing complete", description: "Document has been reprocessed" });
        await loadDocument();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (!document) return;
    
    try {
      await landelaApi.verifyDocument(documentId);
      toast({ title: "Document verified" });
      await loadDocument();
    } catch (error) {
      toast({
        title: "Verification failed",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
      case "final":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "indexing_required":
      case "pending_review":
        return "bg-amber-100 text-amber-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Document not found
      </div>
    );
  }

  return (
    <div className="flex h-full max-h-[90vh]">
      {/* Main Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.max(25, z - 25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.min(200, z + 25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="icon" onClick={() => setRotation((r) => (r + 90) % 360)}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            {onClose && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Document Display */}
        <div className="flex-1 overflow-auto bg-muted/30 p-4">
          <div
            className="mx-auto bg-white shadow-lg"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: "top center",
            }}
          >
            {document.mime_type === "application/pdf" && documentUrl ? (
              <iframe
                src={`${documentUrl}#toolbar=0`}
                className="w-full h-[800px] border-0"
                title={document.title}
              />
            ) : document.mime_type.startsWith("image/") && documentUrl ? (
              <img
                src={documentUrl}
                alt={document.title}
                className="max-w-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <FileText className="h-16 w-16 mb-4" />
                <p>Preview not available</p>
                <Button variant="outline" className="mt-4" onClick={handleDownload}>
                  Download to view
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold truncate">{document.title}</h3>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(document.status)}>
              {document.status.replace("_", " ")}
            </Badge>
            {document.sensitivity_level !== "normal" && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                {document.sensitivity_level}
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="details" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="ai">AI Results</TabsTrigger>
            <TabsTrigger value="ocr">OCR Text</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="details" className="p-4 m-0 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Document ID</Label>
                <p className="text-sm font-mono">{document.id.slice(0, 8)}</p>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <p className="text-sm">
                  {document.landela_document_types?.name || document.document_type_code}
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Badge variant="outline" className="text-xs">
                  {document.landela_document_types?.category || "Unknown"}
                </Badge>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Captured</Label>
                <p className="text-sm">{format(new Date(document.captured_at), "PPpp")}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Source</Label>
                <p className="text-sm capitalize">{document.source.replace("_", " ")}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">File</Label>
                <p className="text-sm truncate">{document.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {(document.file_size_bytes / 1024 / 1024).toFixed(2)} MB • {document.page_count} page(s)
                </p>
              </div>

              {document.verified_at && (
                <div>
                  <Label className="text-xs text-muted-foreground">Verified</Label>
                  <p className="text-sm flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    {format(new Date(document.verified_at), "PPpp")}
                  </p>
                </div>
              )}

              {document.tags && document.tags.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {document.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai" className="p-4 m-0 space-y-4">
              {document.ai_quality_score !== null && (
                <div>
                  <Label className="text-xs text-muted-foreground">Quality Score</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          document.ai_quality_score > 0.8
                            ? "bg-green-500"
                            : document.ai_quality_score > 0.5
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${document.ai_quality_score * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(document.ai_quality_score * 100)}%
                    </span>
                  </div>
                  {document.ai_quality_issues && document.ai_quality_issues.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {document.ai_quality_issues.map((issue, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {document.ai_classified && (
                <div>
                  <Label className="text-xs text-muted-foreground">Classification</Label>
                  <p className="text-sm">
                    Confidence: {Math.round((document.ai_classification_confidence || 0) * 100)}%
                  </p>
                </div>
              )}

              {document.ai_extracted_entities &&
                Object.keys(document.ai_extracted_entities).length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Extracted Entities</Label>
                    <div className="mt-1 space-y-1 text-sm">
                      {Object.entries(document.ai_extracted_entities).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </span>
                          <span className="font-medium truncate ml-2">
                            {typeof value === "string" ? value : JSON.stringify(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleReprocess}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Reprocess with AI
              </Button>
            </TabsContent>

            <TabsContent value="ocr" className="p-4 m-0">
              {document.ocr_text ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Confidence: {Math.round((document.ocr_confidence || 0) * 100)}%
                    </Label>
                    <Input
                      placeholder="Search text..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-32 h-7 text-xs"
                    />
                  </div>
                  <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap font-mono">
                    {searchQuery
                      ? document.ocr_text
                          .split(new RegExp(`(${searchQuery})`, "gi"))
                          .map((part, i) =>
                            part.toLowerCase() === searchQuery.toLowerCase() ? (
                              <mark key={i} className="bg-yellow-200">
                                {part}
                              </mark>
                            ) : (
                              part
                            )
                          )
                      : document.ocr_text}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No OCR text available</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleReprocess}
                    disabled={processing}
                  >
                    Run OCR
                  </Button>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Actions */}
        <div className="p-4 border-t space-y-2">
          {document.status === "indexing_required" || document.status === "pending_review" ? (
            <Button className="w-full" onClick={handleVerify}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Document
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
