import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { Layout } from "@/components/Layout"
import { useNavigate } from "react-router-dom"
import {
  PlayCircle,
  BookOpen,
  Brain,
  Trophy,
  TrendingUp,
  Calendar,
  Star,
  Target,
  Clock,
  Users,
  Award,
  Flame,
  BookMarked,
  BarChart3,
  PlusCircle,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Zap,
  GraduationCap,
  Video,
  Mic,
  Eye,
  User
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { 
  CourseStatsCard, 
  StudentStatsCard, 
  ProgressStatsCard, 
  ActivityStatsCard 
} from "@/components/StatsCard"
import { MyEnrolledCourses } from "@/components/MyEnrolledCourses"

const Dashboard = () => {
  const { user, hasRole, updateUser } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(user?.stats || null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState("week")
  const [weeklyProgress, setWeeklyProgress] = useState([
    { day: "Mon", hours: 0, completed: 0 },
    { day: "Tue", hours: 0, completed: 0 },
    { day: "Wed", hours: 0, completed: 0 },
    { day: "Thu", hours: 0, completed: 0 },
    { day: "Fri", hours: 0, completed: 0 },
    { day: "Sat", hours: 0, completed: 0 },
    { day: "Sun", hours: 0, completed: 0 }
  ]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const statsLoadedRef = useRef(false);
  const weeklyLoadedRef = useRef(false);

  // Fetch stats on load and when user changes
  useEffect(() => {
    const loadStats = async () => {
      if (!user || statsLoadedRef.current) return;
      statsLoadedRef.current = true;
      setLoadingStats(true);
      try {
        const response = await apiClient.getUserStats();
        if (response.data) {
          setStats(response.data);
          // Don't update user here to avoid infinite loop
        }
      } catch (e) {
        console.error('Error loading stats:', e);
      }
      setLoadingStats(false);
    };
    loadStats();
    
    // Reset ref when user changes
    return () => {
      statsLoadedRef.current = false;
    };
  }, [user?.id]); // Only depend on user ID, not the entire user object

  useEffect(() => {
    const loadWeekly = async () => {
      if (!user || weeklyLoadedRef.current) return;
      weeklyLoadedRef.current = true;
      setLoadingWeekly(true);
      try {
        const response = await apiClient.getWeeklyProgress();
        if (response.data && Array.isArray(response.data)) {
          setWeeklyProgress(response.data);
        }
      } catch (e) {
        console.error('Error loading weekly progress:', e);
      }
      setLoadingWeekly(false);
    };
    loadWeekly();
    
    // Reset ref when user changes
    return () => {
      weeklyLoadedRef.current = false;
    };
  }, [user?.id]); // Only depend on user ID, not the entire user object

  // Helper to refresh stats after an action
  const refreshStats = async () => {
    if (!user) return;
    setLoadingStats(true);
    try {
      const response = await apiClient.getUserStats();
    if (response.data) {
      const statsData = response.data as any;
      setStats(statsData);
        // Don't update user here to avoid infinite loop
      }
    } catch (e) {
      console.error('Error refreshing stats:', e);
    }
    setLoadingStats(false);
  };

  // Example: Call refreshStats after a user action (lecture, flashcard, quiz, etc.)
  // await refreshStats();

  // Check if user is a lecturer/teacher
  const isLecturer = hasRole('teacher') || hasRole('admin') || hasRole('super_admin') || hasRole('dept_head')

  // Mock data for analytics
  const achievements = [
    { id: 1, title: "Quick Learner", description: "Complete 10 lectures", icon: "⚡", earned: true },
    { id: 2, title: "Quiz Master", description: "Score 90%+ on 5 quizzes", icon: "🎯", earned: true },
    { id: 3, title: "Consistent Student", description: "7-day learning streak", icon: "🔥", earned: true },
    { id: 4, title: "AI Explorer", description: "Complete ML fundamentals", icon: "🤖", earned: false },
    { id: 5, title: "Flash Expert", description: "Review 500 flashcards", icon: "⭐", earned: false }
  ]

  const teacherAchievements = [
    { id: 1, title: "Engaging Educator", description: "Conduct 20+ live lectures", icon: "🎤", earned: true },
    { id: 2, title: "Course Creator", description: "Create 5+ courses", icon: "📚", earned: true },
    { id: 3, title: "Student Favorite", description: "Maintain 4.5+ rating", icon: "⭐", earned: true },
    { id: 4, title: "Innovation Leader", description: "Use AI features in lectures", icon: "🤖", earned: false },
    { id: 5, title: "Mentor Master", description: "Help 100+ students", icon: "👨‍🏫", earned: false }
  ]

  const recommendations = [
    {
      type: "lecture",
      title: "Advanced Neural Networks",
      reason: "Based on your progress in ML Fundamentals",
      difficulty: "Intermediate",
      duration: "45 min",
      instructor: "Dr. Sarah Chen"
    },
    {
      type: "quiz",
      title: "Reinforcement Learning Quiz",
      reason: "Complete this to strengthen your understanding",
      difficulty: "Medium",
      questions: 12
    },
    {
      type: "flashcard",
      title: "Deep Learning Terminology",
      reason: "Review key concepts you've studied",
      difficulty: "Easy",
      cards: 25
    }
  ]

  const teacherRecommendations = [
    {
      type: "lecture",
      title: "Interactive Teaching Methods",
      reason: "Improve student engagement in your lectures",
      difficulty: "Beginner",
      duration: "30 min",
      instructor: "Teaching Excellence"
    },
    {
      type: "course",
      title: "Advanced Course Design",
      reason: "Create more effective learning paths",
      difficulty: "Intermediate",
      duration: "60 min",
      instructor: "Curriculum Development"
    },
    {
      type: "analytics",
      title: "Student Performance Insights",
      reason: "Track and improve student outcomes",
      difficulty: "Beginner",
      duration: "45 min",
      instructor: "Data Analytics"
    }
  ]

  const recentActivities = [
    { type: "lecture", title: "Completed: Introduction to CNNs", time: "2 hours ago", icon: PlayCircle },
    { type: "quiz", title: "Scored 92% on Linear Algebra Quiz", time: "1 day ago", icon: Trophy },
    { type: "flashcard", title: "Reviewed 15 flashcards", time: "1 day ago", icon: BookOpen },
    { type: "achievement", title: "Earned 'Quick Learner' badge", time: "2 days ago", icon: Award }
  ]

  const teacherActivities = [
    { type: "lecture", title: "Conducted: Machine Learning Basics", time: "2 hours ago", icon: Video },
    { type: "course", title: "Created: Advanced AI Course", time: "1 day ago", icon: BookOpen },
    { type: "student", title: "Helped 15 students with questions", time: "1 day ago", icon: Users },
    { type: "achievement", title: "Earned 'Engaging Educator' badge", time: "2 days ago", icon: Award }
  ]

  const todaySchedule = [
    { time: "10:00 AM", title: "ML Algorithms Lecture", type: "live", duration: "60 min" },
    { time: "2:00 PM", title: "Neural Networks Quiz", type: "quiz", duration: "30 min" },
    { time: "4:00 PM", title: "Study Group Session", type: "group", duration: "90 min" }
  ]

  const teacherSchedule = [
    { time: "10:00 AM", title: "ML Algorithms Lecture", type: "teach", duration: "60 min", students: 25 },
    { time: "2:00 PM", title: "Office Hours", type: "support", duration: "60 min", students: 8 },
    { time: "4:00 PM", title: "Course Planning", type: "planning", duration: "90 min", students: 0 }
  ]

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Welcome back, {user?.first_name || 'User'}!</h1>
              <p className="text-muted-foreground text-lg">
                {isLecturer 
                  ? "Manage your courses and engage with students" 
                  : "Continue your AI-powered learning journey"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {isLecturer ? (
              <>
                <button className="asklepios-card p-6 text-center hover:scale-105 transition-all duration-200">
                  <Video className="h-8 w-8 text-primary-500 mx-auto mb-3" />
                  <span className="text-sm font-medium text-foreground">Start Lecture</span>
                </button>
                <button className="asklepios-card p-6 text-center hover:scale-105 transition-all duration-200">
                  <PlusCircle className="h-8 w-8 text-secondary-500 mx-auto mb-3" />
                  <span className="text-sm font-medium text-foreground">Create Course</span>
                </button>
                <button className="asklepios-card p-6 text-center hover:scale-105 transition-all duration-200">
                  <Users className="h-8 w-8 text-success-500 mx-auto mb-3" />
                  <span className="text-sm font-medium text-foreground">View Students</span>
                </button>
                <button className="asklepios-card p-6 text-center hover:scale-105 transition-all duration-200">
                  <BarChart3 className="h-8 w-8 text-warning-500 mx-auto mb-3" />
                  <span className="text-sm font-medium text-foreground">Analytics</span>
                </button>
              </>
            ) : (
              <>
                <button className="asklepios-card p-6 text-center hover:scale-105 transition-all duration-200">
                  <PlayCircle className="h-8 w-8 text-primary-500 mx-auto mb-3" />
                  <span className="text-sm font-medium text-foreground">Continue Learning</span>
                </button>
                <button 
                  className="asklepios-card p-6 text-center hover:scale-105 transition-all duration-200"
                  onClick={() => navigate('/my-courses')}
                >
                  <BookOpen className="h-8 w-8 text-secondary-500 mx-auto mb-3" />
                  <span className="text-sm font-medium text-foreground">My Courses</span>
                </button>
                <button 
                  className="asklepios-card p-6 text-center hover:scale-105 transition-all duration-200"
                  onClick={() => navigate('/quizzes')}
                >
                  <PlusCircle className="h-8 w-8 text-success-500 mx-auto mb-3" />
                  <span className="text-sm font-medium text-foreground">Create Quiz</span>
                </button>
                <button 
                  className="asklepios-card p-6 text-center hover:scale-105 transition-all duration-200"
                  onClick={() => navigate('/summaries')}
                >
                  <BookMarked className="h-8 w-8 text-warning-500 mx-auto mb-3" />
                  <span className="text-sm font-medium text-foreground">Study Notes</span>
                </button>
                <button 
                  className="asklepios-card p-6 text-center hover:scale-105 transition-all duration-200"
                  onClick={() => navigate('/flashcards')}
                >
                  <BookOpen className="h-8 w-8 text-destructive-500 mx-auto mb-3" />
                  <span className="text-sm font-medium text-foreground">Review Flashcards</span>
                </button>
                <button className="asklepios-card p-6 text-center hover:scale-105 transition-all duration-200">
                  <Users className="h-8 w-8 text-destructive-500 mx-auto mb-3" />
                  <span className="text-sm font-medium text-foreground">Join Study Group</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Learning Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLecturer ? (
              <>
                <ActivityStatsCard 
                  value={stats?.lecturesConducted || 18} 
                  change={5} 
                  title="Lectures Conducted" 
                />
                <StudentStatsCard 
                  value={stats?.activeStudents || 156} 
                  change={12} 
                  title="Active Students" 
                />
                <CourseStatsCard 
                  value={stats?.coursesCreated || 8} 
                  change={2} 
                  title="Courses Created" 
                />
                <ProgressStatsCard 
                  value={Math.round((stats?.averageRating || 4.8) * 20)} 
                  change={4} 
                  title="Average Rating" 
                />
              </>
            ) : (
              <>
                <ActivityStatsCard 
                  value={loadingStats ? 0 : stats?.lectures_attended ?? 0} 
                  change={12} 
                  title="Lectures Attended" 
                />
                <StudentStatsCard 
                  value={loadingStats ? 0 : stats?.flashcards_reviewed ?? 0} 
                  change={8} 
                  title="Flashcards Reviewed" 
                />
                <ProgressStatsCard 
                  value={loadingStats ? 0 : stats?.quiz_average !== undefined ? Math.round(stats.quiz_average * 100) : 0} 
                  change={4} 
                  title="Quiz Average" 
                />
                <ActivityStatsCard 
                  value={loadingStats ? 0 : stats?.learning_streak ?? 0} 
                  change={0} 
                  title="Learning Streak (days)" 
                />
              </>
            )}
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="my-courses">My Courses</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Lectures */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isLecturer ? <Video className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                    {isLecturer ? "Recent Lectures" : "Recent Lectures"}
                  </CardTitle>
                  <CardDescription>
                    {isLecturer ? "Your recent teaching sessions" : "Continue watching your recent lectures"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: "Introduction to Machine Learning", progress: 75, duration: "45 min", status: "In Progress" },
                    { title: "Deep Learning Fundamentals", progress: 100, duration: "60 min", status: "Completed" },
                    { title: "Neural Networks Architecture", progress: 30, duration: "55 min", status: "Started" }
                  ].map((lecture) => (
                    <div key={lecture.title} className="asklepios-card p-4 hover:scale-105 transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            lecture.status === "Completed" ? "bg-success-100" : 
                            lecture.status === "In Progress" ? "bg-warning-100" : "bg-primary-100"
                          }`}>
                            <PlayCircle className={`h-5 w-5 ${
                              lecture.status === "Completed" ? "text-success-600" : 
                              lecture.status === "In Progress" ? "text-warning-600" : "text-primary-600"
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{lecture.title}</p>
                            <p className="text-xs text-muted-foreground">{lecture.duration}</p>
                          </div>
                        </div>
                        <Badge className={
                          lecture.status === "Completed" ? "asklepios-badge-success" :
                          lecture.status === "In Progress" ? "asklepios-badge-warning" :
                          "asklepios-badge bg-primary-100 text-primary-700"
                        }>
                          {lecture.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{lecture.progress}%</span>
                        </div>
                        <div className="asklepios-progress">
                          <div 
                            className="asklepios-progress-fill" 
                            style={{ width: `${lecture.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Personalized Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {isLecturer ? "Teaching Insights" : "Recommended for You"}
                  </CardTitle>
                  <CardDescription>
                    {isLecturer ? "Improve your teaching effectiveness" : "AI-powered learning suggestions"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(isLecturer ? teacherRecommendations : recommendations)
                    .filter(item => !(isLecturer && item.type === 'flashcard'))
                    .map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {item.type === 'lecture' && <PlayCircle className="h-4 w-4 text-blue-500" />}
                          {!isLecturer && item.type === 'quiz' && <Brain className="h-4 w-4 text-purple-500" />}
                          {!isLecturer && item.type === 'flashcard' && <BookOpen className="h-4 w-4 text-green-500" />}
                          {item.type === 'course' && <BookOpen className="h-4 w-4 text-blue-500" />}
                          {item.type === 'analytics' && <BarChart3 className="h-4 w-4 text-purple-500" />}
                          <h4 className="font-medium text-sm">{item.title}</h4>
                        </div>
                        <Badge variant="outline" className="text-xs">{item.difficulty}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{item.reason}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {item.duration || (!isLecturer && (item as any).questions && `${(item as any).questions} questions`) || (!isLecturer && (item as any).cards && `${(item as any).cards} cards`)}
                        </span>
                        <Button size="sm" variant="outline">Start</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(isLecturer ? teacherActivities : recentActivities).map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
                      <div className="flex-shrink-0">
                        <activity.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Courses Tab - Only for Students */}
          <TabsContent value="my-courses" className="space-y-6">
            {!isLecturer ? (
              <div className="space-y-6">
                {/* Enrolled Courses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      My Enrolled Courses
                    </CardTitle>
                    <CardDescription>Access your enrolled courses and learning materials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MyEnrolledCourses />
                  </CardContent>
                </Card>

                {/* Course Progress Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Course Progress Overview
                    </CardTitle>
                    <CardDescription>Track your progress across all enrolled courses</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { title: "Machine Learning Fundamentals", progress: 75, lectures: 12, completed: 9, nextLecture: "Neural Networks" },
                      { title: "Data Science Essentials", progress: 45, lectures: 15, completed: 7, nextLecture: "Data Visualization" },
                      { title: "Python Programming", progress: 90, lectures: 10, completed: 9, nextLecture: "Final Project" }
                    ].map((course) => (
                      <div key={course.title} className="asklepios-card p-4 hover:scale-105 transition-all duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{course.title}</h3>
                          <Badge variant="outline">{course.progress}% Complete</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{course.completed}/{course.lectures} lectures completed</span>
                            <span>Next: {course.nextLecture}</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => navigate('/courses')}>
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Continue Learning
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate('/course-documents')}>
                            <BookOpen className="h-4 w-4 mr-1" />
                            View Materials
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Course Activities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Course Activities
                    </CardTitle>
                    <CardDescription>Your latest learning activities</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { course: "Machine Learning", activity: "Completed Lecture 5: Neural Networks", time: "2 hours ago", type: "lecture" },
                      { course: "Data Science", activity: "Submitted Assignment 3", time: "1 day ago", type: "assignment" },
                      { course: "Python Programming", activity: "Took Quiz 2 - Scored 92%", time: "2 days ago", type: "quiz" },
                      { course: "Machine Learning", activity: "Downloaded Course Materials", time: "3 days ago", type: "material" }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'lecture' ? 'bg-blue-100' :
                          activity.type === 'assignment' ? 'bg-green-100' :
                          activity.type === 'quiz' ? 'bg-yellow-100' : 'bg-purple-100'
                        }`}>
                          {activity.type === 'lecture' ? <PlayCircle className="h-4 w-4" /> :
                           activity.type === 'assignment' ? <CheckCircle className="h-4 w-4" /> :
                           activity.type === 'quiz' ? <Trophy className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.activity}</p>
                          <p className="text-xs text-muted-foreground">{activity.course} • {activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">My Courses</h3>
                <p className="text-muted-foreground mb-4">This section is for students to view their enrolled courses.</p>
                <Button onClick={() => navigate('/teacher-courses')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage My Courses
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Progress Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {isLecturer ? "Weekly Teaching Hours" : "Weekly Learning Hours"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loadingWeekly ? (
                      <div>Loading...</div>
                    ) : (
                      weeklyProgress.map((day) => (
                        <div key={day.day} className="flex items-center gap-4">
                          <span className="text-sm font-medium w-8">{day.day}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">{day.hours}h</span>
                              <span className="text-xs text-gray-600">{day.completed} completed</span>
                            </div>
                            <Progress value={Math.min((day.hours / 4) * 100, 100)} className="h-2" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Subject Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>{isLecturer ? "Course Performance" : "Subject Mastery"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(isLecturer ? [
                    { subject: "Machine Learning", progress: 85, level: "High Engagement" },
                    { subject: "Deep Learning", progress: 72, level: "Good Performance" },
                    { subject: "Data Science", progress: 91, level: "Excellent" },
                    { subject: "Statistics", progress: 65, level: "Needs Attention" }
                  ] : [
                    { subject: "Machine Learning", progress: 85, level: "Advanced" },
                    { subject: "Deep Learning", progress: 72, level: "Intermediate" },
                    { subject: "Data Science", progress: 91, level: "Expert" },
                    { subject: "Statistics", progress: 65, level: "Intermediate" }
                  ]).map((item) => (
                    <div key={item.subject} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.subject}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{item.level}</Badge>
                          <span className="text-sm text-gray-600">{item.progress}%</span>
                        </div>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today's Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(isLecturer ? teacherSchedule : todaySchedule).map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="text-center">
                        <div className="text-sm font-medium">{item.time.split(' ')[0]}</div>
                        <div className="text-xs text-gray-500">{item.time.split(' ')[1]}</div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-gray-600">{item.duration}</p>
                        {isLecturer && (item as any).students > 0 && (
                          <p className="text-xs text-blue-600">{(item as any).students} students</p>
                        )}
                      </div>
                      <Badge variant={item.type === 'live' || item.type === 'teach' ? 'destructive' : 'outline'}>
                        {item.type}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Upcoming Quizzes - Only for Students */}
              {!isLecturer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Upcoming Quizzes
                  </CardTitle>
                  <CardDescription>Prepare for your upcoming assessments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: "ML Algorithms Quiz", dueDate: "Tomorrow", questions: 15, difficulty: "Medium" },
                    { title: "Neural Networks Assessment", dueDate: "In 3 days", questions: 20, difficulty: "Hard" },
                    { title: "Data Preprocessing Quiz", dueDate: "Next week", questions: 10, difficulty: "Easy" }
                  ].map((quiz) => (
                    <div key={quiz.title} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {quiz.questions} questions • Due {quiz.dueDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{quiz.difficulty}</Badge>
                        <Button size="sm" variant="outline">Prepare</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              )}

              {/* Student Engagement - Only for Teachers */}
              {isLecturer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Student Engagement
                    </CardTitle>
                    <CardDescription>Monitor your students' activity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: "Machine Learning 101", students: 45, active: 38, engagement: 84 },
                      { name: "Deep Learning Basics", students: 32, active: 28, engagement: 88 },
                      { name: "Data Science Intro", students: 28, active: 22, engagement: 79 }
                    ].map((course) => (
                      <div key={course.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{course.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.active}/{course.students} active students
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{course.engagement}%</Badge>
                          <Button size="sm" variant="outline">View Details</Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(isLecturer ? teacherAchievements : achievements).map((achievement) => (
                <Card key={achievement.id} className={`relative ${achievement.earned ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50'}`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{achievement.icon}</div>
                    <h3 className="font-semibold mb-2">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                    {achievement.earned ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Earned
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Target className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Goals Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {isLecturer ? "Teaching Goals" : "Learning Goals"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(isLecturer ? [
                  { goal: "Conduct 10 lectures this month", progress: 60, current: 6, target: 10 },
                  { goal: "Maintain 4.5+ average rating", progress: 90, current: 4.6, target: 4.5 },
                  { goal: "Help 50+ students with questions", progress: 80, current: 40, target: 50 }
                ] : [
                  { goal: "Complete 5 lectures this week", progress: 60, current: 3, target: 5 },
                  { goal: "Maintain 14-day learning streak", progress: 85, current: 12, target: 14 },
                  { goal: "Score 90%+ on next quiz", progress: 0, current: 0, target: 1 }
                ]).map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.goal}</span>
                      <span className="text-sm text-gray-600">{item.current}/{item.target}</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

export default Dashboard