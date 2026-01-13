import { useState, useEffect } from "react";
import { 
  AlertTriangle, Search, CheckCircle, XCircle, 
  Clock, Eye, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface QualityFlagsProps {
  onResolveFlag?: (flag: QualityFlag) => void;
}

interface QualityFlag {
  id: string;
  notification_type: 'birth' | 'death';
  notification_id: string;
  flag_type: string;
  flag_description: string;
  severity: string;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export function QualityFlags({ onResolveFlag }: QualityFlagsProps) {
  const [flags, setFlags] = useState<QualityFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    loadFlags();
  }, [showResolved]);

  const loadFlags = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('crvs_quality_flags')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!showResolved) {
        query = query.eq('resolved', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Load flags error:', error);
      toast.error("Failed to load quality flags");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Critical</Badge>;
      case 'error':
        return <Badge variant="destructive" className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case 'info':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Info</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getFlagTypeBadge = (flagType: string) => {
    const types: Record<string, { label: string; color: string }> = {
      'missing_data': { label: 'Missing Data', color: 'bg-orange-100 text-orange-700' },
      'late_registration': { label: 'Late Registration', color: 'bg-yellow-100 text-yellow-700' },
      'duplicate_suspect': { label: 'Possible Duplicate', color: 'bg-purple-100 text-purple-700' },
      'invalid_id': { label: 'Invalid ID', color: 'bg-red-100 text-red-700' },
      'age_mismatch': { label: 'Age Mismatch', color: 'bg-blue-100 text-blue-700' },
      'location_issue': { label: 'Location Issue', color: 'bg-green-100 text-green-700' },
    };
    const type = types[flagType] || { label: flagType, color: 'bg-gray-100 text-gray-700' };
    return <Badge variant="outline" className={type.color}>{type.label}</Badge>;
  };

  const handleResolve = async (flag: QualityFlag) => {
    try {
      const { error } = await supabase
        .from('crvs_quality_flags')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', flag.id);

      if (error) throw error;
      
      toast.success("Flag resolved");
      loadFlags();
      onResolveFlag?.(flag);
    } catch (error) {
      console.error('Resolve flag error:', error);
      toast.error("Failed to resolve flag");
    }
  };

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = searchTerm === "" || 
      flag.flag_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.notification_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || flag.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const stats = {
    total: flags.length,
    critical: flags.filter(f => f.severity === 'critical' && !f.resolved).length,
    warnings: flags.filter(f => f.severity === 'warning' && !f.resolved).length,
    resolved: flags.filter(f => f.resolved).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Quality Flags
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Data quality issues requiring attention
          </p>
        </div>
        <Button onClick={loadFlags} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Flags</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search flags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showResolved ? "default" : "outline"}
          size="sm"
          onClick={() => setShowResolved(!showResolved)}
        >
          {showResolved ? 'Hide Resolved' : 'Show Resolved'}
        </Button>
      </div>

      {/* Flags List */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading quality flags...
          </CardContent>
        </Card>
      ) : filteredFlags.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p>No quality flags found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFlags.map((flag) => (
            <Card key={flag.id} className={flag.resolved ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(flag.severity)}
                      {getFlagTypeBadge(flag.flag_type)}
                      <Badge variant="outline">
                        {flag.notification_type.toUpperCase()}
                      </Badge>
                      {flag.resolved && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{flag.flag_description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Notification: {flag.notification_id.slice(0, 8)}...</span>
                      <span>Created: {format(new Date(flag.created_at), 'dd MMM yyyy HH:mm')}</span>
                      {flag.resolved_at && (
                        <span>Resolved: {format(new Date(flag.resolved_at), 'dd MMM yyyy HH:mm')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!flag.resolved && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResolve(flag)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                    )}
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
