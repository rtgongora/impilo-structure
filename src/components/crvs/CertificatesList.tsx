import { useState, useEffect } from "react";
import { 
  FileText, Search, Download, Printer, Eye, 
  CheckCircle, Clock, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface CertificatesListProps {
  onViewCertificate?: (certificate: Certificate) => void;
}

interface Certificate {
  id: string;
  certificate_type: 'birth' | 'death';
  certificate_number: string | null;
  registration_number: string;
  status: string;
  issued_at: string | null;
  created_at: string;
  notification_id: string;
}

export function CertificatesList({ onViewCertificate }: CertificatesListProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"birth" | "death">("birth");

  useEffect(() => {
    loadCertificates();
  }, [activeTab]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crvs_certificates')
        .select('*')
        .eq('certificate_type', activeTab)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Load certificates error:', error);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Issued</Badge>;
      case 'pending_print':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending Print</Badge>;
      case 'collected':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" />Collected</Badge>;
      case 'pending_collection':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><AlertTriangle className="w-3 h-3 mr-1" />Awaiting Collection</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    return searchTerm === "" || 
      cert.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificate_number?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = {
    total: certificates.length,
    issued: certificates.filter(c => c.status === 'issued').length,
    pendingPrint: certificates.filter(c => c.status === 'pending_print').length,
    collected: certificates.filter(c => c.status === 'collected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Certificates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage issued certificates
          </p>
        </div>
        <Button onClick={loadCertificates} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Certificates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.issued}</div>
            <div className="text-sm text-muted-foreground">Issued</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingPrint}</div>
            <div className="text-sm text-muted-foreground">Pending Print</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.collected}</div>
            <div className="text-sm text-muted-foreground">Collected</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Search */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "birth" | "death")}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="birth">Birth Certificates</TabsTrigger>
            <TabsTrigger value="death">Death Certificates</TabsTrigger>
          </TabsList>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by registration number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-72"
            />
          </div>
        </div>

        <TabsContent value="birth" className="mt-4">
          <CertificateTable 
            certificates={filteredCertificates} 
            loading={loading}
            onView={onViewCertificate}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        <TabsContent value="death" className="mt-4">
          <CertificateTable 
            certificates={filteredCertificates} 
            loading={loading}
            onView={onViewCertificate}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CertificateTable({ 
  certificates, 
  loading,
  onView,
  getStatusBadge
}: { 
  certificates: Certificate[]; 
  loading: boolean;
  onView?: (certificate: Certificate) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading certificates...
        </CardContent>
      </Card>
    );
  }

  if (certificates.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No certificates found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Registration #</th>
              <th className="text-left p-3 font-medium">Certificate #</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Issued Date</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {certificates.map((cert) => (
              <tr key={cert.id} className="hover:bg-muted/50">
                <td className="p-3 font-mono text-sm">{cert.registration_number}</td>
                <td className="p-3 font-mono text-sm">{cert.certificate_number || '-'}</td>
                <td className="p-3">{getStatusBadge(cert.status)}</td>
                <td className="p-3 text-sm text-muted-foreground">
                  {cert.issued_at ? format(new Date(cert.issued_at), 'dd MMM yyyy') : '-'}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onView?.(cert)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
