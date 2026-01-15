// Hook to manage CPD (Continuing Professional Development) tracking
// Integrates with cpd_activities table for real data

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CPDActivity {
  id: string;
  activity_type: 'course' | 'conference' | 'workshop' | 'self_study' | 'publication' | 'teaching' | 'supervision';
  title: string;
  description?: string;
  provider_name?: string;
  points_claimed: number;
  points_approved?: number;
  activity_date: string;
  completion_date?: string;
  cpd_cycle_start: string;
  cpd_cycle_end: string;
  status: 'pending' | 'approved' | 'rejected';
  certificate_url?: string;
  evidence_urls?: string[];
  rejection_reason?: string;
}

export interface CPDCycle {
  id: string;
  cycle_name: string;
  start_date: string;
  end_date: string;
  points_required: number;
  points_earned: number;
  points_pending: number;
  is_current: boolean;
}

export interface CPDCourse {
  id: string;
  title: string;
  provider: string;
  category: string;
  points: number;
  duration_hours: number;
  format: 'online' | 'in_person' | 'hybrid';
  description: string;
  accreditation?: string;
  price?: number;
  url?: string;
}

interface UseCPDTrackingReturn {
  currentCycle: CPDCycle | null;
  activities: CPDActivity[];
  availableCourses: CPDCourse[];
  loading: boolean;
  error: string | null;
  
  // Actions
  logActivity: (activity: Omit<CPDActivity, 'id' | 'status'>) => Promise<boolean>;
  fetchActivities: () => Promise<void>;
  fetchCourses: (category?: string) => Promise<void>;
  enrollInCourse: (courseId: string) => Promise<boolean>;
  
  // Stats
  progressPercentage: number;
  pointsNeeded: number;
  daysUntilDeadline: number;
}

// Mock courses for demonstration
const MOCK_COURSES: CPDCourse[] = [
  {
    id: '1',
    title: 'Advanced Cardiac Life Support (ACLS) Recertification',
    provider: 'American Heart Association',
    category: 'Emergency Medicine',
    points: 8,
    duration_hours: 16,
    format: 'hybrid',
    description: 'Comprehensive ACLS recertification covering latest guidelines.',
    accreditation: 'AHA Certified',
    price: 250,
  },
  {
    id: '2',
    title: 'Diabetes Management Update 2026',
    provider: 'Endocrine Society',
    category: 'Internal Medicine',
    points: 4,
    duration_hours: 4,
    format: 'online',
    description: 'Latest updates in diabetes diagnosis and management.',
    accreditation: 'MDPCZ Approved',
    price: 0,
  },
  {
    id: '3',
    title: 'Antimicrobial Stewardship Essentials',
    provider: 'Infectious Diseases Society',
    category: 'Infection Control',
    points: 6,
    duration_hours: 8,
    format: 'online',
    description: 'Evidence-based approaches to antimicrobial prescribing.',
    accreditation: 'MDPCZ Approved',
    price: 50,
  },
  {
    id: '4',
    title: 'Mental Health First Aid',
    provider: 'Mental Health Foundation',
    category: 'Psychiatry',
    points: 4,
    duration_hours: 8,
    format: 'in_person',
    description: 'Recognize and respond to mental health crises.',
    accreditation: 'WHO Endorsed',
    price: 100,
  },
  {
    id: '5',
    title: 'Medical Ethics and Law',
    provider: 'Medical Council',
    category: 'Ethics',
    points: 3,
    duration_hours: 3,
    format: 'online',
    description: 'Annual mandatory ethics update for all practitioners.',
    accreditation: 'MDPCZ Mandatory',
    price: 0,
  },
  {
    id: '6',
    title: 'Ultrasound-Guided Procedures',
    provider: 'Radiology Society',
    category: 'Procedures',
    points: 10,
    duration_hours: 20,
    format: 'hybrid',
    description: 'Hands-on training in ultrasound-guided interventions.',
    accreditation: 'Specialist Approved',
    price: 500,
  },
];

