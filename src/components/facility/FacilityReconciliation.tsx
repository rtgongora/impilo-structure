/**
 * Facility Reconciliation Component
 * Multi-source ingestion and de-duplication workflow
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  GitMerge, 
  Upload, 
  Database, 
  Link2,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Server,
  Globe,
  Clock,
  Eye,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const FacilityReconciliation = () => {
  const [activeTab, setActiveTab] = useState('sources');

  // Mock data for demonstration
  const mockSources = [
    { id: '1', name: 'DHIS2 Org Units', type: 'dhis2', lastSync: '2024-01-15', records: 1245, status: 'active' },
    { id: '2', name: 'Legacy HMIS', type: 'csv', lastSync: '2024-01-10', records: 892, status: 'active' },
    { id: '3', name: 'Partner List (PEPFAR)', type: 'csv', lastSync: '2024-01-08', records: 456, status: 'inactive' },
  ];

  const mockJobs = [
    { id: '1', source: 'DHIS2 Org Units', type: 'reconcile', status: 'completed', matched: 1180, new: 45, errors: 20, date: '2024-01-15' },
    { id: '2', source: 'Legacy HMIS', type: 'import', status: 'completed', matched: 850, new: 42, errors: 0, date: '2024-01-10' },
    { id: '3', source: 'DHIS2 Org Units', type: 'reconcile', status: 'running', matched: 500, new: 0, errors: 0, date: '2024-01-20' },
  ];

  const mockMatches = [
    { id: '1', sourceName: 'Harare Central Hosp', candidateName: 'Harare Central Hospital', score: 0.95, status: 'pending' },
    { id: '2', sourceName: 'Chitungwiza Gen Hosp', candidateName: 'Chitungwiza General Hospital', score: 0.92, status: 'pending' },
    { id: '3', sourceName: 'Parirenyatwa Hospital', candidateName: null, score: 0, status: 'pending' },
    { id: '4', sourceName: 'Mpilo Central', candidateName: 'Mpilo Central Hospital', score: 0.88, status: 'confirmed' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockSources.length}</p>
                <p className="text-xs text-muted-foreground">Data Sources</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockMatches.filter(m => m.status === 'pending').length}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">2,593</p>
                <p className="text-xs text-muted-foreground">Records Matched</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <GitMerge className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockJobs.length}</p>
                <p className="text-xs text-muted-foreground">Reconciliation Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sources" className="gap-2">
            <Database className="h-4 w-4" />
            Data Sources
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <Play className="h-4 w-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-2">
            <Eye className="h-4 w-4" />
            Review Matches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Data Sources</CardTitle>
                <CardDescription>Configure and manage facility data sources for reconciliation</CardDescription>
              </div>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSources.map(source => (
                  <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        {source.type === 'dhis2' && <Server className="h-5 w-5" />}
                        {source.type === 'csv' && <FileSpreadsheet className="h-5 w-5" />}
                        {source.type === 'fhir' && <Globe className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{source.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {source.records.toLocaleString()} records • Last synced {source.lastSync}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={source.status === 'active' ? 'default' : 'secondary'}>
                        {source.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Sync
                      </Button>
                      <Button variant="ghost" size="sm">Configure</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Reconciliation Jobs</CardTitle>
                <CardDescription>Track import and reconciliation job history</CardDescription>
              </div>
              <Button>
                <GitMerge className="h-4 w-4 mr-2" />
                New Job
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Matched</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Errors</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockJobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.source}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {job.status === 'completed' && (
                          <Badge className="bg-emerald-100 text-emerald-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        {job.status === 'running' && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Clock className="h-3 w-3 mr-1 animate-pulse" />
                            Running
                          </Badge>
                        )}
                        {job.status === 'failed' && (
                          <Badge className="bg-destructive/10 text-destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{job.matched.toLocaleString()}</TableCell>
                      <TableCell>{job.new}</TableCell>
                      <TableCell className={job.errors > 0 ? 'text-destructive' : ''}>
                        {job.errors}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{job.date}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review Candidate Matches</CardTitle>
              <CardDescription>
                Review and confirm facility matches from reconciliation. High-confidence matches are shown first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMatches.map(match => (
                  <div key={match.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Source Record</p>
                          <p className="font-medium">{match.sourceName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Candidate Match</p>
                          {match.candidateName ? (
                            <p className="font-medium text-primary">{match.candidateName}</p>
                          ) : (
                            <p className="text-muted-foreground italic">No match found - potential new facility</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {match.score > 0 && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Score</p>
                            <p className="text-lg font-bold">{Math.round(match.score * 100)}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {match.score > 0 && (
                      <Progress value={match.score * 100} className="h-1 mt-3" />
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                      {match.candidateName ? (
                        <>
                          <Button variant="outline" size="sm">
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject Match
                          </Button>
                          <Button size="sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm Match
                          </Button>
                        </>
                      ) : (
                        <Button size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Create New Facility
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
