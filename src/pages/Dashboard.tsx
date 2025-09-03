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
import { LoaderOne } from "@/components/ui/loader"
import DotGrid from "@/Backgrounds/DotGrid/DotGrid"
import TextType from "@/TextAnimations/TextType/TextType"
import GlassIcons from "@/components/GlassIcons/GlassIcons"
import { 
  FiPlay, FiBook, FiHelpCircle, FiFileText, FiBookmark, FiUsers,
  FiVideo, FiPlus, FiBarChart2, FiMessageSquare, FiSettings
} from 'react-icons/fi'
import {
  H1, H2, H3, H4, H5, H6,
  LargeText, MediumText, NormalText, SmallText,
  Button as DSButton,
  Progress as DSProgress,
  Badge as DSBadge,
  Card as DSCard
} from "@/components/ui/design-system"
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
  Droplets,
  Leaf,
  Fuel,
  Mountain,
  Zap,
  GraduationCap,
  Video,
  Mic,
  Eye,
  User,
  Trash2,
  Home,
  Settings,
  Bell,
  Search,
  FileText,
  MessageSquare,
  Heart,
  Share2,
  Download,
  Upload,
  Edit,
  MoreHorizontal,
  Filter,
  RefreshCw,
  ExternalLink,
  Lock,
  Unlock,
  Shield,
  HelpCircle,
  Info,
  Lightbulb,
  Sparkles,
  Gift,
  Crown,
  Medal,
  BadgeCheck,
  Timer,
  Pause,
  SkipForward,
  Rewind,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Grid,
  List,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowDownLeft,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Computer,
  Server,
  Database,
  Cloud,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  Power,
  Sun,
  Moon,
  Activity,
  HeartOff,
  ActivitySquare,
  TrendingDown,
  Minus,
  Plus,
  Equal,
  Percent,
  Hash,
  AtSign,
  DollarSign,
  CreditCard,
  Wallet,
  Receipt,
  ShoppingCart,
  Package,
  Truck,
  Store,
  Building,
  Building2,
  Hotel,
  School,
  University,
  Hospital,
  Church,
  Castle,
  Factory,
  Warehouse,
  House,
  Tent,
  Dam,
  Wind
} from "lucide-react"
import { toast } from "react-hot-toast"
import { 
  CourseStatsCard, 
  StudentStatsCard, 
  ProgressStatsCard, 
  ActivityStatsCard 
} from "@/components/StatsCard"
import { MyEnrolledCourses } from "@/components/MyEnrolledCourses"
import { DashboardMyCourses } from "@/components/DashboardMyCourses"
import { useRecentLectures } from "@/hooks/useRecentLectures"
import { useCourseProgress } from "@/hooks/useCourseProgress"
import { useQuizStats } from "@/hooks/useQuizStats"
import { useScheduledStreams } from "@/hooks/useScheduledStreams"
import { apiClient, StudentProgress } from "@/lib/api"

