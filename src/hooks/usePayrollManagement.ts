
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import type { Tables } from '@/integrations/supabase/types';

type PayPeriod = Tables<'pay_periods'>;
type PayrollRecord = Tables<'payroll_records'>;
type EmployeeBenefit = Tables<'employee_benefits'>;

export const usePayrollManagement = () => {
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [benefits, setBenefits] = useState<EmployeeBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { employees } = useSupabaseEmployees();

  const currentEmployee = user ? employees.find(emp => emp.user_id === user.id) : null;

  const fetchPayPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('pay_periods')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPayPeriods(data || []);
    } catch (error) {
      console.error('Error fetching pay periods:', error);
      setPayPeriods([]);
    }
  };

  const fetchPayrollRecords = async () => {
    if (!currentEmployee) return;

    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayrollRecords(data || []);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      setPayrollRecords([]);
    }
  };

  const fetchBenefits = async () => {
    if (!currentEmployee) return;

    try {
      const { data, error } = await supabase
        .from('employee_benefits')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBenefits(data || []);
    } catch (error) {
      console.error('Error fetching benefits:', error);
      setBenefits([]);
    }
  };

  const createPayPeriod = async (periodData: {
    period_name: string;
    start_date: string;
    end_date: string;
    status?: string;
  }) => {
    try {
      const payPeriodData = {
        period_name: periodData.period_name,
        start_date: periodData.start_date,
        end_date: periodData.end_date,
        status: periodData.status || 'draft'
      };

      const { data, error } = await supabase
        .from('pay_periods')
        .insert(payPeriodData)
        .select()
        .single();

      if (error) throw error;
      
      await fetchPayPeriods();
      
      toast({
        title: "Pay Period Created",
        description: "Pay period has been created successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating pay period:', error);
      toast({
        title: "Error",
        description: "Failed to create pay period",
        variant: "destructive"
      });
      return null;
    }
  };

  const processPayroll = async (payPeriodId: string) => {
    try {
      const { data: activeEmployees, error: empError } = await supabase
        .from('employees')
        .select('id, salary')
        .eq('status', 'active');

      if (empError) throw empError;

      const payrollRecords = activeEmployees?.map(emp => ({
        employee_id: emp.id,
        pay_period_id: payPeriodId,
        gross_salary: emp.salary || 0,
        deductions: 0,
        net_salary: emp.salary || 0,
        status: 'pending' as const
      })) || [];

      const { error } = await supabase
        .from('payroll_records')
        .insert(payrollRecords);

      if (error) throw error;
      
      await fetchPayrollRecords();
      
      toast({
        title: "Payroll Processed",
        description: "Payroll has been processed successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast({
        title: "Error",
        description: "Failed to process payroll",
        variant: "destructive"
      });
      return false;
    }
  };

  const getPayrollStats = () => {
    const currentPeriod = payPeriods.find(p => p.status === 'active') || payPeriods[0];
    const lastPayrollRecord = payrollRecords[0];
    const totalPayrollRecords = payrollRecords.length;
    const totalBenefitsValue = benefits.reduce((sum, benefit) => sum + (benefit.amount || 0), 0);
    const activeBenefits = benefits.filter(b => b.status === 'active').length;
    const avgMonthlySalary = payrollRecords.length > 0 
      ? payrollRecords.reduce((sum, record) => sum + record.net_salary, 0) / payrollRecords.length 
      : 0;

    return {
      currentPeriod,
      lastPayrollRecord,
      totalPayrollRecords,
      totalBenefitsValue,
      activeBenefits,
      avgMonthlySalary
    };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPayPeriods(), fetchPayrollRecords(), fetchBenefits()]);
      setLoading(false);
    };

    loadData();
  }, [currentEmployee]);

  return {
    payPeriods,
    payrollRecords,
    benefits,
    loading,
    createPayPeriod,
    processPayroll,
    getPayrollStats,
    refetch: () => Promise.all([fetchPayPeriods(), fetchPayrollRecords(), fetchBenefits()])
  };
};
