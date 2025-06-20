
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DetailsPanel from '@/components/Common/DetailsPanel';
import RecruitmentStats from '@/components/Recruitment/RecruitmentStats';
import JobPostingsTab from '@/components/Recruitment/JobPostingsTab';
import CandidatesTab from '@/components/Recruitment/CandidatesTab';
import InterviewsTab from '@/components/Recruitment/InterviewsTab';
import AnalyticsTab from '@/components/Recruitment/AnalyticsTab';
import { useRecruitment } from '@/hooks/useRecruitment';

const RecruitmentManagement = () => {
  const { jobPostings, jobApplications, loading } = useRecruitment();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <RecruitmentStats jobPostings={jobPostings} jobApplications={jobApplications} />

        <Tabs defaultValue="jobs" className="w-full">
          <TabsList>
            <TabsTrigger value="jobs">Job Postings</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <JobPostingsTab jobs={jobPostings} setSelectedJob={setSelectedJob} />
          </TabsContent>

          <TabsContent value="candidates">
            <CandidatesTab candidates={jobApplications} setSelectedCandidate={setSelectedCandidate} />
          </TabsContent>

          <TabsContent value="interviews">
            <InterviewsTab />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab recruitmentData={jobApplications} />
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <DetailsPanel
          title={selectedJob ? "Job Details" : selectedCandidate ? "Candidate Details" : "Recruitment Details"}
          isEmpty={!selectedJob && !selectedCandidate}
          emptyMessage="Select a job posting or candidate to view detailed information"
        >
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedJob.title}</h3>
                <p className="text-gray-600">{selectedJob.departments?.name}</p>
              </div>
              <div>
                <h4 className="font-medium">Description</h4>
                <p className="text-sm text-gray-600">{selectedJob.description}</p>
              </div>
              <div>
                <h4 className="font-medium">Requirements</h4>
                <p className="text-sm text-gray-600">{selectedJob.requirements}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status: <span className="font-medium">{selectedJob.status}</span></span>
                <span>Type: <span className="font-medium">{selectedJob.employment_type}</span></span>
              </div>
            </div>
          )}
          
          {selectedCandidate && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedCandidate.candidate_name}</h3>
                <p className="text-gray-600">{selectedCandidate.candidate_email}</p>
              </div>
              <div>
                <h4 className="font-medium">Applied for</h4>
                <p className="text-sm text-gray-600">{selectedCandidate.job_postings?.title}</p>
              </div>
              <div>
                <h4 className="font-medium">Status</h4>
                <p className="text-sm text-gray-600">{selectedCandidate.status}</p>
              </div>
            </div>
          )}
        </DetailsPanel>
      </div>
    </div>
  );
};

export default RecruitmentManagement;
