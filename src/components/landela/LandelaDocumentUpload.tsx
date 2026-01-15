import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Loader2, Camera, Scan, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { landelaApi, DocumentType } from "@/lib/api/landela";
import { useQuery } from "@tanstack/react-query";

interface LandelaDocumentUploadProps {
  patientId?: string;
  encounterId?: string;
  visitId?: string;
  facilityId?: string;
  onUploadComplete?: (documentId: string) => void;
  onClose?: () => void;
  compact?: boolean;
}

interface UploadingFile {
  file: File;
  title: string;
  documentTypeCode: string;
  progress: number;
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  documentId?: string;
  error?: string;
}

export function LandelaDocumentUpload({
  patientId,
  encounterId,
  visitId,
  facilityId,
  onUploadComplete,
  onClose,
  compact = false,
}: LandelaDocumentUploadProps) {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [captureMode, setCaptureMode] = useState<"upload" | "camera" | "scan">("upload");
  const [autoProcess, setAutoProcess] = useState(true);

  const { data: documentTypes = [] } = useQuery({
    queryKey: ["landela-document-types"],
    queryFn: () => landelaApi.getDocumentTypes(),
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadingFile[] = acceptedFiles.map((file) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ""),
      documentTypeCode: "OTHER",
      progress: 0,
      status: "pending",
    }));
    setUploadingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/tiff": [".tiff", ".tif"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    multiple: true,
  });

  const updateFile = (index: number, updates: Partial<UploadingFile>) => {
    setUploadingFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const removeFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (uploadFile: UploadingFile, index: number) => {
    try {
      updateFile(index, { status: "uploading", progress: 20 });

      const document = await landelaApi.uploadDocument(uploadFile.file, {
        title: uploadFile.title,
        documentTypeCode: uploadFile.documentTypeCode,
        source: captureMode === "camera" ? "mobile_camera" : "file_upload",
        facilityId,
        patientId,
        encounterId,
        visitId,
      });

      updateFile(index, { progress: 60, documentId: document.id });

      if (autoProcess) {
        updateFile(index, { status: "processing", progress: 70 });
        
        const result = await landelaApi.processDocument(document.id, "full");
        
        if (!result.success) {
          console.warn("AI processing failed:", result.error);
        }
      }

      updateFile(index, { status: "complete", progress: 100 });
      onUploadComplete?.(document.id);

      toast({
        title: "Document uploaded",
        description: `${uploadFile.title} has been uploaded successfully`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      updateFile(index, {
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      });
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      });
    }
  };

  const uploadAll = async () => {
    const pendingFiles = uploadingFiles.filter((f) => f.status === "pending");
    for (let i = 0; i < uploadingFiles.length; i++) {
      if (uploadingFiles[i].status === "pending") {
        await uploadFile(uploadingFiles[i], i);
      }
    }
  };

  const groupedTypes = documentTypes.reduce(
    (acc, type) => {
      if (!acc[type.category]) acc[type.category] = [];
      acc[type.category].push(type);
      return acc;
    },
    {} as Record<string, DocumentType[]>
  );

  const categoryLabels: Record<string, string> = {
    clinical: "Clinical",
    civil_registry: "Registry/Civil",
    admin_erp: "Admin/ERP",
    hr: "HR",
    asset: "Assets",
    telemedicine: "Telemedicine",
    general: "General",
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">
            Drop files or click to upload
          </p>
        </div>

        {uploadingFiles.length > 0 && (
          <div className="space-y-2">
            {uploadingFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                <File className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm truncate flex-1">{f.file.name}</span>
                {f.status === "uploading" || f.status === "processing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : f.status === "complete" ? (
                  <Badge variant="secondary" className="text-xs">Done</Badge>
                ) : f.status === "error" ? (
                  <Badge variant="destructive" className="text-xs">Error</Badge>
                ) : (
                  <Button size="icon" variant="ghost" onClick={() => removeFile(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button size="sm" onClick={uploadAll} className="w-full">
              Upload All
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={captureMode} onValueChange={(v) => setCaptureMode(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">File Upload</span>
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Camera</span>
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              <span className="hidden sm:inline">Scanner</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                {isDragActive
                  ? "Drop files here..."
                  : "Drag & drop files here, or click to select"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, JPG, PNG, TIFF, DOC, DOCX (max 50MB)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="camera" className="mt-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Camera className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Camera capture coming soon
              </p>
              <Button variant="outline" className="mt-4" disabled>
                Open Camera
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="scan" className="mt-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Scan className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Scanner integration requires desktop client
              </p>
              <Button variant="outline" className="mt-4" disabled>
                Connect Scanner
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {uploadingFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Files to upload ({uploadingFiles.length})</h4>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoProcess}
                  onChange={(e) => setAutoProcess(e.target.checked)}
                  className="rounded"
                />
                Auto-process with AI
              </label>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {uploadingFiles.map((f, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-start gap-3">
                    <File className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Input
                        value={f.title}
                        onChange={(e) => updateFile(i, { title: e.target.value })}
                        placeholder="Document title"
                        disabled={f.status !== "pending"}
                      />
                      <Select
                        value={f.documentTypeCode}
                        onValueChange={(v) => updateFile(i, { documentTypeCode: v })}
                        disabled={f.status !== "pending"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(groupedTypes).map(([category, types]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                {categoryLabels[category] || category}
                              </div>
                              {types.map((type) => (
                                <SelectItem key={type.code} value={type.code}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {f.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {(f.status === "uploading" || f.status === "processing") && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {f.status === "uploading" ? "Uploading..." : "Processing with AI..."}
                        </span>
                        <span>{f.progress}%</span>
                      </div>
                      <Progress value={f.progress} className="h-1" />
                    </div>
                  )}

                  {f.status === "complete" && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ✓ Uploaded successfully
                    </Badge>
                  )}

                  {f.status === "error" && (
                    <Badge variant="destructive">
                      ✕ {f.error || "Upload failed"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={uploadAll}
                disabled={uploadingFiles.every((f) => f.status !== "pending")}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload All
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
