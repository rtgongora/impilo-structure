import { useState, useEffect } from "react";
import { 
  ClipboardCheck, Search, Filter, CheckCircle, XCircle, 
  Clock, AlertTriangle, Eye, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface RegistrarQueueProps {
  onSelectItem?: (item: QueueItem) => void;
}

interface QueueItem {
  id: string;
  notification_id: string;
  notification_type: 'birth' | 'death';
  queue_status: string;
  priority: string;
  created_at: string;
  notification_number?: string;
  name?: string;
}

export function RegistrarQueue({ onSelectItem }: RegistrarQueueProps) {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"birth" | "death">("birth");

  useEffect(() => {
    loadQueue();
  }, [activeTab]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crvs_registrar_queue')
        .select('*')
        .eq('notification_type', activeTab)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setQueueItems(data || []);
    } catch (error) {
      console.error('Load queue error:', error);
      toast.error("Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Eye className="w-3 h-3 mr-1" />Reviewing</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'info_requested':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><AlertTriangle className="w-3 h-3 mr-1" />Info Needed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  const filteredItems = queueItems.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.notification_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.queue_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: queueItems.filter(i => i.queue_status === 'pending_review').length,
    reviewing: queueItems.filter(i => i.queue_status === 'under_review').length,
    approved: queueItems.filter(i => i.queue_status === 'approved').length,
    infoNeeded: queueItems.filter(i => i.queue_status === 'info_requested').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Registrar Queue
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve vital events registrations
          </p>
        </div>
        <Button onClick={loadQueue} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.reviewing}</div>
            <div className="text-sm text-muted-foreground">Under Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-muted-foreground">Approved Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.infoNeeded}</div>
            <div className="text-sm text-muted-foreground">Info Requested</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "birth" | "death")}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="birth">Birth Registrations</TabsTrigger>
            <TabsTrigger value="death">Death Registrations</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="info_requested">Info Requested</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="birth" className="mt-4">
          <QueueList 
            items={filteredItems} 
            loading={loading} 
            onSelect={onSelectItem}
            getStatusBadge={getStatusBadge}
            getPriorityBadge={getPriorityBadge}
          />
        </TabsContent>
        <TabsContent value="death" className="mt-4">
          <QueueList 
            items={filteredItems} 
            loading={loading} 
            onSelect={onSelectItem}
            getStatusBadge={getStatusBadge}
            getPriorityBadge={getPriorityBadge}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QueueList({ 
  items, 
  loading, 
  onSelect,
  getStatusBadge,
  getPriorityBadge 
}: { 
  items: QueueItem[]; 
  loading: boolean;
  onSelect?: (item: QueueItem) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getPriorityBadge: (priority: string) => React.ReactNode;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading queue...
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No items in queue
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {items.map((item) => (
            <div 
              key={item.id}
              className="p-4 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
              onClick={() => onSelect?.(item)}
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-medium">
                    {item.notification_id.slice(0, 8)}...
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(item.created_at), 'dd MMM yyyy HH:mm')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.priority && getPriorityBadge(item.priority)}
                {getStatusBadge(item.queue_status)}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
