
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Briefcase } from 'lucide-react';
import { useRecruitment } from '@/hooks/useRecruitment';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';

const PostJob = () => {
  const navigate = useNavigate();
  const { createJobPosting } = useRecruitment();
  const { departments } = useSupabaseEmployees();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    department_id: '',
    location: '',
    employment_type: 'full_time',
    salary_min: '',
    salary_max: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const jobData = {
      title: formData.title,
      description: formData.description,
      requirements: formData.requirements,
      department_id: formData.department_id || null,
      location: formData.location || null,
      employment_type: formData.employment_type,
      salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
      salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
      status: 'open',
      posted_at: new Date().toISOString(),
      posted_by: null
    };

    const result = await createJobPosting(jobData);
    if (result) {
      navigate('/recruitment');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/recruitment')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Recruitment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="w-6 h-6" />
            <span>Post New Job</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department_id} onValueChange={(value) => handleInputChange('department_id', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(value) => handleInputChange('employment_type', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g. New York, NY"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="salary_min">Minimum Salary</Label>
                <Input
                  id="salary_min"
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => handleInputChange('salary_min', e.target.value)}
                  placeholder="50000"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="salary_max">Maximum Salary</Label>
                <Input
                  id="salary_max"
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => handleInputChange('salary_max', e.target.value)}
                  placeholder="80000"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the job role, responsibilities, and what you're looking for..."
                rows={6}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="List the required skills, experience, and qualifications..."
                rows={6}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/recruitment')}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Post Job
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostJob;
