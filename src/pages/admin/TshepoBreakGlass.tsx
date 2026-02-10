/**
 * TSHEPO — Break-Glass Request + Review Queue
 * Emergency access with step-up, elevated tokens, and supervisor review
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Shield, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function TshepoBreakGlass() {
  const queryClient = useQueryClient();
  const [requestOpen, setRequestOpen] = useState(false);
  const [bgForm, setBgForm] = useState({ patient_cpid: '', justification: '', emergency_type: 'clinical_emergency' });
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Pending review queue
  const { data: pendingReviews, isLoading: loadingPending } = useQuery({
    queryKey: ['tshepo-breakglass-pending'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trust_layer_break_glass' as any)
        .select('*').eq('review_queue_status', 'pending_review')
        .order('access_started_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // All break-glass events
  const { data: allEvents, isLoading: loadingAll } = useQuery({
    queryKey: ['tshepo-breakglass-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trust_layer_break_glass' as any)
        .select('*').order('access_started_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, outcome }: { id: string; outcome: string }) => {
      const { error } = await supabase.from('trust_layer_break_glass' as any)
        .update({ review_queue_status: 'reviewed', review_outcome: outcome, reviewed_at: new Date().toISOString(), review_notes: reviewNotes[id] || '' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Review submitted'); queryClient.invalidateQueries({ queryKey: ['tshepo-breakglass-pending'] }); queryClient.invalidateQueries({ queryKey: ['tshepo-breakglass-all'] }); },
  });

  const statusBadge = (status: string, outcome?: string) => {
    if (status === 'pending_review') return <Badge className="bg-amber-600"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
    if (outcome === 'approved') return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    if (outcome === 'flagged') return <Badge className="bg-orange-600"><AlertTriangle className="h-3 w-3 mr-1" />Flagged</Badge>;
    if (outcome === 'violation') return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Violation</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold">Break-Glass Access</h1>
          {(pendingReviews || []).length > 0 && (
            <Badge variant="destructive">{pendingReviews?.length} Pending Review</Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="review">
        <TabsList>
          <TabsTrigger value="review">Review Queue ({(pendingReviews || []).length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="review">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Pending Break-Glass Reviews</CardTitle></CardHeader>
            <CardContent>
              {loadingPending ? <p className="text-muted-foreground text-center py-8">Loading...</p> :
                (pendingReviews || []).length === 0 ? <p className="text-muted-foreground text-center py-8">No pending reviews</p> :
                <div className="space-y-4">
                  {(pendingReviews || []).map((bg: any) => (
                    <Card key={bg.id} className="border-amber-500/30">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              <span className="font-semibold">Emergency Access — {bg.emergency_type}</span>
                              {statusBadge(bg.review_queue_status)}
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                              <div><span className="text-muted-foreground">Patient CPID:</span> <span className="font-mono">{bg.subject_cpid}</span></div>
                              <div><span className="text-muted-foreground">Actor:</span> <span className="font-mono">{bg.user_id?.substring(0, 12)}...</span></div>
                              <div><span className="text-muted-foreground">Time:</span> {new Date(bg.access_started_at).toLocaleString()}</div>
                              <div><span className="text-muted-foreground">Expires:</span> {new Date(bg.access_expires_at).toLocaleString()}</div>
                              <div className="col-span-2"><span className="text-muted-foreground">Justification:</span> {bg.justification}</div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <Textarea placeholder="Review notes..." value={reviewNotes[bg.id] || ''} onChange={e => setReviewNotes(p => ({ ...p, [bg.id]: e.target.value }))} className="h-16" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => reviewMutation.mutate({ id: bg.id, outcome: 'approved' })} className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate({ id: bg.id, outcome: 'flagged' })} className="border-orange-500 text-orange-500">
                              <AlertTriangle className="h-3 w-3 mr-1" />Flag for Review
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => reviewMutation.mutate({ id: bg.id, outcome: 'violation' })}>
                              <XCircle className="h-3 w-3 mr-1" />Violation
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Patient CPID</TableHead>
                    <TableHead>Emergency Type</TableHead>
                    <TableHead>Justification</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAll ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : (allEvents || []).map((bg: any) => (
                    <TableRow key={bg.id}>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(bg.access_started_at).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">{bg.user_id?.substring(0, 12)}...</TableCell>
                      <TableCell className="font-mono text-xs">{bg.subject_cpid}</TableCell>
                      <TableCell>{bg.emergency_type}</TableCell>
                      <TableCell className="max-w-40 truncate">{bg.justification}</TableCell>
                      <TableCell>{statusBadge(bg.review_queue_status, bg.review_outcome)}</TableCell>
                      <TableCell>{bg.review_outcome || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
