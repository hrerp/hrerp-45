
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, MapPin, Clock, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface JobPostingsListProps {
  jobs: any[];
  setSelectedJob: (job: any) => void;
}

const JobPostingsList = ({ jobs, setSelectedJob }: JobPostingsListProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Active Job Postings</span>
          <Button onClick={() => navigate('/recruitment/post-job')}>
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </CardTitle>
        <CardDescription>Manage open positions and requirements</CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first job posting to start recruiting candidates.
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/recruitment/post-job')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Post Your First Job
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedJob(job)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <p className="text-gray-600 text-sm">{job.departments?.name}</p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      {job.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span className="capitalize">{job.employment_type?.replace('_', ' ')}</span>
                      </div>
                      {job.salary_min && job.salary_max && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      job.status === 'open' ? 'bg-green-100 text-green-800' : 
                      job.status === 'closed' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {job.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Posted {new Date(job.posted_at || job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobPostingsList;
