
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
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchEnrollments = async () => {
    if (!currentEmployee) return;

    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const fetchCertifications = async () => {
    if (!currentEmployee) return;

    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error) {
      console.error('Error fetching certifications:', error);
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
          status: 'enrolled'
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

  const updateProgress = async (enrollmentId: string, progress: number) => {
    try {
      const updates: any = { progress };
      
      if (progress >= 100) {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      } else if (progress > 0) {
        updates.status = 'in_progress';
      }

      const { error } = await supabase
        .from('course_enrollments')
        .update(updates)
        .eq('id', enrollmentId);

      if (error) throw error;
      
      await fetchEnrollments();
      
      toast({
        title: "Progress Updated",
        description: `Course progress updated to ${progress}%`
      });
      
      return true;
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
      return false;
    }
  };

  const addCertification = async (certificationData: {
    name: string;
    issuing_organization?: string;
    issue_date?: string;
    expiry_date?: string;
    credential_id?: string;
  }) => {
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
        .insert({
          employee_id: currentEmployee.id,
          ...certificationData
        })
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

  const getLearningStats = () => {
    const enrolledCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const inProgressCourses = enrollments.filter(e => e.status === 'in_progress').length;
    const activeCertifications = certifications.filter(c => c.status === 'active').length;
    
    // Calculate total hours from completed courses
    const totalHours = enrollments
      .filter(e => e.status === 'completed')
      .reduce((total, enrollment) => {
        const course = courses.find(c => c.id === enrollment.course_id);
        return total + (course?.duration_hours || 0);
      }, 0);

    return {
      enrolledCourses,
      completedCourses,
      inProgressCourses,
      activeCertifications,
      totalHours
    };
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
    updateProgress,
    addCertification,
    getLearningStats,
    refetch: () => Promise.all([fetchCourses(), fetchEnrollments(), fetchCertifications()])
  };
};
