import { useState, useEffect } from "react";
import { 
  Users, Search, MapPin, CheckCircle, Clock, 
  AlertTriangle, Eye, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface CommunitySubmissionsProps {
  onViewSubmission?: (submission: CommunitySubmission) => void;
}

interface CommunitySubmission {
  id: string;
  notification_type: 'birth' | 'death';
  status: string;
  reporter_name: string | null;
  reporter_phone: string | null;
  reporter_role: string | null;
  province: string | null;
  district: string | null;
  village: string | null;
  created_at: string;
}

export function CommunitySubmissions({ onViewSubmission }: CommunitySubmissionsProps) {
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crvs_community_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Load submissions error:', error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'verified':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'converted':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" />Converted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role || 'other') {
      case 'community_health_worker':
        return <Badge variant="secondary">CHW</Badge>;
      case 'traditional_leader':
        return <Badge variant="secondary">Traditional Leader</Badge>;
      case 'family_member':
        return <Badge variant="outline">Family</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    return searchTerm === "" || 
      (sub.reporter_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (sub.village?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (sub.district?.toLowerCase() || '').includes(searchTerm.toLowerCase());
  });

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    verified: submissions.filter(s => s.status === 'verified').length,
    births: submissions.filter(s => s.notification_type === 'birth').length,
    deaths: submissions.filter(s => s.notification_type === 'death').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Community Submissions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vital events reported from the community
          </p>
        </div>
        <Button onClick={loadSubmissions} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.births}</div>
            <div className="text-sm text-muted-foreground">Births</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.deaths}</div>
            <div className="text-sm text-muted-foreground">Deaths</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by reporter name, village, or district..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      {/* Submissions List */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading submissions...
          </CardContent>
        </Card>
      ) : filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No community submissions found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onViewSubmission?.(submission)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={submission.notification_type === 'birth' ? 'default' : 'secondary'}>
                        {submission.notification_type.toUpperCase()}
                      </Badge>
                      {getStatusBadge(submission.status)}
                      {getRoleBadge(submission.reporter_role || 'other')}
                    </div>
                    <div className="font-medium">{submission.reporter_name || 'Unknown Reporter'}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {submission.reporter_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {submission.reporter_phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[submission.village, submission.district, submission.province].filter(Boolean).join(', ') || 'Unknown location'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(submission.created_at), 'dd MMM yyyy')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(submission.created_at), 'HH:mm')}
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
