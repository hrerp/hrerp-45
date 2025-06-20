
import JobPostingsList from './JobPostingsList';

interface JobPostingsTabProps {
  jobs: any[];
  setSelectedJob: (job: any) => void;
}

const JobPostingsTab = ({ jobs, setSelectedJob }: JobPostingsTabProps) => {
  return <JobPostingsList jobs={jobs} setSelectedJob={setSelectedJob} />;
};

export default JobPostingsTab;
