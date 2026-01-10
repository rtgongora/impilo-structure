// Visit Summary Viewer Component
import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Download,
  Share2,
  RefreshCw,
  QrCode,
  Clock,
  CheckCircle,
  Pill,
  FlaskConical,
  Stethoscope,
  ArrowRight,
  User,
  Building2,
  Copy,
  Check,
  Loader2,
  PenLine,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { useVisitSummary } from "@/hooks/useSummaries";
import type { ShareOptions, RecipientType, AccessLevel } from "@/types/summary";
import { toast } from "sonner";

interface VisitSummaryViewerProps {
  encounterId: string;
  patientName?: string;
  onClose?: () => void;
}

export function VisitSummaryViewer({
  encounterId,
  patientName,
  onClose,
}: VisitSummaryViewerProps) {
  const {
    summary,
    loading,
    generating,
    signing,
    fetchSummary,
    generateNewSummary,
    signSummary,
    shareSummary,
  } = useVisitSummary(encounterId);
  
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'provider' | 'patient'>('provider');
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    recipientType: 'patient',
    accessLevel: 'patient_friendly',
    expiresInHours: 168, // 7 days
    generateQR: true,
  });
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleGenerate = async () => {
    await generateNewSummary({
      includeProviderDetails: true,
      patientFriendly: true,
      includeAllInvestigations: true,
      includePendingResults: true,
    });
  };

  const handleSign = async () => {
    await signSummary();
  };

  const handleShare = async () => {
    const token = await shareSummary(shareOptions);
    if (token) {
      setShareUrl(token.qrCodeUrl || `${window.location.origin}/shared/visit/${token.token}`);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = (type: 'provider' | 'patient') => {
    if (!summary) return;
    
    const html = type === 'provider' ? summary.providerSummaryHtml : summary.patientSummaryHtml;
    
    if (!html) {
      toast.error('Summary content not available');
      return;
    }
    
    // Create downloadable HTML file
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Visit Summary - ${patientName || 'Patient'}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 24px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
    .visit-summary { background: #f9fafb; padding: 20px; border-radius: 8px; }
    section { margin-bottom: 20px; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  ${html}
</body>
</html>
    `;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VisitSummary_${type}_${format(new Date(), 'yyyy-MM-dd')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${type === 'provider' ? 'Provider' : 'Patient'} summary downloaded`);
  };

  const getStatusBadge = () => {
    if (!summary) return null;
    
    switch (summary.status) {
      case 'final':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Signed</Badge>;
      case 'draft':
        return <Badge variant="outline"><PenLine className="h-3 w-3 mr-1" />Draft</Badge>;
      case 'amended':
        return <Badge variant="secondary"><FileCheck className="h-3 w-3 mr-1" />Amended</Badge>;
      default:
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />{summary.status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Visit Summary
            </CardTitle>
            <CardDescription>
              {patientName && <span className="font-medium">{patientName}</span>}
              {summary?.visitType && <span className="ml-2">• {summary.visitType}</span>}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {summary && getStatusBadge()}
            {summary ? (
              <>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  v{summary.version}
                </Badge>
                <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </>
            ) : (
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {summary ? (
        <>
          <div className="px-6 pb-3 flex flex-wrap gap-2">
            {summary.status === 'draft' && (
              <Button size="sm" onClick={handleSign} disabled={signing}>
                {signing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Sign & Finalize
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => handleDownload(viewMode)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowShareDialog(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowQR(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
            <div className="ml-auto">
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'provider' | 'patient')}>
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="provider">Provider View</SelectItem>
                  <SelectItem value="patient">Patient View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <CardContent>
            {/* Visit Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Facility</p>
                <p className="font-medium flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {summary.facilityName || 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Visit Date</p>
                <p className="font-medium">
                  {summary.visitStart ? format(new Date(summary.visitStart), 'PP') : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Visit Type</p>
                <p className="font-medium">{summary.visitType || 'N/A'}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Attending</p>
                <p className="font-medium flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {summary.attendingProviders?.[0]?.name || 'N/A'}
                </p>
              </div>
            </div>

            <Tabs defaultValue="clinical" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="clinical" className="text-xs">
                  <Stethoscope className="h-3 w-3 mr-1" />
                  Clinical
                </TabsTrigger>
                <TabsTrigger value="medications" className="text-xs">
                  <Pill className="h-3 w-3 mr-1" />
                  Medications
                </TabsTrigger>
                <TabsTrigger value="investigations" className="text-xs">
                  <FlaskConical className="h-3 w-3 mr-1" />
                  Investigations
                </TabsTrigger>
                <TabsTrigger value="disposition" className="text-xs">
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Disposition
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[280px] mt-4">
                <TabsContent value="clinical" className="space-y-4">
                  {/* Chief Complaint */}
                  <div>
                    <h4 className="font-medium mb-2">Presenting Complaint</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {summary.presentingComplaint || 'Not documented'}
                    </p>
                  </div>

                  {/* Key Findings */}
                  {summary.keyFindings && (
                    <div>
                      <h4 className="font-medium mb-2">Key Findings</h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {summary.keyFindings}
                      </p>
                    </div>
                  )}

                  {/* Diagnoses */}
                  <div>
                    <h4 className="font-medium mb-2">Diagnoses</h4>
                    {summary.diagnoses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No diagnoses recorded</p>
                    ) : (
                      <div className="space-y-2">
                        {summary.diagnoses.map((dx, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="font-medium">{dx.name}</span>
                            <Badge variant={dx.type === 'primary' ? 'default' : 'secondary'}>
                              {dx.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="medications" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Medications Prescribed</h4>
                    {summary.medicationsPrescribed.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No medications prescribed</p>
                    ) : (
                      <div className="space-y-2">
                        {summary.medicationsPrescribed.map((med, i) => (
                          <div key={i} className="p-3 bg-muted/50 rounded-lg">
                            <p className="font-medium">{med.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {[med.dose, med.route, med.frequency].filter(Boolean).join(' • ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {summary.medicationsChanged.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Medication Changes</h4>
                      <div className="space-y-2">
                        {summary.medicationsChanged.map((med, i) => (
                          <div key={i} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{med.name}</p>
                              <Badge variant="outline">{med.changeType}</Badge>
                            </div>
                            {med.reason && (
                              <p className="text-sm text-muted-foreground mt-1">{med.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="investigations" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Investigations Ordered</h4>
                    {summary.investigationsOrdered.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No investigations ordered</p>
                    ) : (
                      <div className="space-y-2">
                        {summary.investigationsOrdered.map((inv, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">{inv.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Ordered: {format(new Date(inv.orderedAt), 'PP')}
                              </p>
                            </div>
                            <Badge variant={inv.status === 'completed' ? 'default' : 'secondary'}>
                              {inv.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {summary.investigationsPending.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Pending Results
                      </h4>
                      <div className="space-y-2">
                        {summary.investigationsPending.map((inv, i) => (
                          <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="font-medium">{inv.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="disposition" className="space-y-4">
                  {/* Disposition */}
                  <div>
                    <h4 className="font-medium mb-2">Outcome</h4>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Badge variant="outline" className="mb-2">
                        {summary.disposition?.replace('_', ' ').toUpperCase() || 'Pending'}
                      </Badge>
                      {summary.dispositionDetails && (
                        <p className="text-sm text-muted-foreground">{summary.dispositionDetails}</p>
                      )}
                    </div>
                  </div>

                  {/* Follow-up */}
                  {summary.followUpPlan && (
                    <div>
                      <h4 className="font-medium mb-2">Follow-up Plan</h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {summary.followUpPlan}
                      </p>
                    </div>
                  )}

                  {/* Return Precautions */}
                  {summary.returnPrecautions && (
                    <div>
                      <h4 className="font-medium mb-2 text-amber-600">Return Precautions</h4>
                      <p className="text-sm bg-amber-50 border border-amber-200 p-3 rounded-lg">
                        {summary.returnPrecautions}
                      </p>
                    </div>
                  )}

                  {/* Referrals */}
                  {summary.referralsMade.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Referrals</h4>
                      <div className="space-y-2">
                        {summary.referralsMade.map((ref, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">{ref.destination}</p>
                              <p className="text-sm text-muted-foreground">{ref.reason}</p>
                            </div>
                            <Badge variant={ref.urgency === 'emergent' ? 'destructive' : 'outline'}>
                              {ref.urgency}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <Separator className="my-4" />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {summary.signedBy ? (
                  <>Signed: {summary.signedAt ? format(new Date(summary.signedAt), 'PPp') : 'N/A'}</>
                ) : (
                  'Not yet signed'
                )}
              </span>
              <span>Last updated: {format(new Date(summary.updatedAt), 'PPp')}</span>
            </div>
          </CardContent>
        </>
      ) : (
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Visit Summary Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate a visit summary to document this encounter.
            </p>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Summary
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Visit Summary</DialogTitle>
            <DialogDescription>
              Create a secure, time-limited share link for this visit summary.
            </DialogDescription>
          </DialogHeader>

          {shareUrl ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground">Share Link</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={shareUrl} readOnly className="text-sm" />
                  <Button size="sm" variant="outline" onClick={handleCopyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button className="w-full" onClick={() => { setShareUrl(null); setShowShareDialog(false); }}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label>Recipient Type</Label>
                  <Select
                    value={shareOptions.recipientType}
                    onValueChange={(v) => setShareOptions(prev => ({ ...prev, recipientType: v as RecipientType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="caregiver">Caregiver</SelectItem>
                      <SelectItem value="provider">Healthcare Provider</SelectItem>
                      <SelectItem value="facility">Healthcare Facility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Access Level</Label>
                  <Select
                    value={shareOptions.accessLevel}
                    onValueChange={(v) => setShareOptions(prev => ({ ...prev, accessLevel: v as AccessLevel }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient_friendly">Patient-Friendly View</SelectItem>
                      <SelectItem value="full">Full Clinical Details</SelectItem>
                      <SelectItem value="redacted">Redacted (Sensitive info hidden)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Expires In</Label>
                  <Select
                    value={shareOptions.expiresInHours.toString()}
                    onValueChange={(v) => setShareOptions(prev => ({ ...prev, expiresInHours: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="72">3 days</SelectItem>
                      <SelectItem value="168">7 days</SelectItem>
                      <SelectItem value="720">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Create Share Link
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Share QR Code</DialogTitle>
            <DialogDescription>
              Patient can scan this QR code to view their visit summary
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mb-4">
              <QrCode className="h-32 w-32 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              QR code contains a secure, time-limited access link to the patient-friendly summary
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQR(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
