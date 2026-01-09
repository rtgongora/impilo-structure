/**
 * Facility Change Requests Component
 * Workflow for facility updates, deactivations, merges, splits
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus, 
  Search,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  GitMerge,
  Scissors,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CHANGE_REQUEST_STATUS_LABELS } from '@/types/facility';

export const FacilityChangeRequests = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const mockRequests = [
    { 
      id: '1', 
      title: 'Update contact information', 
      facility: 'Harare Central Hospital',
      type: 'update',
      status: 'under_review',
      priority: 'normal',
      submittedBy: 'John Doe',
      submittedAt: '2024-01-18',
      comments: 2,
    },
    { 
      id: '2', 
      title: 'Add new clinic - Waterfalls', 
      facility: null,
      type: 'create',
      status: 'submitted',
      priority: 'high',
      submittedBy: 'Jane Smith',
      submittedAt: '2024-01-17',
      comments: 0,
    },
    { 
      id: '3', 
      title: 'Merge duplicate facilities', 
      facility: 'Multiple',
      type: 'merge',
      status: 'clarification_needed',
      priority: 'normal',
      submittedBy: 'Admin User',
      submittedAt: '2024-01-15',
      comments: 5,
    },
    { 
      id: '4', 
      title: 'Deactivate closed clinic', 
      facility: 'Old Town Clinic',
      type: 'deactivate',
      status: 'approved',
      priority: 'low',
      submittedBy: 'District Officer',
      submittedAt: '2024-01-10',
      comments: 1,
    },
  ];

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      under_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      clarification_needed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      rejected: 'bg-destructive/10 text-destructive',
      published: 'bg-primary/10 text-primary',
    };
    return <Badge className={colors[status] || 'bg-muted'}>{CHANGE_REQUEST_STATUS_LABELS[status as keyof typeof CHANGE_REQUEST_STATUS_LABELS] || status}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      create: <Plus className="h-4 w-4 text-emerald-600" />,
      update: <Edit className="h-4 w-4 text-blue-600" />,
      deactivate: <Trash2 className="h-4 w-4 text-destructive" />,
      merge: <GitMerge className="h-4 w-4 text-purple-600" />,
      split: <Scissors className="h-4 w-4 text-amber-600" />,
    };
    return icons[type] || <FileText className="h-4 w-4" />;
  };

  const filteredRequests = mockRequests.filter(req => {
    if (activeTab !== 'all' && req.status !== activeTab) return false;
    if (searchQuery && !req.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setActiveTab('all')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{mockRequests.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setActiveTab('submitted')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{mockRequests.filter(r => r.status === 'submitted').length}</p>
                <p className="text-xs text-muted-foreground">Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setActiveTab('under_review')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{mockRequests.filter(r => r.status === 'under_review').length}</p>
                <p className="text-xs text-muted-foreground">Under Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setActiveTab('clarification_needed')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{mockRequests.filter(r => r.status === 'clarification_needed').length}</p>
                <p className="text-xs text-muted-foreground">Needs Info</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setActiveTab('approved')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{mockRequests.filter(r => r.status === 'approved').length}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Change Requests</CardTitle>
            <CardDescription>Manage facility create, update, merge, and deactivation requests</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[250px]"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map(request => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="p-2 bg-muted rounded-lg w-fit">
                      {getTypeIcon(request.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{request.title}</p>
                    <p className="text-xs text-muted-foreground">by {request.submittedBy}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.facility || <span className="italic">New facility</span>}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <Badge variant={request.priority === 'high' ? 'destructive' : 'outline'}>
                      {request.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{request.submittedAt}</TableCell>
                  <TableCell>
                    {request.comments > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        {request.comments}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
