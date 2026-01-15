import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Course {
  id: string;
  moodle_course_id: number | null;
  course_code: string | null;
  title: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  target_roles: string[];
  target_cadres: string[];
  module_tags: string[];
  program_areas: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  format: 'microlearning' | 'full_course' | 'simulation' | 'job_aid' | 'video' | 'webinar' | 'classroom';
  duration_minutes: number | null;
  language: string;
  is_cpd_eligible: boolean;
  cpd_credits: number;
  cpd_accreditor: string | null;
  is_mandatory: boolean;
  is_featured: boolean;
  launch_url: string | null;
}

export interface TrainingPathway {
  id: string;
  pathway_code: string | null;
  name: string;
  description: string | null;
  target_role: string | null;
  target_cadre: string | null;
  is_onboarding: boolean;
  estimated_duration_hours: number | null;
  courses?: Course[];
}

export interface Enrollment {
  id: string;
  course_id: string;
  pathway_id: string | null;
  status: 'not_enrolled' | 'enrolled' | 'in_progress' | 'completed' | 'expired' | 'recert_due';
  progress_percent: number;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  best_quiz_score: number | null;
  passed: boolean | null;
  course?: Course;
}

export interface TrainingFilters {
  search?: string;
  difficulty?: string;
  format?: string;
  module?: string;
  program?: string;
  cadre?: string;
  mandatory?: boolean;
  cpd_eligible?: boolean;
}

export function useTrainingCatalog(filters?: TrainingFilters) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [pathways, setPathways] = useState<TrainingPathway[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      let query = supabase
        .from('course_catalog')
        .select('*')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('title');

      if (filters?.mandatory) {
        query = query.eq('is_mandatory', true);
      }
      if (filters?.cpd_eligible) {
        query = query.eq('is_cpd_eligible', true);
      }
      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty as 'beginner' | 'intermediate' | 'advanced' | 'expert');
      }
      if (filters?.format) {
        query = query.eq('format', filters.format as 'microlearning' | 'full_course' | 'simulation' | 'job_aid' | 'video' | 'webinar' | 'classroom');
      }
      if (filters?.module) {
        query = query.contains('module_tags', [filters.module]);
      }
      if (filters?.program) {
        query = query.contains('program_areas', [filters.program]);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      let filteredCourses = (data || []) as Course[];

      // Client-side search filter
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredCourses = filteredCourses.filter(c =>
          c.title.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower) ||
          c.course_code?.toLowerCase().includes(searchLower)
        );
      }

      setCourses(filteredCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    }
  }, [filters]);

  const fetchPathways = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('training_pathways')
        .select('*')
        .eq('is_published', true)
        .order('sequence_order');

      if (fetchError) throw fetchError;
      setPathways((data || []) as TrainingPathway[]);
    } catch (err) {
      console.error('Error fetching pathways:', err);
    }
  }, []);

  const fetchEnrollments = useCallback(async () => {
    if (!user?.id) {
      setEnrollments([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('training_enrollments')
        .select(`
          *,
          course:course_catalog(*)
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (fetchError) throw fetchError;
      setEnrollments((data || []) as Enrollment[]);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    }
  }, [user?.id]);

  const enrollInCourse = useCallback(async (courseId: string, pathwayId?: string) => {
    if (!user?.id) return { error: 'Not authenticated' };

    try {
      const { data, error: insertError } = await supabase
        .from('training_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          pathway_id: pathwayId,
          status: 'enrolled',
          progress_percent: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Log event
      await supabase.from('training_events').insert({
        user_id: user.id,
        course_id: courseId,
        enrollment_id: data.id,
        event_type: 'enrolled',
        event_data: { pathway_id: pathwayId },
      });

      await fetchEnrollments();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error enrolling:', err);
      return { error: err.message || 'Failed to enroll' };
    }
  }, [user?.id, fetchEnrollments]);

  const updateProgress = useCallback(async (enrollmentId: string, progress: number) => {
    if (!user?.id) return;

    try {
      const updates: any = { 
        progress_percent: progress,
        status: progress > 0 ? 'in_progress' : 'enrolled',
      };

      if (progress === 100) {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      }

      if (progress > 0 && !enrollments.find(e => e.id === enrollmentId)?.started_at) {
        updates.started_at = new Date().toISOString();
      }

      await supabase
        .from('training_enrollments')
        .update(updates)
        .eq('id', enrollmentId)
        .eq('user_id', user.id);

      // Log progress event
      await supabase.from('training_events').insert({
        user_id: user.id,
        enrollment_id: enrollmentId,
        event_type: progress === 100 ? 'completed' : 'progress',
        event_data: { progress_percent: progress },
      });

      await fetchEnrollments();
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  }, [user?.id, enrollments, fetchEnrollments]);

  const launchCourse = useCallback(async (courseId: string, enrollmentId?: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    // Track launch event
    if (user?.id) {
      await supabase.from('training_events').insert({
        user_id: user.id,
        course_id: courseId,
        enrollment_id: enrollmentId,
        event_type: 'started',
      });

      // Update started_at if not set
      if (enrollmentId) {
        const enrollment = enrollments.find(e => e.id === enrollmentId);
        if (enrollment && !enrollment.started_at) {
          await supabase
            .from('training_enrollments')
            .update({ 
              started_at: new Date().toISOString(),
              status: 'in_progress'
            })
            .eq('id', enrollmentId);
        }
      }
    }

    // Open course in new window/tab (or embedded viewer)
    if (course.launch_url) {
      window.open(course.launch_url, '_blank');
    }
  }, [user?.id, courses, enrollments]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCourses(), fetchPathways(), fetchEnrollments()])
      .finally(() => setLoading(false));
  }, [fetchCourses, fetchPathways, fetchEnrollments]);

  return {
    courses,
    pathways,
    enrollments,
    loading,
    error,
    enrollInCourse,
    updateProgress,
    launchCourse,
    refresh: () => Promise.all([fetchCourses(), fetchPathways(), fetchEnrollments()]),
  };
}
