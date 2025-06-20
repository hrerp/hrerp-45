
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import type { Tables } from '@/integrations/supabase/types';

type JobPosting = Tables<'job_postings'>;
type JobApplication = Tables<'job_applications'>;
type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export const useRecruitment = () => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { employees } = useSupabaseEmployees();

  const currentEmployee = user ? employees.find(emp => emp.user_id === user.id) : null;

  const fetchJobPostings = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          departments (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobPostings(data || []);
    } catch (error) {
      console.error('Error fetching job postings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch job postings",
        variant: "destructive"
      });
    }
  };

  const fetchJobApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_postings (
            title,
            departments (
              name
            )
          )
        `)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setJobApplications(data || []);
    } catch (error) {
      console.error('Error fetching job applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch job applications",
        variant: "destructive"
      });
    }
  };

  const createJobPosting = async (jobData: Omit<JobPosting, 'id' | 'created_at' | 'updated_at'>) => {
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
        .from('job_postings')
        .insert([{
          ...jobData,
          posted_by: currentEmployee.id,
          posted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchJobPostings();
      
      toast({
        title: "Job Posted",
        description: "Job posting created successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating job posting:', error);
      toast({
        title: "Error",
        description: "Failed to create job posting",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateJobPosting = async (id: string, updates: Partial<JobPosting>) => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchJobPostings();
      
      toast({
        title: "Job Updated",
        description: "Job posting updated successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error updating job posting:', error);
      toast({
        title: "Error",
        description: "Failed to update job posting",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteJobPosting = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchJobPostings();
      
      toast({
        title: "Job Deleted",
        description: "Job posting deleted successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting job posting:', error);
      toast({
        title: "Error",
        description: "Failed to delete job posting",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: ApplicationStatus) => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchJobApplications();
      
      toast({
        title: "Application Updated",
        description: `Application status updated to ${status}`
      });
      
      return data;
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
      return null;
    }
  };

  const getApplicationStats = () => {
    const stats = {
      total: jobApplications.length,
      applied: jobApplications.filter(app => app.status === 'applied').length,
      screening: jobApplications.filter(app => app.status === 'screening').length,
      interview: jobApplications.filter(app => app.status === 'interview').length,
      offer: jobApplications.filter(app => app.status === 'offer').length,
      hired: jobApplications.filter(app => app.status === 'hired').length,
      rejected: jobApplications.filter(app => app.status === 'rejected').length
    };

    return stats;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchJobPostings(), fetchJobApplications()]);
      setLoading(false);
    };

    if (currentEmployee) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentEmployee]);

  return {
    jobPostings,
    jobApplications,
    loading,
    createJobPosting,
    updateJobPosting,
    deleteJobPosting,
    updateApplicationStatus,
    getApplicationStats,
    refetch: () => Promise.all([fetchJobPostings(), fetchJobApplications()])
  };
};
