/**
 * Digital Health ID Card
 * Displays patient's Health ID with QR code for check-in
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Download, 
  Share2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  Calendar,
  Phone,
  Fingerprint,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface HealthIdCardProps {
  healthId: string;
  givenNames: string;
  familyName: string;
  dateOfBirth?: string;
  sex?: string;
  phone?: string;
  verificationStatus: 'verified' | 'pending' | 'needs_verification';
  biometricEnrolled?: boolean;
}

export function HealthIdCard({
  healthId,
  givenNames,
  familyName,
  dateOfBirth,
  sex,
  phone,
  verificationStatus,
  biometricEnrolled = false,
}: HealthIdCardProps) {
  const [showQr, setShowQr] = useState(false);

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'verified':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending Verification
          </Badge>
        );
      case 'needs_verification':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Needs Verification
          </Badge>
        );
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(healthId);
    toast.success('Health ID copied to clipboard');
  };

  const handleDownload = () => {
    toast.info('Preparing Health ID card for download...');
    // Would generate PDF/image of the card
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Health ID',
          text: `Health ID: ${healthId}`,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyId();
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Card Header with gradient */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide opacity-80">National Health ID</p>
              <p className="font-bold text-lg">Impilo Health</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Health ID Display */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Health ID</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-lg font-bold tracking-wide">{healthId}</p>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyId}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Personal Details */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Full Name</p>
            <p className="font-medium">{givenNames} {familyName}</p>
          </div>
          {dateOfBirth && (
            <div>
              <p className="text-xs text-muted-foreground">Date of Birth</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {format(new Date(dateOfBirth), 'dd MMM yyyy')}
              </p>
            </div>
          )}
          {sex && (
            <div>
              <p className="text-xs text-muted-foreground">Sex</p>
              <p className="font-medium capitalize">{sex}</p>
            </div>
          )}
          {phone && (
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {phone}
              </p>
            </div>
          )}
        </div>

        {/* Biometric Status */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <Fingerprint className={`h-5 w-5 ${biometricEnrolled ? 'text-success' : 'text-muted-foreground'}`} />
          <span className="text-sm">
            {biometricEnrolled ? 'Biometrics enrolled' : 'Biometrics not enrolled'}
          </span>
          {!biometricEnrolled && (
            <Button variant="link" size="sm" className="ml-auto text-xs h-auto p-0">
              Enroll at facility
            </Button>
          )}
        </div>

        {/* QR Code Section */}
        {showQr ? (
          <div className="flex flex-col items-center p-4 border rounded-lg bg-background">
            <div className="h-40 w-40 bg-muted rounded-lg flex items-center justify-center mb-3">
              {/* QR Code would be generated here */}
              <div className="text-center">
                <QrCode className="h-24 w-24 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">QR Code</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Show this QR code at the facility for quick check-in
            </p>
            <Button variant="ghost" size="sm" onClick={() => setShowQr(false)} className="mt-2">
              Hide QR Code
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowQr(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            Show QR Code for Check-in
          </Button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>

        {/* Verification Notice */}
        {verificationStatus === 'pending' && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-sm text-warning-foreground">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Your Health ID is awaiting verification. Some services may be limited until verification is complete.
            </p>
          </div>
        )}

        {verificationStatus === 'needs_verification' && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Please visit a health facility to verify your identity and complete registration.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
