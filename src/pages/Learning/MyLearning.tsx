import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy, Clock, Target, Play, Calendar } from 'lucide-react';
import { useLearningDevelopment } from '@/hooks/useLearningDevelopment';
import { format } from 'date-fns';

const MyLearning = () => {
  const { 
    courses, 
    enrollments, 
    certifications, 
    loading, 
    enrollInCourse, 
    updateProgress, 
    getLearningStats 
  } = useLearningDevelopment();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading learning data...</p>
        </div>
      </div>
    );
  }

  const stats = getLearningStats();

  const getCourseById = (courseId: string) => {
    return courses.find(course => course.id === courseId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Learning</h1>
        <p className="text-gray-600">Track your learning progress and achievements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span>Enrolled Courses</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.enrolledCourses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Completed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completedCourses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span>Hours Learned</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalHours}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-purple-500" />
              <span>Certifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeCertifications}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList>
          <TabsTrigger value="current">Current Courses</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>My Current Courses</CardTitle>
              <CardDescription>Courses you're currently enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments.filter(e => e.status !== 'completed').length > 0 ? (
                <div className="space-y-4">
                  {enrollments.filter(e => e.status !== 'completed').map((enrollment) => {
                    const course = getCourseById(enrollment.course_id);
                    return (
                      <Card key={enrollment.id} className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">{course?.title || 'Unknown Course'}</h3>
                            <p className="text-sm text-gray-600">{course?.description || ''}</p>
                            {course?.category && (
                              <Badge variant="outline" className="mt-2">
                                {course.category}
                              </Badge>
                            )}
                          </div>
                          <Badge variant={enrollment.status === 'in_progress' ? 'default' : 'outline'}>
                            {enrollment.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{enrollment.progress || 0}%</span>
                          </div>
                          <Progress value={enrollment.progress || 0} />
                        </div>
                        {course?.duration_hours && (
                          <p className="text-sm text-gray-500 mt-2">
                            Duration: {course.duration_hours} hours
                          </p>
                        )}
                        <div className="flex space-x-2 mt-4">
                          <Button size="sm">
                            <Play className="w-4 h-4 mr-2" />
                            Continue Learning
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateProgress(enrollment.id, Math.min((enrollment.progress || 0) + 10, 100))}
                          >
                            Update Progress
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No current courses</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't enrolled in any courses yet. Browse the catalog to get started.
                  </p>
                  <Button>Browse Courses</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Courses</CardTitle>
              <CardDescription>Courses you have successfully completed</CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments.filter(e => e.status === 'completed').length > 0 ? (
                <div className="space-y-4">
                  {enrollments.filter(e => e.status === 'completed').map((enrollment) => {
                    const course = getCourseById(enrollment.course_id);
                    return (
                      <Card key={enrollment.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{course?.title || 'Unknown Course'}</h3>
                            <p className="text-sm text-gray-600">{course?.description || ''}</p>
                            {enrollment.completed_at && (
                              <p className="text-sm text-gray-500 mt-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Completed on {format(new Date(enrollment.completed_at), 'MMM dd, yyyy')}
                              </p>
                            )}
                          </div>
                          <Badge variant="default">
                            <Trophy className="w-4 h-4 mr-1" />
                            Completed
                          </Badge>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed courses</h3>
                  <p className="text-gray-600 mb-6">
                    Completed courses will appear here once you finish them.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications">
          <Card>
            <CardHeader>
              <CardTitle>My Certifications</CardTitle>
              <CardDescription>Professional certifications and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {certifications.length > 0 ? (
                <div className="space-y-4">
                  {certifications.map((cert) => (
                    <Card key={cert.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{cert.name}</h3>
                          {cert.issuing_organization && (
                            <p className="text-sm text-gray-600">Issued by {cert.issuing_organization}</p>
                          )}
                          <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                            {cert.issue_date && (
                              <span>Issued: {format(new Date(cert.issue_date), 'MMM yyyy')}</span>
                            )}
                            {cert.expiry_date && (
                              <span>Expires: {format(new Date(cert.expiry_date), 'MMM yyyy')}</span>
                            )}
                          </div>
                        </div>
                        <Badge variant={cert.status === 'active' ? 'default' : 'outline'}>
                          {cert.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications yet</h3>
                  <p className="text-gray-600 mb-6">
                    Add your professional certifications to showcase your skills.
                  </p>
                  <Button>Add Certification</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyLearning;