const Dashboard = () => {
  const { user, hasRole, updateUser } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(user?.stats || null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(false)
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
  
  // Fetch recent lectures
  const { lectures: recentLectures, loading: loadingLectures } = useRecentLectures(3);
  
  // Fetch course progress
  const { courseProgress, loading: loadingCourseProgress } = useCourseProgress();
  
  // Fetch quiz statistics
  const { quizStats, recentSessions: quizSessions, loading: loadingQuizStats } = useQuizStats();
  
  // Fetch scheduled streams
  const { scheduledStreams, loading: loadingStreams } = useScheduledStreams();

  // Fetch stats on load and when user changes - with delay for fresh logins
  useEffect(() => {
    const loadStats = async () => {
      if (!user || statsLoadedRef.current) return;
      statsLoadedRef.current = true;
      setLoadingStats(true);
      
      // Add delay for fresh logins to let auth stabilize
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const tokenAge = (Date.now() / 1000) - payload.iat;
          
          // If token is very fresh (< 5 seconds), add a delay
          if (tokenAge < 5) {
            console.log('Fresh login detected, delaying API calls...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (e) {
          // Ignore token parsing errors
        }
      }
      
      try {
        console.log('Loading user stats...');
        const response = await apiClient.getUserStats();
        if (response.data) {
          setStats(response.data);
          console.log('User stats loaded successfully');
        } else {
          console.warn('Failed to load user stats:', response.error);
        }
      } catch (e) {
        console.error('Error loading stats:', e);
      }
      setLoadingStats(false);

      // Load student progress for students
      if (user?.role === 'student') {
        setLoadingProgress(true);
        try {
          console.log('Loading student progress...');
          const progressResponse = await apiClient.getStudentProgress();
          if (progressResponse.data) {
            setStudentProgress(progressResponse.data);
            console.log('Student progress loaded successfully');
          } else {
            console.warn('Failed to load student progress:', progressResponse.error);
          }
        } catch (e) {
          console.error('Error loading student progress:', e);
        }
        setLoadingProgress(false);
      }
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
      
      // Add same delay logic for weekly progress
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const tokenAge = (Date.now() / 1000) - payload.iat;
          
          if (tokenAge < 5) {
            console.log('Fresh login detected, delaying weekly progress API calls...');
            await new Promise(resolve => setTimeout(resolve, 2500)); // Slightly longer delay
          }
        } catch (e) {
          // Ignore token parsing errors
        }
      }
      
      try {
        console.log('Loading weekly progress...');
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
  
  // Check if user is an admin
  const isAdmin = hasRole('admin') || hasRole('super_admin')

  // Mock data for analytics
  const achievements = [
    { id: 1, title: "Course Completion", description: "Complete 10 lectures", icon: <BookOpen className="h-6 w-6" />, earned: true },
    { id: 2, title: "Quiz Excellence", description: "Score 90%+ on 5 quizzes", icon: <Target className="h-6 w-6" />, earned: true },
    { id: 3, title: "Learning Consistency", description: "7-day learning streak", icon: <Calendar className="h-6 w-6" />, earned: true },
    { id: 4, title: "Subject Mastery", description: "Complete ML fundamentals", icon: <GraduationCap className="h-6 w-6" />, earned: false },
    { id: 5, title: "Study Dedication", description: "Review 500 flashcards", icon: <FileText className="h-6 w-6" />, earned: false }
  ]

  const teacherAchievements = [
    { id: 1, title: "Teaching Experience", description: "Conduct 20+ live lectures", icon: <Mic className="h-6 w-6" />, earned: true },
    { id: 2, title: "Course Development", description: "Create 5+ courses", icon: <BookOpen className="h-6 w-6" />, earned: true },
    { id: 3, title: "Student Recognition", description: "Maintain 4.5+ rating", icon: <Users className="h-6 w-6" />, earned: true },
    { id: 4, title: "Educational Innovation", description: "Use AI features in lectures", icon: <Settings className="h-6 w-6" />, earned: false },
    { id: 5, title: "Student Support", description: "Help 100+ students", icon: <MessageSquare className="h-6 w-6" />, earned: false }
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
    { type: "lecture", title: "Completed: Introduction to CNNs", time: "2 hours ago", icon: PlayCircle, color: "text-blue-500" },
    { type: "quiz", title: "Scored 92% on Linear Algebra Quiz", time: "1 day ago", icon: Brain, color: "text-purple-500" },
    { type: "flashcard", title: "Reviewed 15 flashcards", time: "1 day ago", icon: BookMarked, color: "text-green-500" },
    { type: "achievement", title: "Completed 'Course Completion' milestone", time: "2 days ago", icon: Award, color: "text-green-600" }
  ]

  const teacherActivities = [
    { type: "lecture", title: "Conducted: Machine Learning Basics", time: "2 hours ago", icon: Video, color: "text-blue-500" },
    { type: "course", title: "Created: Advanced AI Course", time: "1 day ago", icon: BookOpen, color: "text-green-500" },
    { type: "student", title: "Helped 15 students with questions", time: "1 day ago", icon: Users, color: "text-purple-500" },
    { type: "achievement", title: "Completed 'Teaching Experience' milestone", time: "2 days ago", icon: Award, color: "text-green-600" }
  ]

  // Helper function to format livestream data for schedule display
  const formatScheduleData = (streams: any[]) => {
    return streams.map(stream => {
      const scheduledTime = new Date(stream.scheduled_at);
      const now = new Date();
      
      // Format time display
      const timeString = scheduledTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      // Determine status/type
      let type = 'scheduled';
      let statusText = 'Scheduled';
      
      if (stream.status === 'live') {
        type = 'live';
        statusText = 'Live Now';
      } else if (stream.status === 'scheduled') {
        const timeDiff = scheduledTime.getTime() - now.getTime();
        if (timeDiff <= 0) {
          type = 'starting';
          statusText = 'Starting Soon';
        } else if (timeDiff <= 30 * 60 * 1000) { // 30 minutes
          type = 'soon';
          statusText = 'Starting Soon';
        }
      }
      
      return {
        id: stream.id,
        time: timeString,
        date: scheduledTime.toDateString(),
        title: stream.title,
        course: stream.course_name,
        instructor: stream.instructor_name,
        type: type,
        status: statusText,
        duration: stream.duration ? `${Math.round(stream.duration / 60)} min` : 'TBD',
        scheduled_at: stream.scheduled_at,
        stream_id: stream.id,
        viewer_count: stream.viewer_count,
        isToday: scheduledTime.toDateString() === now.toDateString()
      };
    });
  };

  // Get today's and upcoming schedule from real data
  const scheduleData = formatScheduleData(scheduledStreams);
  const todaySchedule = scheduleData.filter(item => item.isToday);
  const upcomingSchedule = scheduleData.filter(item => !item.isToday).slice(0, 3);

  return (
    <Layout>

      
              <div className="min-h-screen bg-surface-900 px-6 pb-6 space-y-6 relative overflow-hidden" style={{backgroundColor: 'var(--surface-900)'}}>
          <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 0 }}>
            <DotGrid
              dotSize={9}
              gap={31}
              proximity={120}
              shockRadius={160}
              shockStrength={5}
              resistance={750}
              returnDuration={1.5}
            />
          </div>
        <div className="relative z-20 pt-4">
                {/* Enhanced Welcome Section */}
        <div className="mb-8 text-center relative">
                      {/* Sophisticated breadcrumb with background */}
            <div className="mb-6 inline-block">
            </div>
            
            <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div>
              <div 
                className={`relative p-6 shadow-2xl ${!isAdmin && !isLecturer ? 'rounded-full' : 'rounded-3xl'} backdrop-blur-sm border border-white/20`}
                style={isAdmin || isLecturer ? {
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8, #1e40af)'
                } : {
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                }}
              >
              {isAdmin ? (
                <Shield className="h-12 w-12 text-white" />
              ) : isLecturer ? (
                <BookOpen className="h-12 w-12 text-white" />
              ) : (
                <GraduationCap className="h-12 w-12 text-white" />
              )}
              </div>
            </div>
          </div>
          <div className="max-w-3xl mx-auto relative">
            {/* Subtle background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-3xl blur-3xl"></div>
            <div className="relative bg-black/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h1 className="text-4xl font-bold text-white mb-4 tracking-tight leading-tight">
                <TextType 
                  text={[
                    `Welcome back, ${user?.first_name || 'User'}!`,
                    `Hello, ${user?.first_name || 'User'}!`,
                    `Great to see you, ${user?.first_name || 'User'}!`,
                    `Welcome home, ${user?.first_name || 'User'}!`
                  ]}
                  typingSpeed={75}
                  pauseDuration={1500}
                  showCursor={true}
                  cursorCharacter="|"
                  className="text-white"
                  loop={true}
                />
              </h1>
              <div className="text-lg font-medium text-white/80 leading-relaxed mt-3">
                <TextType 
                  text={[
                    isLecturer 
                  ? "Manage your courses and engage with students" 
                      : "Continue your AI-powered learning journey",
                    isLecturer 
                      ? "Inspire the next generation of learners"
                      : "Discover new knowledge and skills",
                    isLecturer 
                      ? "Share your expertise with eager minds"
                      : "Transform your learning experience",
                    isLecturer 
                      ? "Build meaningful connections with students"
                      : "Unlock your potential with AI-powered education"
                  ]}
                  typingSpeed={50}
                  pauseDuration={2000}
                  showCursor={true}
                  cursorCharacter="|"
                  className="text-white/80"
                  loop={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="mb-8 relative">
          {/* Ambient background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl blur-2xl"></div>
          
          {/* Quick Actions Header - Now at the top */}
          <div className="text-center mb-8 relative z-50">
            <div className="inline-block relative">
              {/* Enhanced glow effect */}
              <div className="absolute inset-0 bg-white/20 rounded-3xl blur-lg"></div>
              <div className="relative bg-gradient-to-r from-white via-blue-50 to-white backdrop-blur-md rounded-3xl px-8 py-4 border border-blue-300/50 shadow-2xl">
                <h3 
                  className="text-gray-800 flex items-center justify-center gap-3 text-2xl font-bold"
                  style={{
                    fontFamily: "'Roboto Slab', serif",
                    fontWeight: 700,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="bg-blue-600 p-2 rounded-xl">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
            Quick Actions
                  <span className="text-xs text-blue-700 ml-3 bg-blue-100 px-3 py-1.5 rounded-full font-semibold border border-blue-200">Navigate</span>
                </h3>
              </div>
            </div>
          </div>
          
          <div 
            className="relative z-20"
            style={{ height: '200px', position: 'relative', zIndex: 10 }}
            onClick={(e) => {
              // Handle navigation based on clicked element
              const target = (e.target as Element).closest('.icon-btn');
              if (!target) return;
              
              const label = target.querySelector('.icon-btn__label')?.textContent;
              
              switch(label) {
                case 'Start Lecture':
                  navigate('/livestream/create');
                  break;
                case 'Create Course':
                  navigate('/teacher-courses');
                  break;
                case 'View Students':
                  navigate('/teacher-courses');
                  break;
                case 'Analytics':
                  navigate('/admin');
                  break;
                case 'Messages':
                  navigate('/chatbot');
                  break;
                case 'Settings':
                  navigate('/settings');
                  break;
                case 'Continue':
                case 'My Courses':
                  navigate('/my-courses');
                  break;
                case 'Take Quiz':
                  navigate('/quiz');
                  break;
                case 'Study Notes':
                  navigate('/summaries');
                  break;
                case 'Flashcards':
                  navigate('/flashcards');
                  break;
                case 'Study Group':
                  console.log('Study Group feature coming soon!');
                  break;
                default:
                  break;
              }
            }}
          >
            <GlassIcons 
              items={isLecturer ? [
                { icon: <FiVideo />, color: 'purple', label: 'Start Lecture' },
                { icon: <FiPlus />, color: 'blue', label: 'Create Course' },
                { icon: <FiUsers />, color: 'green', label: 'View Students' },
                { icon: <FiBarChart2 />, color: 'orange', label: 'Analytics' },
                { icon: <FiMessageSquare />, color: 'indigo', label: 'Messages' },
                { icon: <FiSettings />, color: 'red', label: 'Settings' },
              ] : [
                { icon: <FiPlay />, color: 'purple', label: 'Continue' },
                { icon: <FiBook />, color: 'blue', label: 'My Courses' },
                { icon: <FiHelpCircle />, color: 'green', label: 'Take Quiz' },
                { icon: <FiFileText />, color: 'orange', label: 'Study Notes' },
                { icon: <FiBookmark />, color: 'indigo', label: 'Flashcards' },
                { icon: <FiUsers />, color: 'red', label: 'Study Group' },
              ]}
              className="max-w-6xl mx-auto"
            />
          </div>
        </div>

        {/* Learning Statistics - Unified Section */}
        <div className="mb-8">
          <div className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-white via-blue-50 to-white backdrop-blur-md px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-white/20">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                <div className="bg-blue-600 p-2 rounded-xl">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="text-gray-800 text-lg sm:text-xl font-bold text-center sm:text-left"
                    style={{
                      fontFamily: "'Roboto Slab', serif",
                      fontWeight: 700,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
            Learning Statistics
                </h3>
                <span className="text-xs text-blue-700 bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold border border-blue-200">Analytics</span>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="p-4 sm:p-6 md:p-8 bg-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {isLecturer ? (
              <>
                  <div className="text-center p-4 bg-white/30 rounded-xl border border-white/40">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3">
                      {stats?.lecturesConducted || 18}
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-medium text-gray-800 mb-1 sm:mb-2">Lectures Conducted</div>
                    <div className="text-xs sm:text-sm text-green-600 flex items-center justify-center gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      <span className="hidden sm:inline">+5 this week</span>
                      <span className="sm:hidden">+5</span>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white/30 rounded-xl border border-white/40">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3">
                      {stats?.activeStudents || 156}
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-medium text-gray-800 mb-1 sm:mb-2">Active Students</div>
                    <div className="text-xs sm:text-sm text-green-600 flex items-center justify-center gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      <span className="hidden sm:inline">+12 this month</span>
                      <span className="sm:hidden">+12</span>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white/30 rounded-xl border border-white/40">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3">
                      {stats?.coursesCreated || 8}
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-medium text-gray-800 mb-1 sm:mb-2">Courses Created</div>
                    <div className="text-xs sm:text-sm text-green-600 flex items-center justify-center gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      <span className="hidden sm:inline">+2 this quarter</span>
                      <span className="sm:hidden">+2</span>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white/30 rounded-xl border border-white/40">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3">
                      {stats?.averageRating || 4.8}
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-medium text-gray-800 mb-1 sm:mb-2">Average Rating</div>
                    <div className="text-xs sm:text-sm text-green-600 flex items-center justify-center gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      <span className="hidden sm:inline">+0.2 improvement</span>
                      <span className="sm:hidden">+0.2</span>
                    </div>
                  </div>
              </>
            ) : (
              <>
                  <div className="text-center p-4 bg-white/30 rounded-xl border border-white/40">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3 drop-shadow-lg">
                      {loadingProgress ? 0 : studentProgress?.total_quizzes_taken ?? 0}
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 drop-shadow-md">Quizzes Completed</div>
                    <div className="text-xs sm:text-sm text-green-600 flex items-center justify-center gap-1 font-medium">
                      {studentProgress?.pass_rate !== undefined ? (
                        <>
                          <Trophy className="h-3 w-3" />
                          <span className="hidden sm:inline">{Math.round(studentProgress.pass_rate)}% pass rate</span>
                          <span className="sm:hidden">{Math.round(studentProgress.pass_rate)}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="h-3 w-3" />
                          <span className="hidden sm:inline">Keep it up!</span>
                          <span className="sm:hidden">Keep up!</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white/30 rounded-xl border border-white/40">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3 drop-shadow-lg">
                      {loadingProgress ? 0 : Math.round(studentProgress?.average_score ?? 0)}%
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 drop-shadow-md">Quiz Average</div>
                    <div className="text-xs sm:text-sm text-green-600 flex items-center justify-center gap-1 font-medium">
                      {studentProgress?.performance_trend === 'improving' && (
                        <>
                          <ArrowUpRight className="h-3 w-3" />
                          <span>Improving</span>
                        </>
                      )}
                      {studentProgress?.performance_trend === 'declining' && (
                        <>
                          <ArrowDownRight className="h-3 w-3 text-red-600" />
                          <span className="text-red-600 hidden sm:inline">Needs attention</span>
                          <span className="text-red-600 sm:hidden">Focus</span>
                        </>
                      )}
                      {studentProgress?.performance_trend === 'stable' && (
                        <>
                          <ArrowRight className="h-3 w-3" />
                          <span>Consistent</span>
                        </>
                      )}
                      {!studentProgress?.performance_trend && (
                        <span className="hidden sm:inline">+4% this month</span>
                      )}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white/30 rounded-xl border border-white/40">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3 drop-shadow-lg">
                      {loadingProgress ? 0 : Math.round((studentProgress?.accuracy_rate ?? 0))}%
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 drop-shadow-md">Accuracy Rate</div>
                    <div className="text-xs sm:text-sm text-green-600 flex items-center justify-center gap-1 font-medium">
                      <CheckCircle className="h-3 w-3" />
                      <span>{studentProgress?.correct_answers ?? 0}/{studentProgress?.total_questions_answered ?? 0}</span>
                      <span className="hidden sm:inline ml-1">correct</span>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white/30 rounded-xl border border-white/40">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3 drop-shadow-lg">
                      {loadingProgress ? 0 : studentProgress?.learning_streak ?? 0}
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 drop-shadow-md">Learning Streak</div>
                    <div className="text-xs sm:text-sm text-green-600 font-medium text-center">
                      {studentProgress?.longest_streak !== undefined && studentProgress.longest_streak > (studentProgress.learning_streak || 0) ? (
                        <span>Best: {studentProgress.longest_streak} days</span>
                      ) : (
                        <span className="hidden sm:inline">days in a row</span>
                      )}
                      <span className="sm:hidden">
                        {studentProgress?.learning_streak > 0 ? 'days' : 'Start today!'}
                      </span>
                    </div>
                  </div>
              </>
            )}
            </div>
          </div>
          </div>
        </div>

        {/* Enhanced Quiz Statistics - Only for Students */}
        {!isLecturer && (
          <div className="mb-8">
            <div className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-white via-purple-50 to-white backdrop-blur-md px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-white/20">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                  <div className="bg-purple-600 p-2 rounded-xl">
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h3 className="text-gray-800 text-lg sm:text-xl font-bold text-center sm:text-left"
                      style={{
                        fontFamily: "'Roboto Slab', serif",
                        fontWeight: 700,
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                    Enhanced Quiz Statistics
                  </h3>
                  <span className="text-xs text-purple-700 bg-purple-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold border border-purple-200">AI-Powered</span>
                </div>
              </div>
              
              {/* Content Section */}
              <div className="p-4 sm:p-6 md:p-8 bg-white/5">
                {loadingQuizStats ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center py-8 gap-2 sm:gap-4">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600"></div>
                    <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">Loading quiz statistics...</p>
                  </div>
                ) : quizStats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                    <div className="text-center p-4 bg-white/30 rounded-xl border border-white/40">
                      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3 drop-shadow-lg">
                        {quizStats.quiz_stats.total_quizzes}
                      </div>
                      <div className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 drop-shadow-md">AI Quizzes Taken</div>
                      <div className="text-xs sm:text-sm text-purple-600 flex items-center justify-center gap-1 font-medium">
                        <Brain className="h-3 w-3" />
                        <span className="truncate">
                          {quizStats.quiz_stats.favorite_topics.length > 0 
                            ? `Top: ${quizStats.quiz_stats.favorite_topics[0]}` 
                            : 'Keep going!'}
                        </span>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-white/30 rounded-xl border border-white/40">
                      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3 drop-shadow-lg">
                        {Math.round(quizStats.quiz_stats.overall_accuracy)}%
                      </div>
                      <div className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 drop-shadow-md">Overall Accuracy</div>
                      <div className="text-xs sm:text-sm text-green-600 flex items-center justify-center gap-1 font-medium">
                        <Target className="h-3 w-3" />
                        <span>{quizStats.quiz_stats.total_questions_correct}/{quizStats.quiz_stats.total_questions_attempted}</span>
                        <span className="hidden sm:inline ml-1">correct</span>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-white/30 rounded-xl border border-white/40">
                      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3 drop-shadow-lg">
                        {quizStats.total_qv_coins}
                      </div>
                      <div className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 drop-shadow-md">QV Coins</div>
                      <div className="text-xs sm:text-sm text-yellow-600 flex items-center justify-center gap-1 font-medium">
                        <Medal className="h-3 w-3" />
                        <span>Level {quizStats.level}</span>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-white/30 rounded-xl border border-white/40">
                      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3 drop-shadow-lg">
                        {quizStats.streak}
                      </div>
                      <div className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 drop-shadow-md">Quiz Streak</div>
                      <div className="text-xs sm:text-sm text-orange-600 flex items-center justify-center gap-1 font-medium">
                        <Flame className="h-3 w-3" />
                        <span>{quizStats.streak > 0 ? 'On fire!' : 'Take a quiz!'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Quiz Data Yet</h3>
                    <p className="text-gray-600 mb-4">Start taking AI-powered quizzes to see your statistics!</p>
                    <Button onClick={() => navigate('/quiz')} className="bg-purple-600 hover:bg-purple-700">
                      <Brain className="h-4 w-4 mr-2" />
                      Take Your First Quiz
                    </Button>
                  </div>
                )}

                {/* Recent Quiz Performance */}
                {quizStats && quizStats.quiz_stats.recent_performance.length > 0 && (
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center justify-center sm:justify-start gap-2">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      Recent Quiz Performance
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {quizStats.quiz_stats.recent_performance.slice(0, 3).map((perf, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm text-gray-800 truncate">{perf.topic}</h5>
                            <Badge className={`${
                              perf.percentage >= 80 ? 'bg-green-100 text-green-800' :
                              perf.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {perf.percentage.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            {perf.score}/{perf.total} questions correct
                          </div>
                          <Progress value={perf.percentage} className="h-2" />
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(perf.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Favorite Topics */}
                {quizStats && quizStats.quiz_stats.favorite_topics.length > 0 && (
                  <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center justify-center sm:justify-start gap-2">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                      Your Favorite Topics
                    </h4>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      {quizStats.quiz_stats.favorite_topics.slice(0, 6).map((topic, index) => (
                        <Badge 
                          key={index}
                          className="bg-blue-100 text-blue-800 border-blue-300 cursor-pointer hover:bg-blue-200 transition-colors"
                          onClick={() => navigate(`/quiz?topic=${encodeURIComponent(topic)}`)}
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Main Content Tabs */}
        <div className="relative mb-8">
          {/* Ambient glow for tabs */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-2xl blur-xl"></div>
          <Tabs defaultValue="overview" className="w-full relative z-30">
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 rounded-2xl blur-sm"></div>
              <TabsList 
                role="tablist" 
                aria-orientation="horizontal" 
                className="h-14 items-center justify-center text-muted-foreground relative grid w-full grid-cols-5 z-40 bg-white/95 backdrop-blur-sm border border-white/30 rounded-2xl p-1 shadow-xl gap-1"
              >
                <TabsTrigger value="overview" className="flex items-center justify-center gap-2 text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 transition-all duration-300 rounded-xl font-semibold px-3 py-2 text-sm">
                  <House className="h-4 w-4" />
              Overview
            </TabsTrigger>
                <TabsTrigger value="my-courses" className="flex items-center justify-center gap-2 text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 transition-all duration-300 rounded-xl font-semibold px-3 py-2 text-sm">
              <BookOpen className="h-4 w-4" />
              My Courses
            </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center justify-center gap-2 text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 transition-all duration-300 rounded-xl font-semibold px-3 py-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Progress
            </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center justify-center gap-2 text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 transition-all duration-300 rounded-xl font-semibold px-3 py-2 text-sm">
              <Calendar className="h-4 w-4" />
              Schedule
            </TabsTrigger>
                <TabsTrigger value="achievements" className="flex items-center justify-center gap-2 text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 transition-all duration-300 rounded-xl font-semibold px-3 py-2 text-sm">
              <Trophy className="h-4 w-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 relative z-30">
            <div className={`grid gap-6 ${!isLecturer ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
              {/* Recent Lectures */}
              <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 hover:bg-white/98">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-gray-800 font-bold">
                        {isLecturer ? <Video className="h-5 w-5 text-blue-600" /> : <PlayCircle className="h-5 w-5 text-blue-600" />}
                        {isLecturer ? "Recent Lectures" : "Recent Lectures"}
                      </CardTitle>
                      <CardDescription className="text-gray-600 font-medium">
                        {isLecturer ? "Your recent teaching sessions" : "Continue watching your recent lectures"}
                      </CardDescription>
                    </div>
                    {recentLectures.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!confirm('Are you sure you want to clear all your ended streams? This action cannot be undone.')) {
                            return;
                          }
                          try {
                            const response = await apiClient.clearMyEndedStreams();
                            toast.success((response.data && typeof response.data === 'object' && 'message' in response.data ? response.data.message : 'Ended streams cleared successfully') as string);
                            // Refresh the recent lectures
                            window.location.reload();
                          } catch (error: any) {
                            const errorMessage = error.response?.data?.detail || 'Failed to clear ended streams';
                            toast.error(errorMessage);
                            console.error('Error clearing ended streams:', error);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear Ended
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingLectures ? (
                    <div className="flex items-center justify-center py-8">
                      <LoaderOne size="lg" />
                    </div>
                  ) : recentLectures.length === 0 ? (
                    <div className="text-center py-8">
                      <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {isLecturer ? "No recent lectures conducted yet" : "No recent lectures attended yet"}
                      </p>
                    </div>
                  ) : (
                    recentLectures.map((lecture) => {
                      // Calculate duration from ended_at and created_at
                      const duration = lecture.duration || 
                        (lecture.ended_at && lecture.created_at ? 
                          Math.round((new Date(lecture.ended_at).getTime() - new Date(lecture.created_at).getTime()) / 60000) : 
                          null);
                      
                      // Determine status based on lecture data
                      const status = lecture.status === "ended" ? "Completed" : 
                                   lecture.status === "live" ? "In Progress" : "Started";
                      
                      // Mock progress for now (in real implementation, this would come from user progress tracking)
                      const progress = status === "Completed" ? 100 : 
                                    status === "In Progress" ? 75 : 30;
                      
                      return (
                        <div key={lecture.id} className="asklepios-card p-4 hover:scale-105 transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                status === "Completed" ? "bg-success-100" : 
                                status === "In Progress" ? "bg-warning-100" : "bg-primary-100"
                              }`}>
                                <PlayCircle className={`h-5 w-5 ${
                                  status === "Completed" ? "text-success-600" : 
                                  status === "In Progress" ? "text-warning-600" : "text-primary-600"
                                }`} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{lecture.title}</p>
                                <p className="text-xs text-gray-600">
                                  {duration ? `${duration} min` : "Duration unavailable"}
                                </p>
                              </div>
                            </div>
                            <Badge className={
                              status === "Completed" ? "asklepios-badge-success" :
                              status === "In Progress" ? "asklepios-badge-warning" :
                              "asklepios-badge bg-primary-100 text-primary-700"
                            }>
                              {status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="asklepios-progress">
                              <div 
                                className="asklepios-progress-fill" 
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Recent Quiz Sessions - Only for Students */}
              {!isLecturer && (
                <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 hover:bg-white/98">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-gray-800 font-bold">
                          <Brain className="h-5 w-5 text-purple-600" />
                          Recent Quiz Sessions
                        </CardTitle>
                        <CardDescription className="text-gray-600 font-medium">
                          Your latest AI-powered quiz attempts
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loadingQuizStats ? (
                      <div className="flex items-center justify-center py-8">
                        <LoaderOne size="lg" />
                      </div>
                    ) : quizSessions.length === 0 ? (
                      <div className="text-center py-8">
                        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No quiz sessions yet</p>
                        <Button onClick={() => navigate('/quiz')} size="sm">
                          <Brain className="h-4 w-4 mr-2" />
                          Start Your First Quiz
                        </Button>
                      </div>
                    ) : (
                      quizSessions.slice(0, 3).map((session) => {
                        const statusColor = session.status === "completed" ? "text-green-600" : 
                                          session.status === "active" ? "text-blue-600" : "text-gray-600";
                        const statusBg = session.status === "completed" ? "bg-green-100" : 
                                        session.status === "active" ? "bg-blue-100" : "bg-gray-100";
                        
                        const accuracy = session.status === "completed" && session.total_questions > 0
                          ? Math.round((session.score / session.total_questions) * 100)
                          : null;

                        return (
                          <div key={session.id} className="asklepios-card p-4 hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${statusBg}`}>
                                  <Brain className={`h-5 w-5 ${statusColor}`} />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{session.topic_name}</p>
                                  <p className="text-xs text-gray-600">
                                    {session.num_questions} questions • {session.difficulty}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${
                                  session.status === "completed" ? "asklepios-badge-success" :
                                  session.status === "active" ? "asklepios-badge-warning" :
                                  "asklepios-badge bg-gray-100 text-gray-700"
                                }`}>
                                  {session.status === "completed" ? "Completed" :
                                   session.status === "active" ? "In Progress" : session.status}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {session.status === "completed" && accuracy !== null ? (
                                <>
                                  <div className="flex items-center justify-between text-xs text-gray-600">
                                    <span>Score: {session.score}/{session.total_questions}</span>
                                    <span>{accuracy}% accuracy</span>
                                  </div>
                                  <div className="asklepios-progress">
                                    <div 
                                      className="asklepios-progress-fill" 
                                      style={{ width: `${accuracy}%` }}
                                    />
                                  </div>
                                </>
                              ) : session.status === "active" ? (
                                <>
                                  <div className="flex items-center justify-between text-xs text-gray-600">
                                    <span>Progress</span>
                                    <span>{session.current_question_index}/{session.total_questions}</span>
                                  </div>
                                  <div className="asklepios-progress">
                                    <div 
                                      className="asklepios-progress-fill" 
                                      style={{ 
                                        width: `${(session.current_question_index / session.total_questions) * 100}%`,
                                        backgroundColor: '#3b82f6'
                                      }}
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => navigate(`/quiz/session/${session.session_id}`)}
                                    className="mt-2 w-full"
                                  >
                                    Continue Quiz
                                  </Button>
                                </>
                              ) : (
                                <div className="text-xs text-gray-500">
                                  Started {new Date(session.started_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Personalized Recommendations */}
              <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 hover:bg-white/98">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 font-bold">
                    <Target className="h-5 w-5 text-blue-600" />
                    {isLecturer ? "Teaching Insights" : "Recommended for You"}
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
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
                          <h4 className="font-medium text-sm text-gray-800">{item.title}</h4>
                        </div>
                        <Badge variant="outline" className="text-xs text-gray-700">{item.difficulty}</Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{item.reason}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
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
            <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 hover:bg-white/98">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800 font-bold">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(isLecturer ? teacherActivities : recentActivities).map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
                      <div className="flex-shrink-0">
                        <activity.icon className={`h-4 w-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                        <p className="text-xs text-gray-600">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Courses Tab - Only for Students */}
          <TabsContent value="my-courses" className="space-y-6 relative z-30">
            {!isLecturer ? (
              <div className="space-y-6">
                {/* Enrolled Courses */}
                <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 hover:bg-white/98">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <BookOpen className="h-5 w-5" />
                      My Enrolled Courses
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-medium">Access your enrolled courses and learning materials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DashboardMyCourses />
                  </CardContent>
                </Card>

                {/* Course Progress Overview */}
                <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Course Progress Overview
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-medium">Track your progress across all enrolled courses</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-gray-700">
                    {loadingProgress ? (
                      <div className="flex items-center justify-center py-8">
                        <LoaderOne size="lg" />
                      </div>
                    ) : courseProgress.length === 0 ? (
                      <div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No course progress data available</p>
                      </div>
                    ) : (
                      courseProgress.map((course) => (
                        <div 
                          key={course.id} 
                          className="asklepios-card p-4 hover:scale-105 transition-all duration-200 cursor-pointer"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-black">{course.title}</h3>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 font-bold text-sm px-3 py-1">
                              {course.progress}% Complete
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-700 font-medium">
                              <span>{course.completed}/{course.lectures} lectures completed</span>
                              <span>Next: {course.nextLecture}</span>
                            </div>
                            <Progress value={course.progress} className="h-3 bg-gray-200" />
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/courses/${course.id}`);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                            >
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Continue
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/courses/${course.id}/documents`);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                            >
                              <BookOpen className="h-4 w-4 mr-1" />
                              View Materials
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Recent Course Activities */}
                <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-black">
                      <Clock className="h-5 w-5 text-gray-700" />
                      Recent Course Activities
                    </CardTitle>
                    <CardDescription className="text-gray-600">Your latest learning activities</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-gray-700">
                    {[
                      { course: "Machine Learning", activity: "Completed Lecture 5: Neural Networks", time: "2 hours ago", type: "lecture", icon: PlayCircle, color: "text-blue-600" },
                      { course: "Data Science", activity: "Submitted Assignment 3", time: "1 day ago", type: "assignment", icon: CheckCircle, color: "text-green-600" },
                      { course: "Python Programming", activity: "Took Quiz 2 - Scored 92%", time: "2 days ago", type: "quiz", icon: Brain, color: "text-purple-600" },
                      { course: "Machine Learning", activity: "Downloaded Course Materials", time: "3 days ago", type: "material", icon: Download, color: "text-orange-600" }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-blue-50/50 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md">
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'lecture' ? 'bg-blue-100' :
                          activity.type === 'assignment' ? 'bg-green-100' :
                          activity.type === 'quiz' ? 'bg-purple-100' : 'bg-orange-100'
                        }`}>
                          <activity.icon className={`h-4 w-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black">{activity.activity}</p>
                          <p className="text-xs text-gray-600">{activity.course} • {activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">My Courses</h3>
                <p className="text-gray-600 mb-4">This section is for students to view their enrolled courses.</p>
                <Button onClick={() => navigate('/teacher-courses')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage My Courses
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6 relative z-30">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Progress Chart */}
              <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                                          <BarChart3 className="h-5 w-5 text-blue-600" />
                    {isLecturer ? "Weekly Teaching Hours" : "Weekly Learning Hours"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loadingWeekly ? (
                      <div className="flex items-center justify-center py-8">
                        <LoaderOne size="lg" />
                      </div>
                    ) : (
                      weeklyProgress.map((day) => (
                        <div key={day.day} className="flex items-center gap-4">
                          <span className="text-sm font-medium w-8 text-gray-800">{day.day}</span>
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
              <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-gray-800">{isLecturer ? "Course Performance" : "Subject Mastery"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingProgress ? (
                    <div className="flex items-center justify-center py-8">
                      <LoaderOne size="lg" />
                    </div>
                  ) : isLecturer ? (
                    // Teacher view (mock data for now)
                    [
                      { subject: "Machine Learning", progress: 85, level: "High Engagement" },
                      { subject: "Deep Learning", progress: 72, level: "Good Performance" },
                      { subject: "Data Science", progress: 91, level: "Excellent" },
                      { subject: "Statistics", progress: 65, level: "Needs Attention" }
                    ].map((item) => (
                      <div 
                        key={item.subject} 
                        className="space-y-2 p-3 rounded-lg hover:bg-blue-50/50 cursor-pointer transition-colors"
                        onClick={() => navigate('/courses')}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-800">{item.subject}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">{item.level}</Badge>
                            <span className="text-sm text-gray-600">{item.progress}%</span>
                          </div>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    ))
                  ) : studentProgress?.subject_performance && Object.keys(studentProgress.subject_performance).length > 0 ? (
                    // Student view with real data
                    Object.entries(studentProgress.subject_performance).map(([subject, performance]) => {
                      const getLevel = (accuracy: number) => {
                        if (accuracy >= 90) return { level: "Expert", color: "bg-green-100 text-green-700 border-green-200" };
                        if (accuracy >= 80) return { level: "Advanced", color: "bg-blue-100 text-blue-700 border-blue-200" };
                        if (accuracy >= 70) return { level: "Intermediate", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
                        if (accuracy >= 60) return { level: "Beginner", color: "bg-orange-100 text-orange-700 border-orange-200" };
                        return { level: "Needs Work", color: "bg-red-100 text-red-700 border-red-200" };
                      };
                      
                      const levelInfo = getLevel(performance.accuracy);
                      
                      return (
                        <div 
                          key={subject} 
                          className="space-y-2 p-3 rounded-lg hover:bg-blue-50/50 cursor-pointer transition-colors"
                          onClick={() => navigate('/courses')}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-800">{subject}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs ${levelInfo.color}`}>
                                {levelInfo.level}
                              </Badge>
                              <span className="text-sm text-gray-600">{Math.round(performance.accuracy)}%</span>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{performance.correct_answers}/{performance.questions_answered} correct</span>
                            <span>
                              {subject === studentProgress.strongest_subject && '🏆 Best'}
                              {subject === studentProgress.weakest_subject && '📈 Focus'}
                            </span>
                          </div>
                          <Progress value={performance.accuracy} className="h-2" />
                        </div>
                      );
                    })
                  ) : (
                    // Fallback for students with no data
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No subject data available</p>
                      <p className="text-sm text-gray-500">Take some quizzes to see your subject mastery!</p>
                      <Button 
                        onClick={() => navigate('/quiz')} 
                        className="mt-4"
                        size="sm"
                      >
                        Start Learning
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6 relative z-30">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Schedule */}
              <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Scheduled Livestreams
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    {isLecturer ? "Your upcoming scheduled lectures" : "Upcoming live lectures you can attend"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingStreams ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600 ml-4 text-sm">Loading schedule...</p>
                    </div>
                  ) : (todaySchedule.length === 0 && upcomingSchedule.length === 0) ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No scheduled livestreams</p>
                      <p className="text-sm text-gray-500">
                        {isLecturer 
                          ? "Schedule your next live lecture to see it here" 
                          : "Check back later for upcoming live lectures"}
                      </p>
                      {isLecturer && (
                        <Button 
                          onClick={() => navigate('/livestream/create')} 
                          className="mt-4" 
                          size="sm"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Schedule Livestream
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Today's streams */}
                      {todaySchedule.length > 0 && (
                        <>
                          <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Today
                          </div>
                          {todaySchedule.map((item, index) => (
                            <div 
                              key={`today-${item.id}`} 
                              className="flex items-center gap-4 p-3 border rounded-lg hover:bg-blue-50/50 cursor-pointer transition-colors"
                              onClick={() => {
                                if (item.type === 'live') {
                                  navigate(`/stream/${item.stream_id}`);
                                } else if (isLecturer) {
                                  navigate('/livestream/create');
                                } else {
                                  navigate(`/stream/${item.stream_id}`);
                                }
                              }}
                            >
                              <div className="text-center min-w-[60px]">
                                <div className="text-sm font-medium text-gray-800">{item.time}</div>
                                {item.type === 'live' && (
                                  <div className="text-xs text-red-600 font-medium">● Live</div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                                <p className="text-xs text-gray-600">{item.course}</p>
                                {!isLecturer && (
                                  <p className="text-xs text-blue-600">by {item.instructor}</p>
                                )}
                                {item.type === 'live' && item.viewer_count > 0 && (
                                  <p className="text-xs text-green-600">{item.viewer_count} viewers</p>
                                )}
                              </div>
                              <Badge 
                                className={
                                  item.type === 'live' 
                                    ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' 
                                    : item.type === 'soon' || item.type === 'starting'
                                    ? 'bg-orange-100 text-orange-700 border-orange-200'
                                    : 'bg-blue-100 text-blue-700 border-blue-200'
                                }
                              >
                                {item.status}
                              </Badge>
                            </div>
                          ))}
                        </>
                      )}
                      
                      {/* Upcoming streams */}
                      {upcomingSchedule.length > 0 && (
                        <>
                          {todaySchedule.length > 0 && <div className="border-t border-gray-200 my-4"></div>}
                          <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Upcoming
                          </div>
                          {upcomingSchedule.map((item, index) => (
                            <div 
                              key={`upcoming-${item.id}`} 
                              className="flex items-center gap-4 p-3 border rounded-lg hover:bg-blue-50/50 cursor-pointer transition-colors"
                              onClick={() => {
                                if (isLecturer) {
                                  navigate('/livestream/create');
                                } else {
                                  navigate(`/stream/${item.stream_id}`);
                                }
                              }}
                            >
                              <div className="text-center min-w-[60px]">
                                <div className="text-sm font-medium text-gray-800">{item.time}</div>
                                <div className="text-xs text-gray-500">{new Date(item.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                                <p className="text-xs text-gray-600">{item.course}</p>
                                {!isLecturer && (
                                  <p className="text-xs text-blue-600">by {item.instructor}</p>
                                )}
                              </div>
                              <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                                {item.status}
                              </Badge>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Quizzes - Only for Students */}
              {!isLecturer && (
              <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    Upcoming Quizzes
                  </CardTitle>
                  <CardDescription className="text-gray-600">Prepare for your upcoming assessments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: "ML Algorithms Quiz", dueDate: "Tomorrow", questions: 15, difficulty: "Medium" },
                    { title: "Neural Networks Assessment", dueDate: "In 3 days", questions: 20, difficulty: "Hard" },
                    { title: "Data Preprocessing Quiz", dueDate: "Next week", questions: 10, difficulty: "Easy" }
                  ].map((quiz) => (
                    <div 
                      key={quiz.title} 
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/quiz')}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-800">{quiz.title}</p>
                        <p className="text-xs text-gray-600">
                          {quiz.questions} questions • Due {quiz.dueDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={
                            quiz.difficulty === 'Easy' 
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : quiz.difficulty === 'Medium'
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          {quiz.difficulty}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/quiz');
                          }}
                        >
                          Prepare
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              )}

              {/* Student Engagement - Only for Teachers */}
              {isLecturer && (
                <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <Users className="h-5 w-5 text-blue-600" />
                      Student Engagement
                    </CardTitle>
                    <CardDescription className="text-gray-600">Monitor your students' activity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-gray-700">
                    {[
                      { name: "Machine Learning 101", students: 45, active: 38, engagement: 84 },
                      { name: "Deep Learning Basics", students: 32, active: 28, engagement: 88 },
                      { name: "Data Science Intro", students: 28, active: 22, engagement: 79 }
                    ].map((course) => (
                      <div key={course.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50/50 transition-colors">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-800">{course.name}</p>
                          <p className="text-xs text-gray-600">
                            {course.active}/{course.students} active students
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">{course.engagement}%</Badge>
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
          <TabsContent value="achievements" className="space-y-6 relative z-30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(isLecturer ? teacherAchievements : achievements).map((achievement) => (
                <Card 
                  key={achievement.id} 
                  className={`bg-white/95 backdrop-blur-sm border border-white/30 rounded-2xl cursor-pointer hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl ${achievement.earned ? 'border-green-300 bg-gradient-to-br from-green-50 to-green-100' : 'border-white/30 hover:border-blue-300'}`}
                  onClick={() => {
                    if (achievement.earned) {
                      // Show achievement details or certificate
                      console.log('View achievement details:', achievement.title);
                    } else {
                      // Navigate to relevant section to complete the achievement
                      if (achievement.title.includes('Course')) {
                        navigate('/courses');
                      } else if (achievement.title.includes('Quiz') || achievement.title.includes('Assessment')) {
                        navigate('/quiz');
                      } else if (achievement.title.includes('Lecture') || achievement.title.includes('Teaching')) {
                        navigate(isLecturer ? '/teacher-courses' : '/my-courses');
                      } else {
                        navigate('/my-courses');
                      }
                    }
                  }}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`mb-3 flex justify-center ${achievement.earned ? 'text-green-600' : 'text-gray-600'}`}>
                      {achievement.icon}
                    </div>
                    <h3 className="font-semibold mb-2 text-gray-800">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                    {achievement.earned ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        <Target className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Goals Section */}
            <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Zap className="h-5 w-5 text-blue-600" />
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
                      <span className="text-sm font-medium text-gray-800">{item.goal}</span>
                      <span className="text-sm text-gray-600">{item.current}/{item.target}</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
            </div>
        </Tabs>
        </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard