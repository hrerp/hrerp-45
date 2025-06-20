
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;
type CourseEnrollment = Tables<'course_enrollments'> & {
  courses?: Course;
};

// Define Certification type manually since it's not in the generated types yet
interface Certification {
  id: string;
  employee_id: string;
  name: string;
  issuing_organization?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useLearningDevelopment = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive"
      });
    }
  };

  const fetchEnrollments = async () => {
    try {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!employeeData) return;

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses (*)
        `)
        .eq('employee_id', employeeData.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch enrollments",
        variant: "destructive"
      });
    }
  };

  const fetchCertifications = async () => {
    try {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!employeeData) return;

      const { data, error }: { data: Certification[] | null, error: any } = await supabase
        .from('certifications' as any)
        .select('*')
        .eq('employee_id', employeeData.id)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch certifications",
        variant: "destructive"
      });
    }
  };

  const enrollInCourse = async (courseId: string) => {
    try {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!employeeData) throw new Error('Employee not found');

      const { error } = await supabase
        .from('course_enrollments')
        .insert([{
          course_id: courseId,
          employee_id: employeeData.id,
          status: 'enrolled'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully enrolled in course",
      });

      await fetchEnrollments();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive"
      });
    }
  };

  const updateProgress = async (enrollmentId: string, progress: number) => {
    try {
      const status = progress >= 100 ? 'completed' : 'in_progress';
      const completedAt = progress >= 100 ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('course_enrollments')
        .update({ 
          progress, 
          status,
          completed_at: completedAt
        })
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Progress updated successfully",
      });

      await fetchEnrollments();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const addCertification = async (certData: Omit<Certification, 'id' | 'employee_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!employeeData) throw new Error('Employee not found');

      const { error } = await supabase
        .from('certifications' as any)
        .insert([{
          ...certData,
          employee_id: employeeData.id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Certification added successfully",
      });

      await fetchCertifications();
    } catch (error) {
      console.error('Error adding certification:', error);
      toast({
        title: "Error",
        description: "Failed to add certification",
        variant: "destructive"
      });
    }
  };

  const getLearningStats = () => {
    const totalCourses = courses.length;
    const enrolledCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const totalHours = enrollments
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + (e.courses?.duration_hours || 0), 0);
    const activeCertifications = certifications.filter(c => c.status === 'active').length;

    return {
      totalCourses,
      enrolledCourses,
      completedCourses,
      totalHours,
      activeCertifications,
      inProgressCourses: enrollments.filter(e => e.status === 'in_progress').length
    };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCourses(), fetchEnrollments(), fetchCertifications()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    courses,
    enrollments,
    certifications,
    loading,
    enrollInCourse,
    updateProgress,
    addCertification,
    getLearningStats,
    refetchCourses: fetchCourses,
    refetchEnrollments: fetchEnrollments,
    refetchCertifications: fetchCertifications
  };
};
