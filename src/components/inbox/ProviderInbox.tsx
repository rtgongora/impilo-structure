import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Inbox,
  Send,
  Pill,
  FileText,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  MoreVertical,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RequestType = 'prescription' | 'order' | 'referral' | 'consult';
type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'expired';
type RequestDirection = 'incoming' | 'outgoing';

interface InboxRequest {
  id: string;
  type: RequestType;
  direction: RequestDirection;
  status: RequestStatus;
  priority: 'routine' | 'urgent' | 'stat';
  title: string;
  description: string;
  patientName: string;
  patientMrn: string;
  fromProvider: string;
  fromFacility: string;
  toProvider?: string;
  toFacility?: string;
  createdAt: Date;
  expiresAt?: Date;
  responseNote?: string;
}

// Mock data for demonstration
const MOCK_INBOX_REQUESTS: InboxRequest[] = [
  {
    id: '1',
    type: 'prescription',
    direction: 'incoming',
    status: 'pending',
    priority: 'urgent',
    title: 'Prescription Renewal Request',
    description: 'Request to renew Metformin 500mg BID for diabetes management',
    patientName: 'John Moyo',
    patientMrn: 'MRN-2024-000123',
    fromProvider: 'Dr. Sarah Ncube',
    fromFacility: 'Chitungwiza Central Hospital',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '2',
    type: 'referral',
    direction: 'incoming',
    status: 'pending',
    priority: 'stat',
    title: 'Cardiology Referral',
    description: 'Urgent referral for chest pain evaluation, possible ACS',
    patientName: 'Mary Chikwanha',
    patientMrn: 'MRN-2024-000456',
    fromProvider: 'Dr. Peter Mwangi',
    fromFacility: 'Harare Central Hospital ER',
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'consult',
    direction: 'incoming',
    status: 'pending',
    priority: 'routine',
    title: 'Dermatology Consult',
    description: 'Consult for persistent rash, unresponsive to topical steroids',
    patientName: 'Tendai Zvimba',
    patientMrn: 'MRN-2024-000789',
    fromProvider: 'Dr. Grace Ndlovu',
    fromFacility: 'Mpilo Hospital',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: '4',
    type: 'order',
    direction: 'incoming',
    status: 'pending',
    priority: 'urgent',
    title: 'Lab Order Approval',
    description: 'Approval needed for CD4 count and viral load testing',
    patientName: 'Progress Mutasa',
    patientMrn: 'MRN-2024-001012',
    fromProvider: 'Nurse Chipo Gumbo',
    fromFacility: 'Parirenyatwa Infectious Diseases',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    id: '5',
    type: 'prescription',
    direction: 'outgoing',
    status: 'approved',
    priority: 'routine',
    title: 'Prescription Sent for Approval',
    description: 'Controlled substance prescription requiring senior approval',
    patientName: 'James Banda',
    patientMrn: 'MRN-2024-001234',
    fromProvider: 'You',
    fromFacility: 'Your Facility',
    toProvider: 'Dr. Head of Department',
    toFacility: 'Pharmacy Committee',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    responseNote: 'Approved. Dispense as prescribed with monitoring.',
  },
  {
    id: '6',
    type: 'referral',
    direction: 'outgoing',
    status: 'completed',
    priority: 'routine',
    title: 'Orthopedic Referral',
    description: 'Referral for hip replacement consultation',
    patientName: 'Agnes Mapfumo',
    patientMrn: 'MRN-2024-001456',
    fromProvider: 'You',
    fromFacility: 'Your Facility',
    toProvider: 'Dr. K. Chimedza',
    toFacility: 'Surgical Unit',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    responseNote: 'Patient assessed. Scheduled for surgery 15 Feb 2024.',
  },
];

