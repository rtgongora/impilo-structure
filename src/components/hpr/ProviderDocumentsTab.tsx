/**
 * Provider Documents Management Tab
 * Upload, view, and manage provider documents (qualifications, IDs, certificates)
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Upload, FileText, Image, CheckCircle, XCircle, Clock, 
  Eye, Download, Trash2, AlertTriangle, RefreshCw 
} from 'lucide-react';

interface DocumentType {
  id: string;
  code: string;
  name: string;
  category: string;
  is_mandatory: boolean;
  requires_expiry: boolean;
  requires_verification: boolean;
}

interface ProviderDocument {
  id: string;
  provider_id: string;
  document_type_code: string;
  title: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  issuing_authority: string | null;
  is_verified: boolean;
  verified_at: string | null;
  version: number;
  is_current: boolean;
  created_at: string;
}

interface ProviderDocumentsTabProps {
  providerId: string;
  isAdmin?: boolean;
}

export const ProviderDocumentsTab = ({ providerId, isAdmin = false }: ProviderDocumentsTabProps) => {
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    documentTypeCode: '',
    title: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: '',
    file: null as File | null,
  });

  useEffect(() => {
    loadDocumentTypes();
    loadDocuments();
  }, [providerId]);

  const loadDocumentTypes = async () => {
    const { data, error } = await supabase
      .from('ref_document_types')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) {
      console.error('Error loading document types:', error);
    } else {
      setDocumentTypes(data || []);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('provider_documents')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_current', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.documentTypeCode || !uploadForm.title) {
      toast.error('Please fill required fields and select a file');
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${providerId}/${uploadForm.documentTypeCode}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('provider-documents')
        .upload(fileName, uploadForm.file);

      if (uploadError) {
        throw uploadError;
      }

      // Create document record
      const { error: insertError } = await supabase
        .from('provider_documents')
        .insert({
          provider_id: providerId,
          document_type_code: uploadForm.documentTypeCode,
          title: uploadForm.title,
          file_path: fileName,
          file_name: uploadForm.file.name,
          file_size: uploadForm.file.size,
          mime_type: uploadForm.file.type,
          document_number: uploadForm.documentNumber || null,
          issue_date: uploadForm.issueDate || null,
          expiry_date: uploadForm.expiryDate || null,
          issuing_authority: uploadForm.issuingAuthority || null,
        });

      if (insertError) {
        throw insertError;
      }

      toast.success('Document uploaded successfully');
      setDialogOpen(false);
      setUploadForm({
        documentTypeCode: '',
        title: '',
        documentNumber: '',
        issueDate: '',
        expiryDate: '',
        issuingAuthority: '',
        file: null,
      });
      loadDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (documentId: string) => {
    const { error } = await supabase
      .from('provider_documents')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (error) {
      toast.error('Failed to verify document');
    } else {
      toast.success('Document verified');
      loadDocuments();
    }
  };

  const handleDelete = async (document: ProviderDocument) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    // Delete from storage
    await supabase.storage.from('provider-documents').remove([document.file_path]);

    // Delete record
    const { error } = await supabase
      .from('provider_documents')
      .delete()
      .eq('id', document.id);

    if (error) {
      toast.error('Failed to delete document');
    } else {
      toast.success('Document deleted');
      loadDocuments();
    }
  };

  const getDocumentUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('provider-documents')
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl;
  };

  const handleView = async (document: ProviderDocument) => {
    const url = await getDocumentUrl(document.file_path);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Failed to generate document URL');
    }
  };

  const categories = ['identity', 'education', 'license', 'cme', 'employment'];
  
  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(d => {
        const type = documentTypes.find(t => t.code === d.document_type_code);
        return type?.category === selectedCategory;
      });

  const getMissingMandatoryDocs = () => {
    const mandatoryTypes = documentTypes.filter(t => t.is_mandatory);
    return mandatoryTypes.filter(t => !documents.some(d => d.document_type_code === t.code));
  };

  const getExpiringDocs = () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return documents.filter(d => d.expiry_date && new Date(d.expiry_date) <= thirtyDaysFromNow);
  };

  const missingDocs = getMissingMandatoryDocs();
  const expiringDocs = getExpiringDocs();

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {(missingDocs.length > 0 || expiringDocs.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missingDocs.length > 0 && (
            <Card className="border-destructive">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Missing Mandatory Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {missingDocs.map(doc => (
                    <li key={doc.code} className="text-muted-foreground">• {doc.name}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {expiringDocs.length > 0 && (
            <Card className="border-warning">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-warning">
                  <Clock className="h-4 w-4" />
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {expiringDocs.map(doc => (
                    <li key={doc.id} className="text-muted-foreground">
                      • {doc.title} (expires {format(new Date(doc.expiry_date!), 'PP')})
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Manage provider documents, qualifications, and certificates
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Upload New Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Document Type *</Label>
                    <Select 
                      value={uploadForm.documentTypeCode}
                      onValueChange={(v) => setUploadForm(prev => ({ ...prev, documentTypeCode: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <div key={cat}>
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                              {cat}
                            </div>
                            {documentTypes
                              .filter(t => t.category === cat)
                              .map(type => (
                                <SelectItem key={type.code} value={type.code}>
                                  {type.name} {type.is_mandatory && '(Required)'}
                                </SelectItem>
                              ))
                            }
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Document Title *</Label>
                    <Input
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Medical Degree Certificate"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Document Number</Label>
                      <Input
                        value={uploadForm.documentNumber}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, documentNumber: e.target.value }))}
                        placeholder="e.g., ID number"
                      />
                    </div>
                    <div>
                      <Label>Issuing Authority</Label>
                      <Input
                        value={uploadForm.issuingAuthority}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, issuingAuthority: e.target.value }))}
                        placeholder="e.g., University"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Issue Date</Label>
                      <Input
                        type="date"
                        value={uploadForm.issueDate}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, issueDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Expiry Date</Label>
                      <Input
                        type="date"
                        value={uploadForm.expiryDate}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>File *</Label>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, PNG, GIF, WEBP. Max 10MB.
                    </p>
                  </div>

                  <Button onClick={handleUpload} disabled={uploading} className="w-full">
                    {uploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload Document'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList>
              <TabsTrigger value="all">All ({documents.length})</TabsTrigger>
              {categories.map(cat => {
                const count = documents.filter(d => {
                  const type = documentTypes.find(t => t.code === d.document_type_code);
                  return type?.category === cat;
                }).length;
                return (
                  <TabsTrigger key={cat} value={cat} className="capitalize">
                    {cat} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No documents found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map(doc => {
                      const docType = documentTypes.find(t => t.code === doc.document_type_code);
                      const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                      
                      return (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {doc.mime_type?.startsWith('image/') ? (
                                <Image className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div>
                                <div className="font-medium">{doc.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {doc.file_name}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {docType?.category || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{doc.document_number || '-'}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {doc.issue_date && (
                                <div>Issued: {format(new Date(doc.issue_date), 'PP')}</div>
                              )}
                              {doc.expiry_date && (
                                <div className={isExpired ? 'text-destructive' : ''}>
                                  Expires: {format(new Date(doc.expiry_date), 'PP')}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isExpired ? (
                              <Badge variant="destructive">Expired</Badge>
                            ) : doc.is_verified ? (
                              <Badge className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(doc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {isAdmin && !doc.is_verified && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleVerify(doc.id)}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(doc)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
