
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CrossModuleUpdate {
  sourceModule: string;
  targetModules: string[];
  data: any;
  updateType: 'create' | 'update' | 'delete';
}

export const useInterconnectivity = () => {
  const { toast } = useToast();

  // Handle cross-module updates when data changes
  const handleCrossModuleUpdate = async (update: CrossModuleUpdate) => {
    try {
      switch (update.sourceModule) {
        case 'employees':
          await handleEmployeeUpdate(update);
          break;
        case 'time_tracking':
          await handleTimeTrackingUpdate(update);
          break;
        case 'leave_management':
          await handleLeaveUpdate(update);
          break;
        case 'performance':
          await handlePerformanceUpdate(update);
          break;
        case 'learning':
          await handleLearningUpdate(update);
          break;
        default:
          console.log('No cross-module handler for:', update.sourceModule);
      }
    } catch (error) {
      console.error('Error handling cross-module update:', error);
    }
  };

  const handleEmployeeUpdate = async (update: CrossModuleUpdate) => {
    const { data, updateType } = update;
    
    if (updateType === 'create') {
      // When new employee is created, create default performance goals
      await supabase.from('performance_goals').insert([
        {
          employee_id: data.id,
          title: 'Onboarding Completion',
          description: 'Complete all onboarding requirements',
          category: 'onboarding',
          target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'not_started',
          progress: 0
        }
      ]);
      
      console.log('Created default performance goals for new employee');
    }
  };

  const handleTimeTrackingUpdate = async (update: CrossModuleUpdate) => {
    const { data } = update;
    
    // When time entries are updated, update attendance records if needed
    if (data.end_time && data.start_time) {
      const date = new Date(data.start_time).toISOString().split('T')[0];
      const hours = (new Date(data.end_time).getTime() - new Date(data.start_time).getTime()) / (1000 * 60 * 60);
      
      // Check if attendance record exists for this date
      const { data: existingAttendance } = await supabase
        .from('attendance_records')
        .select('id, total_hours')
        .eq('employee_id', data.employee_id)
        .eq('date', date)
        .single();

      if (existingAttendance) {
        // Update existing attendance record
        await supabase
          .from('attendance_records')
          .update({
            total_hours: (existingAttendance.total_hours || 0) + hours,
            status: hours >= 8 ? 'present' : 'partial'
          })
          .eq('id', existingAttendance.id);
      } else {
        // Create new attendance record
        await supabase
          .from('attendance_records')
          .insert([{
            employee_id: data.employee_id,
            date,
            total_hours: hours,
            status: hours >= 8 ? 'present' : 'partial',
            check_in_time: new Date(data.start_time).toTimeString().split(' ')[0],
            check_out_time: data.end_time ? new Date(data.end_time).toTimeString().split(' ')[0] : null
          }]);
      }
      
      console.log('Updated attendance record from time tracking');
    }
  };

  const handleLeaveUpdate = async (update: CrossModuleUpdate) => {
    const { data } = update;
    
    if (data.status === 'approved') {
      // When leave is approved, create attendance records for the leave period
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      
      const attendanceRecords = [];
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        attendanceRecords.push({
          employee_id: data.employee_id,
          date: date.toISOString().split('T')[0],
          status: 'on_leave',
          total_hours: 0,
          notes: `On ${data.leave_type} leave`
        });
      }
      
      await supabase
        .from('attendance_records')
        .insert(attendanceRecords);
      
      console.log('Created attendance records for approved leave');
    }
  };

  const handlePerformanceUpdate = async (update: CrossModuleUpdate) => {
    const { data } = update;
    
    // When performance goal is completed, suggest relevant learning courses
    if (data.status === 'completed' && data.category) {
      const { data: relevantCourses } = await supabase
        .from('courses')
        .select('id, title, category')
        .eq('category', data.category)
        .eq('is_active', true)
        .limit(3);
      
      if (relevantCourses && relevantCourses.length > 0) {
        console.log(`Suggested ${relevantCourses.length} courses for completed goal in ${data.category}`);
        // In a real app, you might create notifications or recommendations here
      }
    }
  };

  const handleLearningUpdate = async (update: CrossModuleUpdate) => {
    const { data } = update;
    
    // When course is completed, update performance metrics
    if (data.status === 'completed') {
      // Find related performance goals and update progress
      const { data: relatedGoals } = await supabase
        .from('performance_goals')
        .select('id, progress')
        .eq('employee_id', data.employee_id)
        .eq('category', 'learning')
        .neq('status', 'completed');
      
      if (relatedGoals && relatedGoals.length > 0) {
        for (const goal of relatedGoals) {
          const newProgress = Math.min(100, goal.progress + 25); // Add 25% for each completed course
          await supabase
            .from('performance_goals')
            .update({
              progress: newProgress,
              status: newProgress >= 100 ? 'completed' : 'in_progress'
            })
            .eq('id', goal.id);
        }
        
        console.log('Updated performance goals from completed course');
      }
    }
  };

  // Set up real-time listeners for cross-module updates - simplified version
  useEffect(() => {
    console.log('Cross-module interconnectivity initialized');
    
    // In a production app, you would set up real-time listeners here
    // For now, we'll just log that the system is ready
    
    return () => {
      console.log('Cross-module interconnectivity cleanup');
    };
  }, []);

  return {
    handleCrossModuleUpdate
  };
};
