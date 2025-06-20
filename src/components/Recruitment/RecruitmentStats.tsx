
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UserPlus, Briefcase, Calendar, Clock, FileText, 
  Users, TrendingUp, CheckCircle 
} from 'lucide-react';

interface RecruitmentStatsProps {
  jobPostings: any[];
  jobApplications: any[];
}

const RecruitmentStats = ({ jobPostings, jobApplications }: RecruitmentStatsProps) => {
  const openPositions = jobPostings.filter(job => job.status === 'open').length;
  const totalApplications = jobApplications.length;
  const interviewApplications = jobApplications.filter(app => app.status === 'interview').length;
  const hiredApplications = jobApplications.filter(app => app.status === 'hired').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-blue-500" />
            <span>Open Positions</span>
          </CardTitle>
          <CardDescription>Currently hiring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{openPositions}</div>
          <div className="text-sm text-gray-500 flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span>{openPositions > 0 ? `${openPositions} active positions` : 'No positions yet'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-green-500" />
            <span>Applications</span>
          </CardTitle>
          <CardDescription>Total received</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalApplications}</div>
          <div className="text-sm text-gray-500 flex items-center space-x-1">
            <FileText className="w-4 h-4 text-blue-500" />
            <span>{totalApplications > 0 ? `${totalApplications} applications received` : 'No applications yet'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span>Interviews</span>
          </CardTitle>
          <CardDescription>In progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{interviewApplications}</div>
          <div className="text-sm text-gray-500 flex items-center space-x-1">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>{interviewApplications > 0 ? `${interviewApplications} in interview stage` : 'No interviews scheduled'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Hires</span>
          </CardTitle>
          <CardDescription>Successful placements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{hiredApplications}</div>
          <div className="text-sm text-gray-500 flex items-center space-x-1">
            <Users className="w-4 h-4 text-purple-500" />
            <span>{hiredApplications > 0 ? `${hiredApplications} successful hires` : 'No hires yet'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecruitmentStats;
