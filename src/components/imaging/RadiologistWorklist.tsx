import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePACSWorklist } from "@/hooks/pacs/usePACSWorklist";
import { 
  Search, Clock, AlertTriangle, User, Play, 
  RefreshCw, Filter, UserPlus, ChevronRight,
  Activity, Timer, CheckCircle2, Eye
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export function RadiologistWorklist() {
  const {
    worklists,
    studies,
    loading,
    tatStats,
    fetchWorklists,
    fetchWorklistStudies,
    assignStudy,
    startReading,
  } = usePACSWorklist();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);

  useEffect(() => {
    fetchWorklists();
    fetchWorklistStudies();
  }, []);

  const filteredStudies = studies.filter(study => {
    const matchesSearch = 
      study.accession_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.study_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.patient_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = modalityFilter === "all" || study.modality === modalityFilter;
    const matchesPriority = priorityFilter === "all" || study.priority === priorityFilter;
    const matchesStatus = statusFilter === "all" || study.workflow_status === statusFilter;
    return matchesSearch && matchesModality && matchesPriority && matchesStatus;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'stat':
        return <Badge variant="destructive" className="animate-pulse">STAT</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Urgent</Badge>;
      default:
        return <Badge variant="secondary">Routine</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <Badge variant="outline">Received</Badge>;
      case 'ready_for_read':
        return <Badge className="bg-blue-500">Ready</Badge>;
      case 'prelim_reported':
        return <Badge className="bg-yellow-500">Preliminary</Badge>;
      case 'final_reported':
        return <Badge className="bg-green-500">Final</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleOpenStudy = (studyId: string, assignmentId?: string) => {
    if (assignmentId) {
      startReading(assignmentId, studyId);
    }
    // Navigate to viewer - in real app this would route to PACSViewer
    window.open(`/pacs?study=${studyId}`, '_blank');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Stats Header */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tatStats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Activity className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tatStats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tatStats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tatStats.statPending}</p>
                <p className="text-xs text-muted-foreground">STAT Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Timer className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tatStats.avgTatMinutes || '--'}</p>
                <p className="text-xs text-muted-foreground">Avg TAT (min)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by accession, description, patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={modalityFilter} onValueChange={setModalityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Modality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modalities</SelectItem>
                <SelectItem value="CT">CT</SelectItem>
                <SelectItem value="MRI">MRI</SelectItem>
                <SelectItem value="XR">X-Ray</SelectItem>
                <SelectItem value="US">Ultrasound</SelectItem>
                <SelectItem value="MG">Mammography</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="stat">STAT</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="ready_for_read">Ready for Read</SelectItem>
                <SelectItem value="prelim_reported">Preliminary</SelectItem>
                <SelectItem value="final_reported">Final</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => fetchWorklistStudies()}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Worklist Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Studies ({studies.length})</TabsTrigger>
          <TabsTrigger value="unread" className="text-blue-600">
            Unread ({studies.filter(s => s.workflow_status === 'ready_for_read').length})
          </TabsTrigger>
          <TabsTrigger value="stat" className="text-red-600">
            STAT ({tatStats.statPending})
          </TabsTrigger>
          {worklists.map(wl => (
            <TabsTrigger key={wl.id} value={wl.id}>{wl.name}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Priority</TableHead>
                    <TableHead>Accession</TableHead>
                    <TableHead>Modality</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Study Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudies.map((study) => (
                    <TableRow 
                      key={study.id} 
                      className={`cursor-pointer hover:bg-muted/50 ${
                        study.priority === 'stat' ? 'bg-red-50' : ''
                      }`}
                      onDoubleClick={() => handleOpenStudy(study.id, study.assignment?.id)}
                    >
                      <TableCell>{getPriorityBadge(study.priority)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {study.accession_number || '--'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{study.modality}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {study.study_description || 'No description'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {study.patient_name || study.patient_id?.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(study.study_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{getStatusBadge(study.workflow_status)}</TableCell>
                      <TableCell>
                        {study.assignment?.assigned_to ? (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="text-xs">Assigned</span>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 text-xs"
                            onClick={() => {
                              setSelectedStudyId(study.id);
                              setAssignDialogOpen(true);
                            }}
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Assign
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(study.study_date), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          onClick={() => handleOpenStudy(study.id, study.assignment?.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredStudies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No studies found matching filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground">Showing studies ready for reading</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stat" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground">Showing STAT priority studies</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Study to Radiologist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign to</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select radiologist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Assign to myself</SelectItem>
                  <SelectItem value="pool">Assign to pool</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stat">STAT</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="routine">Routine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (selectedStudyId) {
                assignStudy(selectedStudyId, 'current-user');
                setAssignDialogOpen(false);
              }
            }}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
