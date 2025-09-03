import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import { apiClient, EnrolledCourseWithLectures, GeneratedQuestion, QuizSession, QuizResults, StudentProgress } from '@/lib/api'
import {
  H1, H2, H3, H4, H5, H6,
  LargeText, MediumText, NormalText, SmallText,
  Button as DSButton,
  Badge as DSBadge
} from '@/components/ui/design-system'
import {
  Play,
  Clock,
  Trophy,
  Target,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Calendar,
  User,
  Star,
  Award,
  Brain,
  Zap,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  RotateCcw,
  Lightbulb,
  Rocket,
  Crown,
  Flame,
  GraduationCap
} from 'lucide-react'

interface QuizConfig {
  streamId: number
  lectureTitle: string
  courseTitle: string
  questionCount: number
  difficulty: string
  timeLimit: number
}

interface ActiveQuiz {
  session: QuizSession
  currentQuestionIndex: number
  answers: { [key: number]: string }
  timeRemaining: number
  showResults: boolean
}

const QuizDashboard = () => {
  const { user } = useAuth()
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseWithLectures[]>([])
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null)
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null)
  const [selectedLecture, setSelectedLecture] = useState<number | null>(null)
  const [quizConfig, setQuizConfig] = useState<Partial<QuizConfig>>({
    questionCount: 5,
    difficulty: 'medium',
    timeLimit: 10
  })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null)
  const [promptText, setPromptText] = useState<string>('')

  // Load enrolled courses and student progress
  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      setLoading(true)
      try {
        const [coursesResponse, progressResponse] = await Promise.all([
          apiClient.getEnrolledCoursesWithLectures(),
          apiClient.getStudentProgress()
        ])

        if (coursesResponse.data && coursesResponse.data.length > 0) {
          // Enrich with lectures if missing
          const base = coursesResponse.data
          const enriched = await Promise.all(base.map(async (c) => {
            if (c.lectures && c.lectures.length > 0) return c
            // Try backend course lectures endpoint
            try {
              const res = await apiClient.fetchCourseLectures(c.course_id)
              if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                return { ...c, lectures: res.data.map((l: any) => ({
                  stream_id: l.stream_id ?? l.id,
                  title: l.title ?? 'Lecture',
                  date: l.date ?? new Date().toISOString(),
                  duration: l.duration ?? 0,
                  has_questions: true,
                  questions_count: l.questions_count ?? 0,
                })) }
              }
            } catch {}
            // Fallback: use livestreams as lectures
            try {
              const ls = await apiClient.getLiveStreams({ status: 'all', course_id: c.course_id })
              if (ls.data && Array.isArray(ls.data) && ls.data.length > 0) {
                return { ...c, lectures: ls.data.map((s: any) => ({
                  stream_id: s.id,
                  title: s.title,
                  date: s.started_at || s.created_at || new Date().toISOString(),
                  duration: s.duration || 0,
                  has_questions: true,
                  questions_count: s.questions_count || 0,
                })) }
              }
            } catch {}
            // S3 fallback: list lectures from S3 bucket
            try {
              const s3Lectures = await fetchS3Lectures(c.course_id)
              if (s3Lectures.length > 0) {
                return { ...c, lectures: s3Lectures }
              }
            } catch {}
            return c
          }))
          setEnrolledCourses(enriched)
        } else {
          // Fallback: load all courses (public) and present course-wide generation
          const allCourses = await apiClient.getCourses()
          if (allCourses.data && Array.isArray(allCourses.data)) {
            const mapped: EnrolledCourseWithLectures[] = (allCourses.data as any[]).map((c: any) => ({
              course_id: c.id,
              course_title: c.title || c.name,
              instructor_name: c.instructor || 'Instructor',
              enrollment_date: new Date().toISOString(),
              lectures: []
            }))
            // Try to populate lectures via livestreams
            const enriched = await Promise.all(mapped.map(async (c) => {
              try {
                const ls = await apiClient.getLiveStreams({ status: 'all', course_id: c.course_id })
                if (ls.data && Array.isArray(ls.data) && ls.data.length > 0) {
                  return { ...c, lectures: ls.data.map((s: any) => ({
                    stream_id: s.id,
                    title: s.title,
                    date: s.started_at || s.created_at || new Date().toISOString(),
                    duration: s.duration || 0,
                    has_questions: true,
                    questions_count: s.questions_count || 0,
                  })) }
                }
              } catch {}
              try {
                const s3Lectures = await fetchS3Lectures(c.course_id)
                if (s3Lectures.length > 0) {
                  return { ...c, lectures: s3Lectures }
                }
              } catch {}
              return c
            }))
            setEnrolledCourses(enriched)
          }
        }

        if (progressResponse.data) {
          setStudentProgress(progressResponse.data)
        }
      } catch (error) {
        console.error('Error loading quiz dashboard data:', error)
        setError('Failed to load quiz data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  // S3 lectures helper
  const fetchS3Lectures = async (courseId: number) => {
    const S3_BASE = 'https://visionware-lecture-courses.s3.amazonaws.com'
    const lectures: any[] = []
    // Try a JSON manifest first
    try {
      const manifestUrls = [
        `${S3_BASE}/courses/${courseId}/lectures.json`,
        `${S3_BASE}/lectures_${courseId}.json`
      ]
      for (const url of manifestUrls) {
        const r = await fetch(url, { cache: 'no-store' })
        if (r.ok) {
          const data = await r.json()
          if (Array.isArray(data)) {
            return data.map((item: any, idx: number) => ({
              stream_id: item.stream_id || item.id || (courseId * 1000 + idx),
              title: item.title || item.name || `Lecture ${idx + 1}`,
              date: item.date || new Date().toISOString(),
              duration: item.duration || 0,
              has_questions: true,
              questions_count: item.questions_count || 0,
            }))
          }
        }
      }
    } catch {}
    // Try listing objects and infer lectures from files
    try {
      const listUrl = `${S3_BASE}/?list-type=2&prefix=courses/${courseId}/`
      const resp = await fetch(listUrl, { cache: 'no-store' })
      if (resp.ok) {
        const xml = await resp.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, 'application/xml')
        const contents = Array.from(doc.getElementsByTagName('Contents'))
        const files = contents.map((c) => c.getElementsByTagName('Key')[0]?.textContent || '').filter(Boolean)
        const media = files.filter((k) => /\.(mp4|mkv|pdf|pptx|ppt|mp3)$/i.test(k))
        media.forEach((key, idx) => {
          const name = key.split('/').pop() || `Lecture ${idx + 1}`
          lectures.push({
            stream_id: courseId * 1000 + idx,
            title: name.replace(/\.[^.]+$/, ''),
            date: new Date().toISOString(),
            duration: 0,
            has_questions: true,
            questions_count: 0,
          })
        })
      }
    } catch {}
    return lectures
  }
  
  // Timer for active quiz
  useEffect(() => {
    if (!activeQuiz || activeQuiz.showResults) return
    
    const timer = setInterval(() => {
      setActiveQuiz(prev => {
        if (!prev) return null
        
        const newTimeRemaining = prev.timeRemaining - 1
        if (newTimeRemaining <= 0) {
          submitQuiz()
          return { ...prev, timeRemaining: 0, showResults: true }
        }
        
        return { ...prev, timeRemaining: newTimeRemaining }
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [activeQuiz])

  const startQuiz = async () => {
    if (!quizConfig.questionCount || !quizConfig.difficulty || !quizConfig.timeLimit) {
      setError('Please configure quiz settings')
      return
    }

    if (!promptText || promptText.trim().length === 0) {
      setError('Please enter a topic or prompt to generate a quiz')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      // Prompt-based generation using Gemini via central api client
      const genResp = await apiClient.post('/quiz/generate', {
        topic: promptText.trim(),
        question_count: quizConfig.questionCount,
        difficulty: quizConfig.difficulty,
      })
      if (genResp.error || !genResp.data) {
        throw new Error(genResp.error || 'Failed to generate quiz')
      }
      const data = genResp.data
      const questions = (data?.questions || []).map((q: any, idx: number) => ({
        id: idx + 1,
        question_text: q.question,
        options: (q.options || []).map((o: any) => o.text),
        correct_answer: q.answer,
        difficulty_level: (quizConfig.difficulty || 'medium') as string,
        topic_tags: [promptText.trim()].filter(Boolean)
      }))
      const response = { data: {
        id: Date.now(),
        user_id: 0, // local session marker
        stream_id: 0,
        questions,
        current_question_index: 0,
        answers: {},
        start_time: new Date().toISOString(),
        time_limit: quizConfig.timeLimit,
        is_completed: false,
        local: true,
      }} as any
      
      if (response.data) {
        setActiveQuiz({
          session: response.data,
          currentQuestionIndex: 0,
          answers: {},
          timeRemaining: quizConfig.timeLimit * 60,
          showResults: false
        })
      } else {
        setError('Failed to start quiz. Please try again.')
      }
    } catch (error) {
      console.error('Error starting quiz:', error)
      setError('Failed to start quiz. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const selectAnswer = (questionId: number, answer: string) => {
    setActiveQuiz(prev => {
      if (!prev) return null
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: answer
        }
      }
    })
  }

  const nextQuestion = () => {
    setActiveQuiz(prev => {
      if (!prev || prev.currentQuestionIndex >= prev.session.questions.length - 1) return prev
      return {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }
    })
  }

  const prevQuestion = () => {
    setActiveQuiz(prev => {
      if (!prev || prev.currentQuestionIndex <= 0) return prev
      return {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }
    })
  }

  const submitQuiz = async () => {
    if (!activeQuiz) return
    
    try {
      if ((activeQuiz.session as any).local) {
        // Local evaluation
        const total = activeQuiz.session.questions.length
        let correct = 0
        const answers = activeQuiz.session.questions.map((q: any) => {
          const userAns = activeQuiz.answers[q.id]
          const isCorrect = userAns && userAns === q.correct_answer
          if (isCorrect) correct += 1
          return {
            question_id: q.id,
            question_text: q.question_text,
            correct_answer: q.correct_answer,
            user_answer: userAns || '',
            is_correct: !!isCorrect,
          }
        })
        const timeTaken = (quizConfig.timeLimit || 10) * 60 - (activeQuiz.timeRemaining || 0)
        const results = {
          session_id: activeQuiz.session.id,
          score: Math.round((correct / Math.max(total, 1)) * 100),
          total_questions: total,
          correct_answers: correct,
          time_taken: Math.max(timeTaken, 0),
          answers
        } as unknown as QuizResults
        setQuizResults(results)
        setActiveQuiz(prev => prev ? { ...prev, showResults: true } : null)
      } else {
        // Server-evaluated session
        for (const [questionId, answer] of Object.entries(activeQuiz.answers)) {
          await apiClient.submitQuizAnswer(activeQuiz.session.id, {
            question_id: parseInt(questionId),
            selected_answer: answer
          })
        }
        const resultsResponse = await apiClient.getQuizResults(activeQuiz.session.id)
        if (resultsResponse.data) {
          setQuizResults(resultsResponse.data)
          setActiveQuiz(prev => prev ? { ...prev, showResults: true } : null)
          const progressResponse = await apiClient.getStudentProgress()
          if (progressResponse.data) {
            setStudentProgress(progressResponse.data)
          }
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      setError('Failed to submit quiz. Please try again.')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "bg-green-100 text-green-800 border-green-300"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "hard": return "bg-red-100 text-red-800 border-red-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }
  
  const getSelectedCourse = () => {
    return enrolledCourses.find(course => course.course_id === selectedCourse)
  }
  
  const getSelectedLectureTitle = () => {
    const course = getSelectedCourse()
    if (!course) return ''
    const lecture = course.lectures.find(l => l.stream_id === selectedLecture)
    return lecture?.title || ''
  }
  
  const retakeQuiz = () => {
    setActiveQuiz(null)
    setQuizResults(null)
    setError(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentQuestion = activeQuiz?.session.questions[activeQuiz.currentQuestionIndex]
  
  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading your quiz dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Quiz Results View
  if (activeQuiz?.showResults && quizResults) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white border shadow-lg">
              <CardHeader className="text-center bg-blue-600 text-white rounded-t-lg">
                <div className="mx-auto mb-4">
                  {quizResults.score >= 80 ? (
                    <Crown className="h-16 w-16 text-yellow-400" />
                  ) : quizResults.score >= 60 ? (
                    <Trophy className="h-16 w-16 text-white" />
                  ) : (
                    <Target className="h-16 w-16 text-white" />
                  )}
                </div>
                <CardTitle className="text-3xl font-bold mb-2">Quiz Complete!</CardTitle>
                <CardDescription className="text-blue-100 text-lg">
                  {getSelectedLectureTitle()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600 mb-4">
                    {quizResults.score}%
                  </div>
                  <p className="text-gray-600 text-lg">
                    You got <span className="font-bold text-green-600">{quizResults.correct_answers}</span> out of <span className="font-bold">{quizResults.total_questions}</span> questions correct
                  </p>
                </div>

                <div className="relative">
                  <Progress value={quizResults.score} className="h-6 bg-gray-200" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-white drop-shadow-lg">
                      {quizResults.score >= 50 ? 'Great job!' : 'Keep learning!'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="text-center p-6 bg-green-50 border-green-200 shadow-lg">
                    <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-green-700">
                      {quizResults.correct_answers}
                    </div>
                    <p className="text-sm text-green-600 font-medium">Correct Answers</p>
                  </Card>
                  <Card className="text-center p-6 bg-red-50 border-red-200 shadow-lg">
                    <XCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-red-700">
                      {quizResults.total_questions - quizResults.correct_answers}
                    </div>
                    <p className="text-sm text-red-600 font-medium">Incorrect</p>
                  </Card>
                  <Card className="text-center p-6 bg-blue-50 border-blue-200 shadow-lg">
                    <Clock className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-blue-700">
                      {Math.round(quizResults.time_taken / 60)}m
                    </div>
                    <p className="text-sm text-blue-600 font-medium">Time Taken</p>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-blue-500" />
                    Review Your Answers
                  </h3>
                  {quizResults.answers.map((answer, index) => (
                    <Card key={answer.question_id} className={`border-l-4 shadow-md transition-all hover:shadow-lg ${
                      answer.is_correct 
                        ? 'border-l-green-500 bg-green-50' 
                        : 'border-l-red-500 bg-red-50'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-800">Question {index + 1}</h4>
                          {answer.is_correct ? (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-500" />
                          )}
                        </div>
                        <p className="mb-4 text-gray-700 font-medium">{answer.question_text}</p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-gray-600 min-w-[100px]">Your answer:</span>
                            <span className={`font-medium ${
                              answer.is_correct ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {answer.user_answer || "Not answered"}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-gray-600 min-w-[100px]">Correct answer:</span>
                            <span className="font-medium text-green-700">
                              {answer.correct_answer}
                            </span>
                          </div>
                          {answer.explanation && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                              <p className="text-sm text-blue-800">
                                <span className="font-medium">Explanation:</span> {answer.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-center space-x-4 pt-6">
                  <Button 
                    onClick={retakeQuiz}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg transition-all"
                  >
                    Back to Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setActiveQuiz(null)
                      setQuizResults(null)
                    }}
                    className="border-2 border-gray-300 text-gray-600 px-8 py-3 text-lg font-semibold hover:bg-gray-50 transition-all"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Try Another Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    )
  }

  // Active Quiz View
  if (activeQuiz && !activeQuiz.showResults) {
    const progress = ((activeQuiz.currentQuestionIndex + 1) / activeQuiz.session.questions.length) * 100
    const isLastQuestion = activeQuiz.currentQuestionIndex === activeQuiz.session.questions.length - 1
    const hasAnsweredCurrent = currentQuestion && activeQuiz.answers[currentQuestion.id]

    return (
      <Layout>
        <div className="container mx-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Quiz Header */}
            <Card className="mb-6 bg-white border shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {getSelectedLectureTitle()}
                    </h1>
                    <p className="text-gray-600 flex items-center gap-2 mt-1">
                      <Brain className="h-4 w-4" />
                      Question {activeQuiz.currentQuestionIndex + 1} of {activeQuiz.session.questions.length}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Time Remaining</div>
                      <div className={`text-2xl font-mono font-bold ${
                        activeQuiz.timeRemaining < 60 ? 'text-red-500' : 'text-blue-600'
                      }`}>
                        {formatTime(activeQuiz.timeRemaining)}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={retakeQuiz}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Exit Quiz
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card className="mb-6 bg-white border shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Progress</span>
                  <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-gray-200" />
              </CardContent>
            </Card>

            {/* Question */}
            {currentQuestion && (
              <Card className="bg-white border shadow-lg">
                <CardHeader className="bg-blue-600 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <Badge className={getDifficultyColor(currentQuestion.difficulty_level)}>
                      {currentQuestion.difficulty_level.charAt(0).toUpperCase() + currentQuestion.difficulty_level.slice(1)}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {currentQuestion.topic_tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-white/20 text-white border-white/40">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-8">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
                      {currentQuestion.question_text}
                    </h2>

                    <div className="space-y-4">
                      {currentQuestion.options.map((option, index) => {
                        const isSelected = activeQuiz.answers[currentQuestion.id] === option
                        return (
                          <button
                            key={`${currentQuestion.id}-option-${index}`}
                            onClick={() => selectAnswer(currentQuestion.id, option)}
                            className={`w-full p-5 text-left border-2 rounded-xl transition-all duration-200 hover:shadow-lg ${
                              isSelected
                                ? 'border-blue-400 bg-blue-50 shadow-lg'
                                : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-all ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
                                  : 'border-gray-300 text-gray-400'
                              }`}>
                                {isSelected ? '✓' : String.fromCharCode(65 + index)}
                              </div>
                              <span className={`text-lg ${
                                isSelected ? 'font-semibold text-blue-700' : 'text-gray-700'
                              }`}>
                                {option}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={prevQuestion}
                      disabled={activeQuiz.currentQuestionIndex === 0}
                      className="px-6 py-3 text-lg font-semibold"
                    >
                      Previous
                    </Button>

                    <div className="space-x-3">
                      {isLastQuestion ? (
                        <Button
                          onClick={submitQuiz}
                          disabled={!hasAnsweredCurrent}
                          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-bold shadow-lg transition-all"
                        >
                          <Trophy className="h-5 w-5 mr-2" />
                          Submit Quiz
                        </Button>
                      ) : (
                        <Button
                          onClick={nextQuestion}
                          disabled={!hasAnsweredCurrent}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg font-semibold shadow-lg transition-all"
                        >
                          Next
                          <Rocket className="h-5 w-5 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Layout>
    )
  }

  // Main Dashboard View
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
              Quiz Dashboard
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Generate quizzes instantly from any topic or prompt using your AI assistant.
            </p>
          </div>
          
          {error && (
            <Card className="border-red-200 bg-red-50 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 shadow-lg">
              <TabsTrigger value="generate" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-700 font-semibold">
                Generate Quiz
              </TabsTrigger>
              <TabsTrigger value="progress" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-700 font-semibold">
                Progress
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-700 font-semibold">
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Generate Quiz Tab */}
            <TabsContent value="generate" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader className="bg-blue-600 text-white rounded-t-lg">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="h-6 w-6" />
                    Create Your Personalized Quiz
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Enter a topic/prompt or select from your courses to generate questions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {/* Prompt-based Generation */}
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-gray-900">Enter a topic or prompt</Label>
                    <Textarea
                      placeholder="e.g., Fundamentals of cloud computing, AWS basics, Python OOP, etc."
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      className="min-h-[100px] bg-white text-gray-900 border-2 border-gray-300 focus:border-gray-800"
                    />
                  </div>

                  {/* Course Selection (optional) - hidden by default, keep code for future use */}
                  {false && (
                    <div className="space-y-2">
                      <Label className="text-lg font-semibold text-gray-900">Select Course</Label>
                      <Select 
                        value={selectedCourse?.toString() || ''} 
                        onValueChange={(value) => {
                          setSelectedCourse(parseInt(value))
                          setSelectedLecture(null)
                        }}
                      >
                        <SelectTrigger className="h-12 text-lg border-2 border-gray-300 bg-white text-gray-900 focus:border-gray-800">
                          <SelectValue placeholder="Choose a course..." />
                        </SelectTrigger>
                        <SelectContent>
                          {enrolledCourses.map((course) => (
                            <SelectItem key={course.course_id} value={course.course_id.toString()}>
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" />
                                {course.course_title}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                   {/* Lecture Selection (optional) */}
                  {false && selectedCourse && (
                    <div className="space-y-2">
                      <Label className="text-lg font-semibold text-gray-900">Select Lecture</Label>
                      <Select 
                        value={selectedLecture ? selectedLecture.toString() : ''} 
                        onValueChange={(value) => {
                          if (value === 'course-wide') {
                            setSelectedLecture(null)
                          } else {
                            setSelectedLecture(parseInt(value))
                          }
                        }}
                      >
                        <SelectTrigger className="h-12 text-lg border-2 border-gray-300 bg-white text-gray-900 focus:border-gray-800">
                          <SelectValue placeholder="Choose a lecture or generate from entire course..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getSelectedCourse()?.lectures.filter(l => l.has_questions).map((lecture) => (
                            <SelectItem key={lecture.stream_id} value={lecture.stream_id.toString()}>
                              <div className="space-y-1">
                                <div className="font-medium">{lecture.title}</div>
                                <div className="text-sm text-gray-400 flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(lecture.date).toLocaleDateString()}
                                  <Brain className="h-3 w-3 ml-2" />
                                  {lecture.questions_count} questions available
                                </div>
                              </div>
                            </SelectItem>
                          )) || []}
                          <SelectItem value="course-wide">
                            <div className="space-y-1">
                              <div className="font-medium">Generate from entire course</div>
                              <div className="text-sm text-gray-400">Use NER & keyphrase extraction across course docs</div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Quiz Configuration */}
                  {selectedLecture && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-900">Number of Questions</Label>
                        <Select 
                          value={quizConfig.questionCount?.toString() || '5'} 
                          onValueChange={(value) => setQuizConfig(prev => ({ ...prev, questionCount: parseInt(value) }))}
                        >
                          <SelectTrigger className="border-gray-300 bg-white text-gray-900 focus:border-gray-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 15, 20].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num} questions</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-900">Difficulty Level</Label>
                        <Select 
                          value={quizConfig.difficulty || 'medium'} 
                          onValueChange={(value) => setQuizConfig(prev => ({ ...prev, difficulty: value }))}
                        >
                          <SelectTrigger className="border-gray-300 bg-white text-gray-900 focus:border-gray-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-900">Time Limit (minutes)</Label>
                        <Select 
                          value={quizConfig.timeLimit?.toString() || '10'} 
                          onValueChange={(value) => setQuizConfig(prev => ({ ...prev, timeLimit: parseInt(value) }))}
                        >
                          <SelectTrigger className="border-gray-300 bg-white text-gray-900 focus:border-gray-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 15, 20, 30].map(time => (
                              <SelectItem key={time} value={time.toString()}>{time} minutes</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Start Quiz Button */}
                  <div className="pt-6 border-t border-gray-600">
                    <Button
                      onClick={startQuiz}
                      disabled={generating || (!promptText && !selectedCourse && !selectedLecture)}
                      className="w-full h-16 text-xl font-bold btn-solid-primary shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                          Generating Your Quiz...
                        </>
                      ) : (
                        <>
                          <Rocket className="h-6 w-6 mr-3" />
                          Start AI-Generated Quiz
                        </>
                      )}
                    </Button>
                  </div>
                  {/* Previously: only when lecture selected. Now allowed with prompt or course. */}
                  {false && selectedLecture && (
                    <div className="pt-6 border-t border-gray-600">
                      <Button
                        onClick={startQuiz}
                        disabled={generating}
                        className="w-full h-16 text-xl font-bold btn-solid-primary shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                            Generating Your Quiz...
                          </>
                        ) : (
                          <>
                            <Rocket className="h-6 w-6 mr-3" />
                            Start AI-Generated Quiz
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Available Courses Preview */}
              {enrolledCourses.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-gray-800" />
                    Your Enrolled Courses
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledCourses.map((course) => (
                      <Card key={course.course_id} className="hover:shadow-lg transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="text-lg text-gray-900">{course.course_title}</CardTitle>
                          <CardDescription className="text-gray-600">
                            Instructor: {course.instructor_name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Lectures Available:</span>
                              <Badge className="bg-green-100 text-green-800">
                                {course.lectures.filter(l => l.has_questions).length}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Total Questions:</span>
                              <Badge className="bg-blue-100 text-blue-800">
                                {course.lectures.reduce((sum, l) => sum + l.questions_count, 0)}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-6">
              {studentProgress && (
                <>
                  {/* Main Progress Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg text-white">
                      <CardContent className="p-6 text-center">
                        <Trophy className="h-12 w-12 text-blue-100 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">
                          {Math.round(studentProgress.average_score)}%
                        </div>
                        <p className="text-sm text-blue-100 font-medium">Average Score</p>
                        {studentProgress.performance_trend && (
                          <p className="text-xs text-blue-200 mt-1">
                            {studentProgress.performance_trend === 'improving' && '📈 Trending up'}
                            {studentProgress.performance_trend === 'declining' && '📉 Needs attention'}
                            {studentProgress.performance_trend === 'stable' && '➡️ Consistent'}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-lg text-white">
                      <CardContent className="p-6 text-center">
                        <Target className="h-12 w-12 text-green-100 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">
                          {studentProgress.total_quizzes_taken}
                        </div>
                        <p className="text-sm text-green-100 font-medium">Quizzes Completed</p>
                        {studentProgress.pass_rate !== undefined && (
                          <p className="text-xs text-green-200 mt-1">
                            {Math.round(studentProgress.pass_rate)}% pass rate
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-lg text-white">
                      <CardContent className="p-6 text-center">
                        <Flame className="h-12 w-12 text-purple-100 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">
                          {studentProgress.learning_streak}
                        </div>
                        <p className="text-sm text-purple-100 font-medium">Current Streak</p>
                        {studentProgress.longest_streak !== undefined && studentProgress.longest_streak > studentProgress.learning_streak && (
                          <p className="text-xs text-purple-200 mt-1">
                            Best: {studentProgress.longest_streak} days
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 shadow-lg text-white">
                      <CardContent className="p-6 text-center">
                        <Clock className="h-12 w-12 text-orange-100 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">
                          {Math.round(studentProgress.time_spent_learning / 60)}h
                        </div>
                        <p className="text-sm text-orange-100 font-medium">Study Time</p>
                        {studentProgress.average_quiz_duration !== undefined && (
                          <p className="text-xs text-orange-200 mt-1">
                            {Math.round(studentProgress.average_quiz_duration)}min avg
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Enhanced Progress Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {studentProgress.accuracy_rate !== undefined && (
                      <Card className="bg-white border shadow-lg">
                        <CardContent className="p-6 text-center">
                          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                          <div className="text-2xl font-bold text-emerald-700 mb-1">
                            {Math.round(studentProgress.accuracy_rate)}%
                          </div>
                          <p className="text-sm text-emerald-600 font-medium">Accuracy Rate</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {studentProgress.correct_answers}/{studentProgress.total_questions_answered} correct
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {studentProgress.consistency_score !== undefined && (
                      <Card className="bg-white border shadow-lg">
                        <CardContent className="p-6 text-center">
                          <BarChart3 className="h-10 w-10 text-indigo-500 mx-auto mb-3" />
                          <div className="text-2xl font-bold text-indigo-700 mb-1">
                            {Math.round(studentProgress.consistency_score)}%
                          </div>
                          <p className="text-sm text-indigo-600 font-medium">Consistency</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {studentProgress.consistency_score >= 80 ? 'Very consistent' : 
                             studentProgress.consistency_score >= 60 ? 'Fairly consistent' : 'Improving'}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {studentProgress.study_efficiency !== undefined && (
                      <Card className="bg-white border shadow-lg">
                        <CardContent className="p-6 text-center">
                          <Zap className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                          <div className="text-2xl font-bold text-yellow-700 mb-1">
                            {studentProgress.study_efficiency.toFixed(1)}
                          </div>
                          <p className="text-sm text-yellow-600 font-medium">Study Efficiency</p>
                          <p className="text-xs text-gray-500 mt-1">Points per minute</p>
                        </CardContent>
                      </Card>
                    )}

                    {studentProgress.days_active !== undefined && (
                      <Card className="bg-white border shadow-lg">
                        <CardContent className="p-6 text-center">
                          <Calendar className="h-10 w-10 text-rose-500 mx-auto mb-3" />
                          <div className="text-2xl font-bold text-rose-700 mb-1">
                            {studentProgress.days_active}
                          </div>
                          <p className="text-sm text-rose-600 font-medium">Active Days</p>
                          {studentProgress.weekly_activity !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">
                              {studentProgress.weekly_activity.toFixed(1)} sessions/week
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Performance Insights */}
                  {studentProgress.improvement_rate !== undefined && (
                    <Card className="bg-white border shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          Learning Progress Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className={`text-2xl font-bold mb-2 ${
                              studentProgress.improvement_rate > 0 ? 'text-green-600' : 
                              studentProgress.improvement_rate < -2 ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              {studentProgress.improvement_rate > 0 ? '+' : ''}{studentProgress.improvement_rate.toFixed(1)}
                            </div>
                            <p className="text-sm text-gray-600">Points per Quiz</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {studentProgress.improvement_rate > 2 ? 'Excellent progress!' : 
                               studentProgress.improvement_rate > 0 ? 'Good improvement' :
                               studentProgress.improvement_rate > -2 ? 'Stable performance' : 'Needs attention'}
                            </p>
                          </div>

                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 mb-2">
                              {studentProgress.total_study_sessions || 0}
                            </div>
                            <p className="text-sm text-gray-600">Study Sessions</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Total learning sessions
                            </p>
                          </div>

                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600 mb-2">
                              {studentProgress.subjects_count || studentProgress.subjects_studied.length}
                            </div>
                            <p className="text-sm text-gray-600">Subjects Mastered</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Different topics studied
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {studentProgress && studentProgress.subjects_studied.length > 0 && (
                <Card className="bg-white border shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      Subjects You've Studied
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {studentProgress.subjects_studied.map((subject, index) => (
                        <Badge key={index} className="bg-blue-100 text-blue-700 border-blue-200">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {studentProgress && (
                <>
                  <Card className="bg-white border shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                        Recent Quiz Performance
                        {studentProgress.performance_trend && (
                          <Badge 
                            className={`ml-2 ${
                              studentProgress.performance_trend === 'improving' ? 'bg-green-100 text-green-800' :
                              studentProgress.performance_trend === 'declining' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {studentProgress.performance_trend === 'improving' && '📈 Improving'}
                            {studentProgress.performance_trend === 'declining' && '📉 Declining'}
                            {studentProgress.performance_trend === 'stable' && '➡️ Stable'}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {studentProgress.recent_quiz_scores.length > 0 ? (
                          <>
                            {studentProgress.recent_quiz_scores.map((score, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">Quiz {index + 1}</span>
                                  <span className={`text-sm font-bold ${
                                    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {score}%
                                  </span>
                                </div>
                                <Progress value={score} className="h-2" />
                              </div>
                            ))}
                            
                            {/* Enhanced Stats */}
                            {(studentProgress.improvement_rate !== undefined || studentProgress.consistency_score !== undefined) && (
                              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  {studentProgress.improvement_rate !== undefined && (
                                    <div className="text-center">
                                      <div className={`font-bold text-lg ${
                                        studentProgress.improvement_rate > 0 ? 'text-green-600' : 
                                        studentProgress.improvement_rate < 0 ? 'text-red-600' : 'text-gray-600'
                                      }`}>
                                        {studentProgress.improvement_rate > 0 ? '+' : ''}{studentProgress.improvement_rate.toFixed(1)}
                                      </div>
                                      <div className="text-gray-600">Points/Quiz</div>
                                    </div>
                                  )}
                                  {studentProgress.consistency_score !== undefined && (
                                    <div className="text-center">
                                      <div className="font-bold text-lg text-purple-600">
                                        {studentProgress.consistency_score.toFixed(0)}%
                                      </div>
                                      <div className="text-gray-600">Consistency</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500 text-center py-8">No quiz data available yet. Take your first quiz to see analytics!</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Overall Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">
                            {studentProgress.total_questions_answered}
                          </div>
                          <p className="text-sm text-blue-600">Questions Answered</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-700">
                            {studentProgress.correct_answers}
                          </div>
                          <p className="text-sm text-green-600">Correct Answers</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-700">
                            {studentProgress.accuracy_rate ? Math.round(studentProgress.accuracy_rate) : Math.round((studentProgress.correct_answers / Math.max(studentProgress.total_questions_answered, 1)) * 100)}%
                          </div>
                          <p className="text-sm text-purple-600">Accuracy Rate</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-700">
                            {studentProgress.subjects_count || studentProgress.subjects_studied.length}
                          </div>
                          <p className="text-sm text-orange-600">Subjects Studied</p>
                        </div>
                      </div>
                      
                      {/* Additional Enhanced Statistics */}
                      {(studentProgress.pass_rate !== undefined || studentProgress.study_efficiency !== undefined) && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          {studentProgress.pass_rate !== undefined && (
                            <div className="text-center p-4 bg-emerald-50 rounded-lg">
                              <div className="text-2xl font-bold text-emerald-700">
                                {Math.round(studentProgress.pass_rate)}%
                              </div>
                              <p className="text-sm text-emerald-600">Pass Rate</p>
                            </div>
                          )}
                          {studentProgress.study_efficiency !== undefined && (
                            <div className="text-center p-4 bg-indigo-50 rounded-lg">
                              <div className="text-2xl font-bold text-indigo-700">
                                {studentProgress.study_efficiency.toFixed(1)}
                              </div>
                              <p className="text-sm text-indigo-600">Study Efficiency</p>
                            </div>
                          )}
                          {studentProgress.average_quiz_duration !== undefined && (
                            <div className="text-center p-4 bg-cyan-50 rounded-lg">
                              <div className="text-2xl font-bold text-cyan-700">
                                {Math.round(studentProgress.average_quiz_duration)}m
                              </div>
                              <p className="text-sm text-cyan-600">Avg Duration</p>
                            </div>
                          )}
                          {studentProgress.days_active !== undefined && (
                            <div className="text-center p-4 bg-rose-50 rounded-lg">
                              <div className="text-2xl font-bold text-rose-700">
                                {studentProgress.days_active}
                              </div>
                              <p className="text-sm text-rose-600">Active Days</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Subject Performance Analysis */}
                  {studentProgress.subject_performance && Object.keys(studentProgress.subject_performance).length > 0 && (
                    <Card className="bg-white border shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-purple-500" />
                          Subject Performance Analysis
                          {studentProgress.strongest_subject && (
                            <Badge className="bg-green-100 text-green-800 ml-2">
                              Best: {studentProgress.strongest_subject}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(studentProgress.subject_performance).map(([subject, performance]) => (
                            <div key={subject} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-800">{subject}</span>
                                <div className="text-sm text-gray-600">
                                  {performance.accuracy.toFixed(1)}% ({performance.correct_answers}/{performance.questions_answered})
                                </div>
                              </div>
                              <div className="relative">
                                <Progress value={performance.accuracy} className="h-3" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-medium text-white drop-shadow-sm">
                                    {performance.accuracy.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Recommendations */}
                        {studentProgress.progression_recommendations && studentProgress.progression_recommendations.length > 0 && (
                          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" />
                              Recommendations
                            </h4>
                            <ul className="space-y-1">
                              {studentProgress.progression_recommendations.map((rec, index) => (
                                <li key={index} className="text-sm text-blue-700 flex items-center gap-2">
                                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Difficulty Progression */}
                  {studentProgress.difficulty_performance && Object.keys(studentProgress.difficulty_performance).length > 0 && (
                    <Card className="bg-white border shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-red-500" />
                          Difficulty Progression
                          {studentProgress.ready_for_harder && (
                            <Badge className="bg-green-100 text-green-800 ml-2">
                              Ready for Harder!
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(studentProgress.difficulty_performance).map(([difficulty, performance]) => (
                            <div key={difficulty} className={`p-4 rounded-lg border-2 ${
                              difficulty === 'easy' ? 'border-green-200 bg-green-50' :
                              difficulty === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                              'border-red-200 bg-red-50'
                            }`}>
                              <div className="text-center">
                                <div className={`text-2xl font-bold mb-2 ${
                                  difficulty === 'easy' ? 'text-green-700' :
                                  difficulty === 'medium' ? 'text-yellow-700' :
                                  'text-red-700'
                                }`}>
                                  {performance.accuracy.toFixed(0)}%
                                </div>
                                <div className="text-sm font-medium text-gray-700 capitalize mb-1">
                                  {difficulty}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {performance.correct_answers}/{performance.questions_answered} correct
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  )
}

export default QuizDashboard