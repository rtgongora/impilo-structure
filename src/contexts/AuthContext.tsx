import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  role: 'doctor' | 'nurse' | 'specialist' | 'patient' | 'admin';
  specialty: string | null;
  department: string | null;
  phone: string | null;
  license_number: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: {
    display_name?: string;
    role?: string;
    specialty?: string;
    department?: string;
  }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  };

  const updateLastActive = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('user_id', userId);
  };

  const updateSessionActivity = async (sessionToken: string) => {
    await supabase
      .from('user_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('session_token', sessionToken)
      .eq('is_active', true);
  };

  const createSession = async (userId: string, accessToken: string) => {
    const deviceInfo = getDeviceInfo();
    const { data: sessionData, error } = await supabase.from('user_sessions').insert({
      user_id: userId,
      session_token: accessToken.substring(0, 50),
      user_agent: navigator.userAgent,
      device_info: deviceInfo,
      is_active: true,
    }).select('id').single();
    
    // Call edge function to geolocate and update session
    if (sessionData?.id) {
      supabase.functions.invoke('geolocate-ip', {
        body: { sessionId: sessionData.id }
      }).catch(err => console.log('Geolocation update:', err));
    }
  };

  const endSession = async (accessToken: string) => {
    await supabase
      .from('user_sessions')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('session_token', accessToken.substring(0, 50));
  };

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'Mobile';
    if (/tablet/i.test(ua)) return 'Tablet';
    return 'Desktop';
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
            
            // Track session on sign in
            if (event === 'SIGNED_IN' && session.access_token) {
              createSession(session.user.id, session.access_token);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        // End session on sign out
        if (event === 'SIGNED_OUT' && session?.access_token) {
          endSession(session.access_token);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
        // Update last active on session load
        updateLastActive(session.user.id);
        // Update session activity
        if (session.access_token) {
          updateSessionActivity(session.access_token.substring(0, 50));
        }
      }
      
      setLoading(false);
    });

    // Set up activity tracking - update session every 5 minutes
    const activityInterval = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          updateSessionActivity(session.access_token.substring(0, 50));
        }
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(activityInterval);
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata?: {
      display_name?: string;
      role?: string;
      specialty?: string;
      department?: string;
    }
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
