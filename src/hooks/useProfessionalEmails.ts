import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfessionalEmail {
  id: string;
  user_id: string;
  folder: string;
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  cc_addresses: string[] | null;
  bcc_addresses: string[] | null;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_important: boolean;
  has_attachments: boolean;
  attachments: unknown[];
  thread_id: string | null;
  in_reply_to: string | null;
  labels: string[];
  external_message_id: string | null;
  received_at: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash';

export function useProfessionalEmails(folder: EmailFolder = 'inbox') {
  const { user } = useAuth();
  const [emails, setEmails] = useState<ProfessionalEmail[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    if (!user?.id) {
      setEmails([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('professional_emails')
        .select('*')
        .eq('user_id', user.id)
        .eq('folder', folder)
        .order('received_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      const emailList = (data || []) as ProfessionalEmail[];
      setEmails(emailList);
      
      // Get unread count for inbox
      if (folder === 'inbox') {
        const { count } = await supabase
          .from('professional_emails')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('folder', 'inbox')
          .eq('is_read', false);
        setUnreadCount(count || 0);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Failed to load emails');
    } finally {
      setLoading(false);
    }
  }, [user?.id, folder]);

  const markAsRead = useCallback(async (emailId: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('professional_emails')
        .update({ is_read: true })
        .eq('id', emailId)
        .eq('user_id', user.id);

      setEmails(prev => 
        prev.map(e => e.id === emailId ? { ...e, is_read: true } : e)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking email as read:', err);
    }
  }, [user?.id]);

  const toggleStar = useCallback(async (emailId: string) => {
    if (!user?.id) return;

    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    try {
      await supabase
        .from('professional_emails')
        .update({ is_starred: !email.is_starred })
        .eq('id', emailId)
        .eq('user_id', user.id);

      setEmails(prev => 
        prev.map(e => e.id === emailId ? { ...e, is_starred: !e.is_starred } : e)
      );
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  }, [user?.id, emails]);

  const moveToFolder = useCallback(async (emailId: string, newFolder: EmailFolder) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('professional_emails')
        .update({ folder: newFolder })
        .eq('id', emailId)
        .eq('user_id', user.id);

      setEmails(prev => prev.filter(e => e.id !== emailId));
    } catch (err) {
      console.error('Error moving email:', err);
    }
  }, [user?.id]);

  const deleteEmail = useCallback(async (emailId: string) => {
    await moveToFolder(emailId, 'trash');
  }, [moveToFolder]);

  // Initial fetch
  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  return {
    emails,
    unreadCount,
    loading,
    error,
    markAsRead,
    toggleStar,
    moveToFolder,
    deleteEmail,
    refresh: fetchEmails,
  };
}
