import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface KBArticle {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  content: string;
  content_html: string | null;
  excerpt: string | null;
  module_tags: string[];
  article_type: string;
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
}

export interface KBCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sequence_order: number;
}

export interface HelpdeskTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  module_context: string | null;
  screen_context: string | null;
  category: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'submitted' | 'triaged' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  satisfaction_rating: number | null;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string | null;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export function useHelpdesk() {
  const { user, profile } = useAuth();
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('kb_categories')
        .select('*')
        .eq('is_published', true)
        .order('sequence_order');

      if (fetchError) throw fetchError;
      setCategories((data || []) as KBCategory[]);
    } catch (err) {
      console.error('Error fetching KB categories:', err);
    }
  }, []);

  const fetchArticles = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('view_count', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setArticles((data || []) as KBArticle[]);
    } catch (err) {
      console.error('Error fetching KB articles:', err);
      setError('Failed to load knowledge base');
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    if (!user?.id) {
      setTickets([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('helpdesk_tickets')
        .select('*')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;
      setTickets((data || []) as HelpdeskTicket[]);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  }, [user?.id]);

  const searchArticles = useCallback(async (query: string, tags?: string[]) => {
    try {
      let q = supabase
        .from('kb_articles')
        .select('*')
        .eq('is_published', true);

      if (tags && tags.length > 0) {
        q = q.overlaps('module_tags', tags);
      }

      const { data, error: searchError } = await q
        .order('view_count', { ascending: false })
        .limit(20);

      if (searchError) throw searchError;

      // Client-side text search
      const searchLower = query.toLowerCase();
      return ((data || []) as KBArticle[]).filter(a =>
        a.title.toLowerCase().includes(searchLower) ||
        a.content.toLowerCase().includes(searchLower) ||
        a.excerpt?.toLowerCase().includes(searchLower)
      );
    } catch (err) {
      console.error('Error searching articles:', err);
      return [];
    }
  }, []);

  const getContextualHelp = useCallback(async (screenPath: string) => {
    try {
      const { data: mappings } = await supabase
        .from('contextual_help_mappings')
        .select(`
          *,
          kb_article:kb_articles(*),
          course:course_catalog(*)
        `)
        .eq('screen_path', screenPath)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      return mappings || [];
    } catch (err) {
      console.error('Error fetching contextual help:', err);
      return [];
    }
  }, []);

  const trackArticleView = useCallback(async (articleId: string) => {
    // Simple increment - in production use a stored procedure
    const article = articles.find(a => a.id === articleId);
    if (article) {
      await supabase
        .from('kb_articles')
        .update({ view_count: article.view_count + 1 })
        .eq('id', articleId);
    }
  }, [articles]);

  const submitFeedback = useCallback(async (articleId: string, isHelpful: boolean, feedbackText?: string) => {
    if (!user?.id) return;

    await supabase.from('kb_article_feedback').insert({
      article_id: articleId,
      user_id: user.id,
      is_helpful: isHelpful,
      feedback_text: feedbackText,
    });
  }, [user?.id]);

  const createTicket = useCallback(async (ticket: {
    subject: string;
    description: string;
    category?: string;
    severity?: 'critical' | 'high' | 'medium' | 'low';
    module_context?: string;
    screen_context?: string;
    url_context?: string;
    diagnostic_bundle?: Record<string, unknown>;
  }) => {
    if (!user?.id) return { error: 'Not authenticated' };

    try {
      const profileData = profile as { first_name?: string; last_name?: string } | null;
      const reporterName = profileData?.first_name 
        ? `${profileData.first_name} ${profileData.last_name || ''}`.trim()
        : undefined;

      // Using any cast temporarily until types are regenerated after migration
      const { data, error: insertError } = await (supabase
        .from('helpdesk_tickets') as any)
        .insert({
          reporter_id: user.id,
          reporter_email: user.email || null,
          reporter_name: reporterName || null,
          subject: ticket.subject,
          description: ticket.description,
          category: ticket.category || null,
          severity: (ticket.severity || 'medium'),
          module_context: ticket.module_context || null,
          screen_context: ticket.screen_context || null,
          url_context: ticket.url_context || null,
          diagnostic_bundle: ticket.diagnostic_bundle || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchTickets();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      return { error: err.message || 'Failed to create ticket' };
    }
  }, [user?.id, user?.email, profile, fetchTickets]);

  const addTicketComment = useCallback(async (ticketId: string, content: string) => {
    if (!user?.id) return { error: 'Not authenticated' };

    const authorName = (profile as { first_name?: string; last_name?: string })?.first_name 
      ? `${(profile as { first_name?: string; last_name?: string }).first_name} ${(profile as { first_name?: string; last_name?: string }).last_name || ''}`.trim()
      : undefined;

    try {
      const { data, error: insertError } = await supabase
        .from('helpdesk_ticket_comments')
        .insert({
          ticket_id: ticketId,
          author_id: user.id,
          author_name: authorName,
          content,
          is_internal: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding comment:', err);
      return { error: err.message || 'Failed to add comment' };
    }
  }, [user?.id, profile]);

  const getTicketComments = useCallback(async (ticketId: string) => {
    const { data } = await supabase
      .from('helpdesk_ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('is_internal', false)
      .order('created_at');

    return (data || []) as TicketComment[];
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCategories(), fetchArticles(), fetchTickets()])
      .finally(() => setLoading(false));
  }, [fetchCategories, fetchArticles, fetchTickets]);

  return {
    categories,
    articles,
    tickets,
    loading,
    error,
    searchArticles,
    getContextualHelp,
    trackArticleView,
    submitFeedback,
    createTicket,
    addTicketComment,
    getTicketComments,
    refresh: () => Promise.all([fetchCategories(), fetchArticles(), fetchTickets()]),
  };
}
