
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import type { Tables } from '@/integrations/supabase/types';

type TimeEntry = Tables<'time_entries'>;

export const useTimesheets = () => {
  const [timesheets, setTimesheets] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { employees } = useSupabaseEmployees();

  const currentEmployee = user ? employees.find(emp => emp.user_id === user.id) : null;

  const fetchTimesheets = async () => {
    if (!currentEmployee) return;
    
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTimesheets(data || []);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch timesheets",
        variant: "destructive"
      });
    }
  };

  const calculateWeeklyHours = (entries: TimeEntry[]) => {
    return entries.reduce((total, entry) => {
      if (entry.start_time && entry.end_time) {
        const start = new Date(entry.start_time);
        const end = new Date(entry.end_time);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);
  };

  const submitTimesheet = async (weekStart: string, weekEnd: string) => {
    if (!currentEmployee) return null;

    try {
      const weekEntries = timesheets.filter(entry => {
        const entryDate = new Date(entry.start_time).toISOString().split('T')[0];
        return entryDate >= weekStart && entryDate <= weekEnd;
      });

      const totalHours = calculateWeeklyHours(weekEntries);

      // Create attendance record for the week summary
      const { data, error } = await supabase
        .from('attendance_records')
        .insert([{
          employee_id: currentEmployee.id,
          date: weekStart,
          total_hours: totalHours,
          status: 'submitted',
          notes: `Weekly timesheet: ${weekStart} to ${weekEnd}`
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Timesheet Submitted",
        description: `Weekly timesheet submitted with ${totalHours.toFixed(2)} hours`
      });
      
      return data;
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to submit timesheet",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    if (currentEmployee) {
      setLoading(true);
      fetchTimesheets().finally(() => setLoading(false));
    }
  }, [currentEmployee]);

  return {
    timesheets,
    loading,
    submitTimesheet,
    calculateWeeklyHours,
    refetch: fetchTimesheets
  };
};