export function useCPDTracking(): UseCPDTrackingReturn {
  const { user } = useAuth();
  const [currentCycle, setCurrentCycle] = useState<CPDCycle | null>(null);
  const [activities, setActivities] = useState<CPDActivity[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CPDCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate current CPD cycle dates
  const getCurrentCycleDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // CPD cycles typically run April to March
    let cycleStart: Date;
    let cycleEnd: Date;
    
    if (month >= 3) { // April onwards
      cycleStart = new Date(year, 3, 1); // April 1 this year
      cycleEnd = new Date(year + 2, 2, 31); // March 31 in 2 years
    } else {
      cycleStart = new Date(year - 1, 3, 1); // April 1 last year
      cycleEnd = new Date(year + 1, 2, 31); // March 31 next year
    }
    
    return {
      start: cycleStart.toISOString().split('T')[0],
      end: cycleEnd.toISOString().split('T')[0],
    };
  };

  // Fetch CPD activities from database
  const fetchActivities = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const cycleDates = getCurrentCycleDates();
      
      const { data, error: fetchError } = await supabase
        .from('cpd_activities')
        .select('*')
        .eq('provider_id', user.id)
        .gte('cpd_cycle_start', cycleDates.start)
        .order('activity_date', { ascending: false });

      if (fetchError) {
        console.error('Error fetching CPD activities:', fetchError);
        setError('Failed to load CPD activities');
        return;
      }

      const mappedActivities: CPDActivity[] = (data || []).map(item => ({
        id: item.id,
        activity_type: item.activity_type as CPDActivity['activity_type'],
        title: item.title,
        description: item.description || undefined,
        provider_name: item.provider_name || undefined,
        points_claimed: Number(item.points_claimed),
        points_approved: item.points_approved ? Number(item.points_approved) : undefined,
        activity_date: item.activity_date,
        completion_date: item.completion_date || undefined,
        cpd_cycle_start: item.cpd_cycle_start,
        cpd_cycle_end: item.cpd_cycle_end,
        status: item.status as CPDActivity['status'],
        certificate_url: item.certificate_url || undefined,
        evidence_urls: item.evidence_urls || undefined,
        rejection_reason: item.rejection_reason || undefined,
      }));

      setActivities(mappedActivities);

      // Calculate cycle stats
      const approvedPoints = mappedActivities
        .filter(a => a.status === 'approved')
        .reduce((sum, a) => sum + (a.points_approved || 0), 0);
      
      const pendingPoints = mappedActivities
        .filter(a => a.status === 'pending')
        .reduce((sum, a) => sum + a.points_claimed, 0);

      setCurrentCycle({
        id: 'current',
        cycle_name: `${cycleDates.start.slice(0, 4)}-${cycleDates.end.slice(0, 4)} CPD Cycle`,
        start_date: cycleDates.start,
        end_date: cycleDates.end,
        points_required: 25,
        points_earned: approvedPoints,
        points_pending: pendingPoints,
        is_current: true,
      });

    } catch (err) {
      console.error('Error in fetchActivities:', err);
      setError('Failed to load CPD data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch available courses
  const fetchCourses = useCallback(async (category?: string) => {
    // In production, fetch from courses table or external API
    let courses = MOCK_COURSES;
    if (category) {
      courses = courses.filter(c => c.category.toLowerCase().includes(category.toLowerCase()));
    }
    setAvailableCourses(courses);
  }, []);

  // Log a new CPD activity
  const logActivity = useCallback(async (
    activity: Omit<CPDActivity, 'id' | 'status'>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: insertError } = await supabase
        .from('cpd_activities')
        .insert({
          provider_id: user.id,
          activity_type: activity.activity_type,
          title: activity.title,
          description: activity.description,
          provider_name: activity.provider_name,
          points_claimed: activity.points_claimed,
          activity_date: activity.activity_date,
          completion_date: activity.completion_date,
          cpd_cycle_start: activity.cpd_cycle_start,
          cpd_cycle_end: activity.cpd_cycle_end,
          status: 'pending',
          certificate_url: activity.certificate_url,
          evidence_urls: activity.evidence_urls,
        });

      if (insertError) {
        console.error('Error logging CPD activity:', insertError);
        setError('Failed to log activity');
        return false;
      }

      // Refresh activities
      await fetchActivities();
      return true;
    } catch (err) {
      console.error('Error in logActivity:', err);
      return false;
    }
  }, [user, fetchActivities]);

  // Enroll in a course
  const enrollInCourse = useCallback(async (courseId: string): Promise<boolean> => {
    const course = availableCourses.find(c => c.id === courseId);
    if (!course) return false;

    const cycleDates = getCurrentCycleDates();

    // Log as a pending activity
    return logActivity({
      activity_type: 'course',
      title: course.title,
      description: `Enrolled in course. Format: ${course.format}`,
      provider_name: course.provider,
      points_claimed: course.points,
      activity_date: new Date().toISOString().split('T')[0],
      cpd_cycle_start: cycleDates.start,
      cpd_cycle_end: cycleDates.end,
    });
  }, [availableCourses, logActivity]);

  // Initial fetch
  useEffect(() => {
    fetchActivities();
    fetchCourses();
  }, [fetchActivities, fetchCourses]);

  // Calculate derived values
  const progressPercentage = currentCycle 
    ? Math.min(100, (currentCycle.points_earned / currentCycle.points_required) * 100)
    : 0;

  const pointsNeeded = currentCycle 
    ? Math.max(0, currentCycle.points_required - currentCycle.points_earned)
    : 0;

  const daysUntilDeadline = currentCycle
    ? Math.max(0, Math.ceil((new Date(currentCycle.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    currentCycle,
    activities,
    availableCourses,
    loading,
    error,
    logActivity,
    fetchActivities,
    fetchCourses,
    enrollInCourse,
    progressPercentage,
    pointsNeeded,
    daysUntilDeadline,
  };
}