const typeConfig: Record<RequestType, { icon: any; label: string; color: string }> = {
  prescription: { icon: Pill, label: 'Prescription', color: 'text-blue-500 bg-blue-500/10' },
  order: { icon: FileText, label: 'Order', color: 'text-purple-500 bg-purple-500/10' },
  referral: { icon: Send, label: 'Referral', color: 'text-orange-500 bg-orange-500/10' },
  consult: { icon: Users, label: 'Consult', color: 'text-green-500 bg-green-500/10' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  routine: { label: 'Routine', color: 'bg-muted text-muted-foreground' },
  urgent: { label: 'Urgent', color: 'bg-warning/10 text-warning' },
  stat: { label: 'STAT', color: 'bg-destructive text-destructive-foreground' },
};

const statusConfig: Record<RequestStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning', icon: Clock },
  approved: { label: 'Approved', color: 'bg-success/10 text-success', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-primary/10 text-primary', icon: CheckCircle2 },
  expired: { label: 'Expired', color: 'bg-muted text-muted-foreground', icon: Clock },
};

interface ProviderInboxProps {
  onViewRequest?: (request: InboxRequest) => void;
}

export function ProviderInbox({ onViewRequest }: ProviderInboxProps) {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<RequestType | 'all'>('all');

  const filteredRequests = MOCK_INBOX_REQUESTS.filter(request => {
    const matchesDirection = request.direction === activeTab;
    const matchesSearch = 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || request.type === selectedType;
    return matchesDirection && matchesSearch && matchesType;
  });

  const pendingCount = MOCK_INBOX_REQUESTS.filter(r => r.direction === 'incoming' && r.status === 'pending').length;

  const handleApprove = (request: InboxRequest) => {
    toast.success(`${typeConfig[request.type].label} approved`, {
      description: `${request.title} for ${request.patientName}`,
    });
  };

  const handleReject = (request: InboxRequest) => {
    toast.info(`${typeConfig[request.type].label} rejected`, {
      description: 'Please provide a reason for rejection',
    });
  };

  const handleView = (request: InboxRequest) => {
    onViewRequest?.(request);
    toast.info('Opening request details...');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Inbox className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Provider Inbox</h2>
              <p className="text-sm text-muted-foreground">
                Manage incoming requests and approvals
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-warning text-warning-foreground">
              {pendingCount} Pending
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'incoming' | 'outgoing')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="incoming" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Incoming
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Outgoing
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filter */}
        <div className="flex gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedType('all')}>
                All Types
              </DropdownMenuItem>
              {Object.entries(typeConfig).map(([key, config]) => (
                <DropdownMenuItem key={key} onClick={() => setSelectedType(key as RequestType)}>
                  <config.icon className="w-4 h-4 mr-2" />
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Request List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No requests found</p>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const TypeIcon = typeConfig[request.type].icon;
              const StatusIcon = statusConfig[request.status].icon;
              const isExpiringSoon = request.expiresAt && 
                new Date(request.expiresAt).getTime() - Date.now() < 4 * 60 * 60 * 1000;

              return (
                <Card 
                  key={request.id}
                  className={cn(
                    "transition-all hover:border-primary/50 cursor-pointer",
                    request.priority === 'stat' && "border-destructive/50",
                    request.priority === 'urgent' && "border-warning/50"
                  )}
                  onClick={() => handleView(request)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Type Icon */}
                      <div className={cn("p-2 rounded-lg shrink-0", typeConfig[request.type].color)}>
                        <TypeIcon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{request.title}</span>
                          <Badge className={priorityConfig[request.priority].color}>
                            {priorityConfig[request.priority].label}
                          </Badge>
                          <Badge variant="outline" className={statusConfig[request.status].color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[request.status].label}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {request.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Avatar className="w-4 h-4">
                              <AvatarFallback className="text-[8px]">
                                {request.patientName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {request.patientName}
                          </span>
                          <span>From: {request.fromProvider}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(request.createdAt, { addSuffix: true })}
                          </span>
                          {isExpiringSoon && (
                            <span className="text-destructive flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Expires soon
                            </span>
                          )}
                        </div>

                        {request.responseNote && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <span className="font-medium">Response: </span>
                            {request.responseNote}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {request.direction === 'incoming' && request.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleReject(request); }}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleApprove(request); }}
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      )}

                      {request.direction === 'outgoing' && (
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
