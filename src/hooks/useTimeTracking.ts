
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import type { Tables } from '@/integrations/supabase/types';

type TimeEntry = Tables<'time_entries'>;
type Project = Tables<'projects'>;

export const useTimeTracking = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { employees } = useSupabaseEmployees();

  const currentEmployee = user ? employees.find(emp => emp.user_id === user.id) : null;

  const fetchTimeEntries = async () => {
    if (!currentEmployee) return;
    
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTimeEntries(data || []);
      
      // Find active entry - for now, we'll just check for entries without end_time
      const active = data?.find(entry => !entry.end_time);
      setActiveEntry(active || null);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch time entries",
        variant: "destructive"
      });
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const startTracking = async (projectId?: string, description?: string) => {
    if (!currentEmployee) {
      toast({
        title: "Error",
        description: "Employee not found",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Stop any existing active entry
      if (activeEntry) {
        await stopTracking();
      }

      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          employee_id: currentEmployee.id,
          project_id: projectId || null,
          start_time: new Date().toISOString(),
          description: description || null
        }])
        .select()
        .single();

      if (error) throw error;
      
      setActiveEntry(data);
      await fetchTimeEntries();
      
      toast({
        title: "Time Tracking Started",
        description: "Timer started successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error starting time tracking:', error);
      toast({
        title: "Error",
        description: "Failed to start time tracking",
        variant: "destructive"
      });
      return null;
    }
  };

  const stopTracking = async () => {
    if (!activeEntry) return null;

    try {
      const endTime = new Date().toISOString();

      const { data, error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime
        })
        .eq('id', activeEntry.id)
        .select()
        .single();

      if (error) throw error;
      
      setActiveEntry(null);
      await fetchTimeEntries();
      
      toast({
        title: "Time Tracking Stopped",
        description: "Timer stopped successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      toast({
        title: "Error",
        description: "Failed to stop time tracking",
        variant: "destructive"
      });
      return null;
    }
  };

  const getTimeStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Calculate hours based on start_time and end_time
    const calculateHours = (entry: TimeEntry) => {
      if (!entry.end_time) return 0;
      const start = new Date(entry.start_time);
      const end = new Date(entry.end_time);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    };

    const todayEntries = timeEntries.filter(entry => 
      entry.start_time.startsWith(today) && entry.end_time
    );
    const weekEntries = timeEntries.filter(entry => 
      new Date(entry.start_time) >= thisWeekStart && entry.end_time
    );
    const monthEntries = timeEntries.filter(entry => 
      new Date(entry.start_time) >= thisMonthStart && entry.end_time
    );

    const todayHours = todayEntries.reduce((sum, entry) => sum + calculateHours(entry), 0);
    const weekHours = weekEntries.reduce((sum, entry) => sum + calculateHours(entry), 0);
    const monthHours = monthEntries.reduce((sum, entry) => sum + calculateHours(entry), 0);

    return {
      today: todayHours,
      week: weekHours,
      month: monthHours,
      average: weekEntries.length > 0 ? weekHours / 7 : 0
    };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTimeEntries(), fetchProjects()]);
      setLoading(false);
    };

    if (currentEmployee) {
      loadData();
    }
  }, [currentEmployee]);

  return {
    timeEntries,
    projects,
    activeEntry,
    loading,
    startTracking,
    stopTracking,
    getTimeStats,
    refetch: fetchTimeEntries
  };
};
