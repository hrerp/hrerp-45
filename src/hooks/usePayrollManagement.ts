
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define types manually since they're not in the generated types yet
interface PayPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PayrollRecord {
  id: string;
  employee_id: string;
  pay_period_id: string;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  status: string;
  created_at: string;
  updated_at: string;
  pay_periods?: PayPeriod;
}

interface EmployeeBenefit {
  id: string;
  employee_id: string;
  benefit_type: string;
  benefit_name: string;
  amount?: number;
  status: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export const usePayrollManagement = () => {
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [benefits, setBenefits] = useState<EmployeeBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPayPeriods = async () => {
    try {
      const { data, error }: { data: PayPeriod[] | null, error: any } = await supabase
        .from('pay_periods' as any)
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPayPeriods(data || []);
    } catch (error) {
      console.error('Error fetching pay periods:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pay periods",
        variant: "destructive"
      });
    }
  };

  const fetchPayrollRecords = async () => {
    try {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!employeeData) return;

      const { data, error }: { data: PayrollRecord[] | null, error: any } = await supabase
        .from('payroll_records' as any)
        .select(`
          *,
          pay_periods:pay_period_id (*)
        `)
        .eq('employee_id', employeeData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayrollRecords(data || []);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payroll records",
        variant: "destructive"
      });
    }
  };

  const fetchBenefits = async () => {
    try {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!employeeData) return;

      const { data, error }: { data: EmployeeBenefit[] | null, error: any } = await supabase
        .from('employee_benefits' as any)
        .select('*')
        .eq('employee_id', employeeData.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBenefits(data || []);
    } catch (error) {
      console.error('Error fetching benefits:', error);
      toast({
        title: "Error",
        description: "Failed to fetch benefits",
        variant: "destructive"
      });
    }
  };

  const createPayPeriod = async (payPeriodData: Omit<PayPeriod, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('pay_periods' as any)
        .insert([payPeriodData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pay period created successfully",
      });

      await fetchPayPeriods();
      return { data, error: null };
    } catch (error) {
      console.error('Error creating pay period:', error);
      toast({
        title: "Error",
        description: "Failed to create pay period",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const processPayroll = async (payPeriodId: string, employeePayrolls: Omit<PayrollRecord, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const { error } = await supabase
        .from('payroll_records' as any)
        .insert(employeePayrolls);

      if (error) throw error;

      // Update pay period status
      await supabase
        .from('pay_periods' as any)
        .update({ status: 'processing' })
        .eq('id', payPeriodId);

      toast({
        title: "Success",
        description: "Payroll processed successfully",
      });

      await Promise.all([fetchPayPeriods(), fetchPayrollRecords()]);
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast({
        title: "Error",
        description: "Failed to process payroll",
        variant: "destructive"
      });
    }
  };

  const addBenefit = async (benefitData: Omit<EmployeeBenefit, 'id' | 'employee_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!employeeData) throw new Error('Employee not found');

      const { error } = await supabase
        .from('employee_benefits' as any)
        .insert([{
          ...benefitData,
          employee_id: employeeData.id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Benefit added successfully",
      });

      await fetchBenefits();
    } catch (error) {
      console.error('Error adding benefit:', error);
      toast({
        title: "Error",
        description: "Failed to add benefit",
        variant: "destructive"
      });
    }
  };

  const getPayrollStats = () => {
    const currentPeriod = payPeriods.find(p => p.status === 'processing' || p.status === 'draft');
    const lastPayrollRecord = payrollRecords[0];
    const totalBenefitsValue = benefits.reduce((sum, b) => sum + (b.amount || 0), 0);
    const avgMonthlySalary = payrollRecords.length > 0 
      ? payrollRecords.reduce((sum, r) => sum + r.net_salary, 0) / payrollRecords.length 
      : 0;

    return {
      currentPeriod,
      lastPayrollRecord,
      totalBenefitsValue,
      avgMonthlySalary,
      totalPayrollRecords: payrollRecords.length,
      activeBenefits: benefits.length,
      pendingPayPeriods: payPeriods.filter(p => p.status === 'draft').length
    };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPayPeriods(), fetchPayrollRecords(), fetchBenefits()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    payPeriods,
    payrollRecords,
    benefits,
    loading,
    createPayPeriod,
    processPayroll,
    addBenefit,
    getPayrollStats,
    refetchPayPeriods: fetchPayPeriods,
    refetchPayrollRecords: fetchPayrollRecords,
    refetchBenefits: fetchBenefits
  };
};
