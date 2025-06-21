
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, Users, FileText, Download, Play, Clock } from 'lucide-react';
import { usePayrollManagement } from '@/hooks/usePayrollManagement';
import { format } from 'date-fns';

const PayrollProcessing = () => {
  const { 
    payPeriods, 
    payrollRecords, 
    benefits, 
    loading, 
    getPayrollStats,
    createPayPeriod,
    processPayroll 
  } = usePayrollManagement();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  const stats = getPayrollStats();

  const getPayPeriodForRecord = (record: any) => {
    return payPeriods.find(period => period.id === record.pay_period_id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Processing</h1>
          <p className="text-gray-600">Manage payroll runs and employee compensation</p>
        </div>
        <Button>
          <Play className="w-4 h-4 mr-2" />
          Start New Payroll
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span>Last Net Pay</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.lastPayrollRecord?.net_salary?.toFixed(2) || '0.00'}
            </div>
            <p className="text-sm text-gray-500">Most recent payroll</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Pay Records</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayrollRecords}</div>
            <p className="text-sm text-gray-500">Total records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span>Next Pay Date</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {stats.currentPeriod?.end_date 
                ? format(new Date(stats.currentPeriod.end_date), 'MMM dd, yyyy')
                : 'Not scheduled'
              }
            </div>
            <p className="text-sm text-gray-500">
              {stats.currentPeriod ? 'Current period' : 'No active period'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <span>Benefits Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalBenefitsValue.toFixed(2)}</div>
            <p className="text-sm text-gray-500">{stats.activeBenefits} active benefits</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList>
          <TabsTrigger value="current">Current Payroll</TabsTrigger>
          <TabsTrigger value="history">Payroll History</TabsTrigger>
          <TabsTrigger value="benefits">My Benefits</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>Current Pay Period</CardTitle>
              <CardDescription>
                {stats.currentPeriod 
                  ? `${format(new Date(stats.currentPeriod.start_date), 'MMM dd')} - ${format(new Date(stats.currentPeriod.end_date), 'MMM dd, yyyy')}`
                  : 'No active pay period'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.currentPeriod ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">End Date</p>
                      <p className="font-semibold">{format(new Date(stats.currentPeriod.end_date), 'MMM dd, yyyy')}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge variant={stats.currentPeriod.status === 'completed' ? 'default' : 'outline'}>
                        {stats.currentPeriod.status}
                      </Badge>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Avg Salary</p>
                      <p className="font-semibold">${stats.avgMonthlySalary.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active payroll period</h3>
                  <p className="text-gray-600 mb-6">
                    A new payroll period will be created when the next cycle begins.
                  </p>
                  <Button variant="outline">View All Periods</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
              <CardDescription>Your previous pay records and statements</CardDescription>
            </CardHeader>
            <CardContent>
              {payrollRecords.length > 0 ? (
                <div className="space-y-4">
                  {payrollRecords.map((record) => {
                    const payPeriod = getPayPeriodForRecord(record);
                    return (
                      <Card key={record.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">
                              Pay Period: {payPeriod ? payPeriod.period_name : 'Unknown Period'}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 text-sm">
                              <div>
                                <p className="text-gray-600">Gross Salary</p>
                                <p className="font-medium">${record.gross_salary.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Deductions</p>
                                <p className="font-medium">${record.deductions.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Net Pay</p>
                                <p className="font-semibold text-green-600">${record.net_salary.toFixed(2)}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              Created on {format(new Date(record.created_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Badge variant={record.status === 'paid' ? 'default' : 'outline'}>
                              {record.status}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payroll history</h3>
                  <p className="text-gray-600">
                    Your pay records will appear here once payroll processing begins.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle>Employee Benefits</CardTitle>
              <CardDescription>Your current benefit packages and coverage</CardDescription>
            </CardHeader>
            <CardContent>
              {benefits.length > 0 ? (
                <div className="space-y-4">
                  {benefits.map((benefit) => (
                    <Card key={benefit.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{benefit.benefit_name}</h3>
                          <p className="text-sm text-gray-600 capitalize">
                            {benefit.benefit_type.replace('_', ' ')}
                          </p>
                          {benefit.amount && benefit.amount > 0 && (
                            <p className="text-sm font-medium text-green-600 mt-1">
                              Value: ${benefit.amount.toFixed(2)}
                            </p>
                          )}
                          <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                            {benefit.start_date && (
                              <span>From: {format(new Date(benefit.start_date), 'MMM dd, yyyy')}</span>
                            )}
                            {benefit.end_date && (
                              <span>Until: {format(new Date(benefit.end_date), 'MMM dd, yyyy')}</span>
                            )}
                          </div>
                        </div>
                        <Badge variant={benefit.status === 'active' ? 'default' : 'outline'}>
                          {benefit.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No benefits enrolled</h3>
                  <p className="text-gray-600 mb-6">
                    Contact HR to learn about available benefit packages.
                  </p>
                  <Button variant="outline">Contact HR</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PayrollProcessing;
