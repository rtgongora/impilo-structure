import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  id: string;
  user_id: string;
  display_name: string;
  online_at: string;
}

export const usePresence = (userId: string | undefined, displayName: string | undefined) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceState>>(new Map());

  useEffect(() => {
    if (!userId || !displayName) return;

    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = new Map<string, PresenceState>();
        
        Object.entries(state).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            const presence = presences[0] as unknown as PresenceState;
            users.set(key, presence);
          }
        });
        
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          if (newPresences && newPresences.length > 0) {
            updated.set(key, newPresences[0] as unknown as PresenceState);
          }
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('User left:', key);
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          updated.delete(key);
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            id: crypto.randomUUID(),
            user_id: userId,
            display_name: displayName,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [userId, displayName]);

  const isUserOnline = useCallback((targetUserId: string) => {
    return onlineUsers.has(targetUserId);
  }, [onlineUsers]);

  const getOnlineCount = useCallback(() => {
    return onlineUsers.size;
  }, [onlineUsers]);

  return {
    onlineUsers,
    isUserOnline,
    getOnlineCount,
    channel,
  };
};
