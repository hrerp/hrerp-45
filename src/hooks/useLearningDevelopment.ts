
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;
type CourseEnrollment = Tables<'course_enrollments'>;
type Certification = Tables<'certifications'>;

export const useLearningDevelopment = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { employees } = useSupabaseEmployees();

  const currentEmployee = user ? employees.find(emp => emp.user_id === user.id) : null;

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchEnrollments = async () => {
    if (!currentEmployee) return;

    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses (
            title,
            description,
            category
          )
        `)
        .eq('employee_id', currentEmployee.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setEnrollments([]);
    }
  };

  const fetchCertifications = async () => {
    if (!currentEmployee) return;

    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertifications(data as Certification[] || []);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      setCertifications([]);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!currentEmployee) {
      toast({
        title: "Error",
        description: "Employee not found",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert([{
          employee_id: currentEmployee.id,
          course_id: courseId,
          status: 'enrolled',
          progress: 0
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchEnrollments();
      
      toast({
        title: "Enrolled Successfully",
        description: "You have been enrolled in the course"
      });
      
      return data;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive"
      });
      return null;
    }
  };

  const addCertification = async (certificationData: Partial<Certification>) => {
    if (!currentEmployee) {
      toast({
        title: "Error",
        description: "Employee not found",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('certifications')
        .insert([{
          ...certificationData,
          employee_id: currentEmployee.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchCertifications();
      
      toast({
        title: "Certification Added",
        description: "Certification has been added successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error adding certification:', error);
      toast({
        title: "Error",
        description: "Failed to add certification",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateEnrollmentProgress = async (enrollmentId: string, progress: number) => {
    try {
      const status = progress >= 100 ? 'completed' : 'in_progress';
      const { data, error } = await supabase
        .from('course_enrollments')
        .update({ 
          progress,
          status,
          completed_at: progress >= 100 ? new Date().toISOString() : null
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchEnrollments();
      
      toast({
        title: "Progress Updated",
        description: `Course progress updated to ${progress}%`
      });
      
      return data;
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCourses(), fetchEnrollments(), fetchCertifications()]);
      setLoading(false);
    };

    loadData();
  }, [currentEmployee]);

  return {
    courses,
    enrollments,
    certifications,
    loading,
    enrollInCourse,
    addCertification,
    updateEnrollmentProgress,
    refetch: () => Promise.all([fetchCourses(), fetchEnrollments(), fetchCertifications()])
  };
};
