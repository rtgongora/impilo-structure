import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VitoEventsViewer() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Record<string, unknown> | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['vito-events', filter],
    queryFn: async () => {
      let q = supabase.from('vito_event_envelopes').select('*').order('occurred_at', { ascending: false }).limit(100);
      if (filter) q = q.or(`correlation_id.eq.${filter},request_id.eq.${filter},event_type.ilike.%${filter}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">VITO Events</h1>
          <p className="text-sm text-muted-foreground">v1.1 event envelope viewer</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Event Envelopes</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Search className="h-4 w-4 mt-3 text-muted-foreground" />
            <Input placeholder="Filter by correlation_id, request_id, or event_type..." value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Producer</TableHead>
                <TableHead>Schema V</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Occurred</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
              ) : events?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No events</TableCell></TableRow>
              ) : events?.map((e: Record<string, unknown>) => (
                <TableRow key={e.id as string}>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{e.event_type as string}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{e.subject_id as string}</TableCell>
                  <TableCell className="text-xs">{e.producer as string}</TableCell>
                  <TableCell className="text-xs text-center">{e.schema_version as number}</TableCell>
                  <TableCell className="text-xs">{e.actor_id as string}</TableCell>
                  <TableCell className="text-xs">{new Date(e.occurred_at as string).toLocaleString()}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(e)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                        <DialogHeader><DialogTitle>Event Detail</DialogTitle></DialogHeader>
                        <pre className="text-xs bg-muted p-4 rounded overflow-auto">{JSON.stringify(selectedEvent || e, null, 2)}</pre>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
