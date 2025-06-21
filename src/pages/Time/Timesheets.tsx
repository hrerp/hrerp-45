
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Plus, Download, Edit, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTimesheets } from '@/hooks/useTimesheets';
import { useTimeTracking } from '@/hooks/useTimeTracking';

const Timesheets = () => {
  const { toast } = useToast();
  const [selectedWeek, setSelectedWeek] = useState(new Date().toISOString().split('T')[0]);
  
  const { 
    timesheets, 
    loading: timesheetsLoading, 
    createTimesheet, 
    submitTimesheet,
    getTimesheetEntries,
    getWeekDates 
  } = useTimesheets();
  
  const { projects, loading: trackingLoading } = useTimeTracking();
  const [entries, setEntries] = useState<any[]>([]);

  const loading = timesheetsLoading || trackingLoading;

  useEffect(() => {
    const fetchEntries = async () => {
      const weekDates = getWeekDates(new Date(selectedWeek));
      const weekEntries = await getTimesheetEntries(weekDates.start);
      setEntries(weekEntries);
    };

    if (!loading) {
      fetchEntries();
    }
  }, [selectedWeek, loading, getTimesheetEntries, getWeekDates]);

  const handleCreateTimesheet = async () => {
    const weekDates = getWeekDates(new Date(selectedWeek));
    await createTimesheet(weekDates.start);
  };

  const handleSubmitTimesheet = async (timesheetId: string) => {
    await submitTimesheet(timesheetId);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const totalHours = entries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
  const weeklyTarget = 40;

  const currentWeekTimesheet = timesheets.find(ts => {
    const weekDates = getWeekDates(new Date(selectedWeek));
    return ts.week_start_date === weekDates.start;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
          <p className="text-gray-600">Track and manage your work hours</p>
        </div>
        <div className="flex space-x-3">
          <Input
            type="week"
            value={selectedWeek.slice(0, 7)}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="w-40"
          />
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {!currentWeekTimesheet && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateTimesheet}>
              <Plus className="w-4 h-4 mr-2" />
              Create Timesheet
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(totalHours * 100) / 100}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Weekly Target</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyTarget}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {currentWeekTimesheet?.status || 'No Timesheet'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Edit className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Entries</p>
                <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentWeekTimesheet && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Timesheet Status</h3>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(currentWeekTimesheet.status || 'draft')}`}>
                    {currentWeekTimesheet.status}
                  </span>
                  <span className="text-gray-600">
                    Week of {new Date(currentWeekTimesheet.week_start_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {currentWeekTimesheet.status === 'draft' && (
                <Button 
                  onClick={() => handleSubmitTimesheet(currentWeekTimesheet.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Submit for Approval
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries for this week</h3>
              <p className="text-gray-600 mb-6">
                Time entries from your time tracking will appear here automatically.
              </p>
              <Button 
                onClick={handleCreateTimesheet}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!!currentWeekTimesheet}
              >
                {currentWeekTimesheet ? 'Timesheet Created' : 'Create Timesheet'}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Project</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Hours</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">
                        {new Date(entry.start_time).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {entry.projects?.name || 'No Project'}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {entry.total_hours ? `${Math.round(entry.total_hours * 100) / 100}h` : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {entry.description || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          entry.status === 'completed' ? 'bg-green-100 text-green-800' :
                          entry.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {timesheets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Timesheets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timesheets.slice(0, 5).map((timesheet) => (
                <div key={timesheet.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">
                      Week of {new Date(timesheet.week_start_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {timesheet.total_hours}h • {timesheet.status}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(timesheet.status || 'draft')}`}>
                    {timesheet.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Timesheets;
