
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Calendar, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';

const QuickStats = () => {
  const { getEmployeeStats } = useEmployees();
  const employeeStats = getEmployeeStats();

  const stats = [
    {
      title: 'Active Employees',
      value: employeeStats.active.toString(),
      change: employeeStats.total > 0 ? `${employeeStats.total} total` : 'No employees yet',
      changeType: 'neutral' as const,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Present Today',
      value: '0',
      change: '0%',
      changeType: 'neutral' as const,
      icon: UserCheck,
      color: 'green'
    },
    {
      title: 'On Leave',
      value: '0',
      change: 'No leave requests',
      changeType: 'neutral' as const,
      icon: Calendar,
      color: 'yellow'
    },
    {
      title: 'Late Arrivals',
      value: '0',
      change: 'No late arrivals',
      changeType: 'neutral' as const,
      icon: Clock,
      color: 'red'
    },
    {
      title: 'Pending Reviews',
      value: '0',
      change: 'No pending reviews',
      changeType: 'neutral' as const,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Open Positions',
      value: '0',
      change: 'No open positions',
      changeType: 'neutral' as const,
      icon: AlertTriangle,
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className={`text-xs ${getChangeColor(stat.changeType)}`}>
                  {stat.change}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(stat.color)}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickStats;
