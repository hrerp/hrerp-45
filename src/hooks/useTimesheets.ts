
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import type { Tables } from '@/integrations/supabase/types';

type TimeEntry = Tables<'time_entries'>;
type Timesheet = {
  id: string;
  employee_id: string;
  week_start_date: string;
  week_end_date: string;
  total_hours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
};

export const useTimesheets = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { employees } = useSupabaseEmployees();

  const currentEmployee = user ? employees.find(emp => emp.user_id === user.id) : null;

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0]
    };
  };

  const fetchTimesheets = async () => {
    if (!currentEmployee) return;
    
    try {
      // For now, we'll simulate timesheets from attendance records
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert attendance records to timesheet format
      const mockTimesheets: Timesheet[] = data?.map(record => ({
        id: record.id,
        employee_id: record.employee_id,
        week_start_date: record.date,
        week_end_date: record.date,
        total_hours: Number(record.total_hours || 0),
        status: (record.status as any) || 'draft',
        created_at: record.created_at || '',
        updated_at: record.updated_at || ''
      })) || [];
      
      setTimesheets(mockTimesheets);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch timesheets",
        variant: "destructive"
      });
    }
  };

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
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const getTimesheetEntries = async (weekStart: string) => {
    if (!currentEmployee) return [];
    
    const weekDates = getWeekDates(new Date(weekStart));
    
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .gte('start_time', weekDates.start)
        .lte('start_time', weekDates.end + 'T23:59:59');

      if (error) throw error;
      
      // Add computed total_hours and status
      return data?.map(entry => ({
        ...entry,
        total_hours: entry.end_time ? 
          (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / (1000 * 60 * 60) : 0,
        status: entry.end_time ? 'completed' : 'active',
        projects: null,
        tasks: null
      })) || [];
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
      return [];
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

  const createTimesheet = async (weekStart: string) => {
    if (!currentEmployee) return null;

    try {
      const weekDates = getWeekDates(new Date(weekStart));
      const entries = await getTimesheetEntries(weekStart);
      const totalHours = calculateWeeklyHours(entries);

      // Create a mock timesheet using attendance_records
      const { data, error } = await supabase
        .from('attendance_records')
        .insert([{
          employee_id: currentEmployee.id,
          date: weekStart,
          total_hours: totalHours,
          status: 'draft',
          notes: `Weekly timesheet: ${weekDates.start} to ${weekDates.end}`
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchTimesheets();
      
      toast({
        title: "Timesheet Created",
        description: `Timesheet created for week of ${weekStart}`
      });
      
      return data;
    } catch (error) {
      console.error('Error creating timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to create timesheet",
        variant: "destructive"
      });
      return null;
    }
  };

  const submitTimesheet = async (timesheetId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .update({ status: 'submitted' })
        .eq('id', timesheetId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchTimesheets();
      
      toast({
        title: "Timesheet Submitted",
        description: "Timesheet has been submitted for approval"
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

  // Overload the original submitTimesheet signature
  const submitTimesheetByWeek = async (weekStart: string, weekEnd: string) => {
    if (!currentEmployee) return null;

    try {
      const weekEntries = timeEntries.filter(entry => {
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
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTimesheets(), fetchTimeEntries()]);
      setLoading(false);
    };

    if (currentEmployee) {
      loadData();
    }
  }, [currentEmployee]);

  return {
    timesheets,
    loading,
    createTimesheet,
    submitTimesheet: timesheetId => submitTimesheet(timesheetId),
    submitTimesheetByWeek,
    getTimesheetEntries,
    getWeekDates,
    calculateWeeklyHours,
    refetch: () => Promise.all([fetchTimesheets(), fetchTimeEntries()])
  };
};
